import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Text,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  runOnJS,
  withTiming,
} from 'react-native-reanimated';
import { BODY_REGIONS } from './data/bodyRegions.generated';
import type { BodyFragment, BodySlug } from './data/bodyRegions.generated';
import { useReducedMotion } from './hooks/useReducedMotion';
import { useScreenReaderEnabled } from './hooks/useScreenReaderEnabled';
import { isFragmentSelected, selectionKeyForFragment } from './selection';
import { assertValidRegion, validateScaleProps, validateSelectedSlugs } from './validate';
import {
  accessibilityTargets,
  diagramLabel,
  resolveAccessibilityMode,
  type AccessibilityMode,
} from './accessibility';
import type { GroupLabelOverrides } from './labels';
import {
  contentPointToViewBox,
  findNearestFragment,
  toleranceInViewBoxUnits,
} from './hitTest';
import { parseViewBox } from './accessibility';

export type Gender = 'male' | 'female';
export type BodyView = 'front' | 'back';

/**
 * A slug the component will accept. Written as a union with `string & {}` so
 * editors still autocomplete the 340 known identifiers while plain `string[]`
 * state — which every existing consumer has — keeps typechecking.
 */
export type BodySlugInput = BodySlug | (string & {});

/** Imperative controls, reached with a `ref` on `BodySilhouette`. */
export type BodySilhouetteHandle = {
  /** Back to `minScale`, centred. */
  resetZoom: (options?: { animated?: boolean }) => void;
  /** Zoom to an absolute scale, clamped to `minScale`/`maxScale`. */
  zoomTo: (scale: number, options?: { animated?: boolean }) => void;
  /** Frame one muscle group, as far as `maxScale` allows. */
  zoomToGroup: (groupSlug: string, options?: { animated?: boolean }) => void;
  /** The current scale. */
  getScale: () => number;
};

export type BodySilhouetteProps = {
  gender: Gender;
  view: BodyView;
  /** Identifiers to highlight — fragment slugs, or group slugs under `selectByGroup`. */
  selectedSlugs: readonly BodySlugInput[];
  /**
   * Per-slug fill. Called for **every** fragment, selected or not, so a heatmap
   * needs no selection state at all; return `undefined` to fall back to
   * `selectedFragmentColor` / `unselectedFragmentColor`.
   *
   * Receives whichever identifier matches the active mode — the group slug under
   * `selectByGroup`, the fragment slug otherwise — so it lines up with
   * `selectedSlugs` and `onFragmentPress` instead of disagreeing with them.
   */
  colorForSlug?: (slug: BodySlug) => string | undefined;
  onFragmentPress?: (fragmentSlug: BodySlug) => void;
  // Whole-muscle mode: selectedSlugs then holds parent slugs ("abs", "chest")
  // instead of fragment slugs, and onFragmentPress reports the group of the
  // tapped fragment — every piece of one muscle commits the same identifier,
  // so toggling works no matter which piece was touched.
  selectByGroup?: boolean;
  zoomable?: boolean;
  /** Applied to the outer container, after the built-in width/aspect-ratio rules. */
  style?: StyleProp<ViewStyle>;
  /** Also derives a per-fragment testID, e.g. `${testID}-abs-male-front-1`. */
  testID?: string;
  /**
   * How the diagram presents itself to VoiceOver/TalkBack. Defaults to `auto`:
   * whole muscles under `selectByGroup`, individual fragments when tappable, and
   * a single element when read-only.
   */
  accessibilityMode?: AccessibilityMode;
  /** Overrides the spoken description of the diagram as a whole. */
  accessibilityLabel?: string;
  /** Spoken after each muscle's name, e.g. "Double tap to select". */
  fragmentAccessibilityHint?: string;
  /** Localized muscle-group names, used for spoken labels. */
  labels?: GroupLabelOverrides;
  /**
   * How far, in points, a tap may miss every fragment and still select the
   * nearest one. Off by default, because a tap on empty space selecting nothing
   * is documented behaviour; `12` is a good starting value for the small
   * fragments this library is made of.
   */
  hitTolerance?: number;
  /** Called when a tap selected nothing, even after `hitTolerance`. */
  onPressMiss?: () => void;
  /** Called whenever the zoom level settles on a new value. */
  onZoomChange?: (scale: number) => void;
  /** Reset zoom and pan when `gender` or `view` changes. Defaults to `true`. */
  resetZoomOnViewChange?: boolean;
  outlineColor?: string;
  unselectedFragmentColor?: string;
  selectedFragmentColor?: string;
  zoomButtonBackgroundColor?: string;
  zoomButtonBorderColor?: string;
  zoomButtonIconColor?: string;
  zoomInAccessibilityLabel?: string;
  zoomOutAccessibilityLabel?: string;
  minScale?: number;
  maxScale?: number;
  zoomStep?: number;
  zoomAnimationDurationMs?: number;
};

function viewBoxAspectRatio(viewBox: string): number {
  const tokens = viewBox.split(' ');
  const width = Number(tokens[2]);
  const height = Number(tokens[3]);
  return width / height;
}

// Only four gender/view combinations exist (BODY_REGIONS is static generated
// data), so their aspect ratios are precomputed once here rather than built
// as a fresh style object inline on every render.
const CONTAINER_ASPECT_RATIO_STYLE: Record<string, { aspectRatio: number }> = {
  'male-front': { aspectRatio: viewBoxAspectRatio(BODY_REGIONS.male.front.viewBox) },
  'male-back': { aspectRatio: viewBoxAspectRatio(BODY_REGIONS.male.back.viewBox) },
  'female-front': { aspectRatio: viewBoxAspectRatio(BODY_REGIONS.female.front.viewBox) },
  'female-back': { aspectRatio: viewBoxAspectRatio(BODY_REGIONS.female.back.viewBox) },
};

// How far a finger may wander between touch-down and release and still count as
// a tap. Beyond this Gesture Handler fails the tap, so the touch pans (or is
// claimed by a parent ScrollView) without selecting anything.
const TAP_MAX_DISTANCE = 10;

// Gesture Handler's own default is 500ms, which silently drops deliberate slow
// presses — including from users with limited motor control. Generous, but
// still bounded, so a finger left resting on the diagram never selects.
const TAP_MAX_DURATION_MS = 1500;

// How much of the container a `zoomToGroup` target should fill, leaving the rest
// as margin so the muscle is framed rather than cropped to its exact bounds.
const ZOOM_TO_GROUP_FILL = 0.8;

/**
 * One fragment, memoised.
 *
 * A diagram is up to 92 paths and every selection change re-renders the parent.
 * Without this, all of them re-render to produce identical native props; with
 * it, only the one or two whose fill actually changed do any work.
 *
 * `onPressIn` is built here rather than in the parent's map, so the parent does
 * not allocate a fresh closure per fragment per render — which would defeat the
 * memo on every one of them.
 */
const FragmentPath = memo(function FragmentPath({
  fragment,
  fill,
  testID,
  onPressIn,
}: {
  fragment: BodyFragment;
  fill: string;
  testID?: string;
  onPressIn?: (slug: string) => void;
}) {
  const handlePressIn = useCallback(() => onPressIn?.(fragment.slug), [onPressIn, fragment.slug]);

  return (
    <Path
      d={fragment.pathData}
      fill={fill}
      testID={testID}
      onPressIn={onPressIn ? handlePressIn : undefined}
    />
  );
});

function clampWorklet(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

function maxTranslateWorklet(currentScale: number, containerSize: number) {
  'worklet';
  return Math.max(0, (containerSize * (currentScale - 1)) / 2);
}

function BodySilhouetteInner({
  gender,
  view,
  selectedSlugs,
  colorForSlug,
  onFragmentPress,
  selectByGroup = false,
  zoomable = true,
  style,
  testID,
  accessibilityMode = 'auto',
  accessibilityLabel,
  fragmentAccessibilityHint,
  labels,
  hitTolerance = 0,
  onPressMiss,
  onZoomChange,
  resetZoomOnViewChange = true,
  outlineColor = '#333333',
  unselectedFragmentColor = '#D6D6D6',
  selectedFragmentColor = '#2563EB',
  zoomButtonBackgroundColor = '#FFFFFF',
  zoomButtonBorderColor = '#D6D6D6',
  zoomButtonIconColor = '#333333',
  zoomInAccessibilityLabel = 'Zoom in',
  zoomOutAccessibilityLabel = 'Zoom out',
  minScale = 1,
  maxScale = 3,
  zoomStep = 0.5,
  zoomAnimationDurationMs = 200,
}: BodySilhouetteProps, ref: React.Ref<BodySilhouetteHandle>) {
  // Fails loudly and by name, rather than as a `Cannot read properties of
  // undefined` two lines later, for the JS consumers TypeScript can't protect.
  assertValidRegion(gender, view);
  validateScaleProps(minScale, maxScale, zoomStep);
  validateSelectedSlugs(selectedSlugs, selectByGroup);

  // Rebuilt only when the selection array identity changes, so a render costs
  // one pass over the selection instead of a scan per fragment.
  const selectedKeys = useMemo(() => new Set<string>(selectedSlugs), [selectedSlugs]);

  const reducedMotion = useReducedMotion();
  const screenReaderEnabled = useScreenReaderEnabled();
  const regionSet = BODY_REGIONS[gender][view];
  const aspectRatioStyle = CONTAINER_ASPECT_RATIO_STYLE[`${gender}-${view}`];

  // Seeded from minScale, not a hardcoded 1: with `minScale={1.5}` the diagram
  // would otherwise mount below its own floor, and the pan gesture — which
  // activates only above minScale — would stay dead until the first pinch.
  const scale = useSharedValue(minScale);
  const savedScale = useSharedValue(minScale);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const containerWidth = useSharedValue(0);
  const containerHeight = useSharedValue(0);

  // Which fragment the current touch landed on. A plain ref, not a shared
  // value, because the tap gesture below runs on the JS thread — nothing here
  // is ever read from a worklet.
  const pressedFragmentRef = useRef<string | null>(null);

  // A zoom/pan carried over onto a different gender or view is confusing,
  // not helpful — always start fresh when the displayed image changes.
  useEffect(() => {
    if (!resetZoomOnViewChange) return;
    scale.value = minScale;
    savedScale.value = minScale;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [
    gender,
    view,
    minScale,
    resetZoomOnViewChange,
    scale,
    savedScale,
    translateX,
    translateY,
    savedTranslateX,
    savedTranslateY,
  ]);

  // Reported from a reanimated reaction rather than from inside a gesture
  // callback: crossing to JS with runOnJS from a gesture worklet crashes Hermes
  // in WorkletEventHandler here (see the tap gesture below), while a reaction is
  // a separate context and does not go through it.
  const onZoomChangeRef = useRef(onZoomChange);
  onZoomChangeRef.current = onZoomChange;

  // Consumers almost always pass inline arrows, so these change identity every
  // render. Reading them through refs lets the gestures below be memoised on
  // values that actually change, without going stale.
  const onFragmentPressRef = useRef(onFragmentPress);
  onFragmentPressRef.current = onFragmentPress;
  const onPressMissRef = useRef(onPressMiss);
  onPressMissRef.current = onPressMiss;

  const reportZoom = useCallback((next: number) => {
    onZoomChangeRef.current?.(next);
  }, []);

  useAnimatedReaction(
    () => scale.value,
    (current, previous) => {
      if (previous !== null && current !== previous) {
        runOnJS(reportZoom)(current);
      }
    },
    [reportZoom],
  );

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
    .onUpdate((event) => {
      const nextScale = clampWorklet(savedScale.value * event.scale, minScale, maxScale);
      scale.value = nextScale;
      // Clamped live, not only in onEnd: pinching back out used to let the
      // silhouette drift outside its frame for the length of the gesture and
      // then snap into place on release.
      const maxX = maxTranslateWorklet(nextScale, containerWidth.value);
      const maxY = maxTranslateWorklet(nextScale, containerHeight.value);
      translateX.value = clampWorklet(translateX.value, -maxX, maxX);
      translateY.value = clampWorklet(translateY.value, -maxY, maxY);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
        }),
    // Worklets capture these by value, so a changed bound needs a fresh gesture.
    [minScale, maxScale, scale, savedScale, translateX, translateY, containerWidth, containerHeight],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
    // Without manual activation this claims any drag that starts on the
    // diagram — including at 1x, where `onUpdate` has nothing to do. That
    // silently makes a surrounding ScrollView unscrollable wherever the
    // diagram sits, which is most of the screen. Deciding per touch keeps the
    // check on the UI thread: no JS round-trip, no extra React state.
    .manualActivation(true)
    .onTouchesMove((_event, stateManager) => {
      if (savedScale.value > minScale) {
        stateManager.activate();
      } else {
        stateManager.fail();
      }
    })
    .onUpdate((event) => {
      const maxX = maxTranslateWorklet(savedScale.value, containerWidth.value);
      const maxY = maxTranslateWorklet(savedScale.value, containerHeight.value);
      translateX.value = clampWorklet(savedTranslateX.value + event.translationX, -maxX, maxX);
      translateY.value = clampWorklet(savedTranslateY.value + event.translationY, -maxY, maxY);
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
        }),
    [minScale, savedScale, translateX, translateY, savedTranslateX, savedTranslateY, containerWidth, containerHeight],
  );

  // Selection is deliberately NOT committed by the Path's own press handler.
  // `onPressIn` fires the instant a finger lands, so committing there records a
  // body part whenever the user merely starts a pan or a scroll over one. The
  // Path records only *which* fragment was touched; this gesture decides
  // whether the touch was a tap at all, letting Gesture Handler arbitrate
  // tap-vs-pan natively instead of hand-rolling it from flags.
  //
  // `onPress` is not an alternative: Fabric cancels it on the slightest finger
  // movement, which is exactly why react-native-body-highlighter (the origin of
  // this path data) ships a patch swapping `onPress` for `onPressIn`.
  //
  // `runOnJS(true)` makes these callbacks plain JS functions rather than
  // worklets, so `onFragmentPress` can be called directly. Crossing back to JS
  // from a gesture worklet via `runOnJS()` crashes Hermes inside
  // WorkletEventHandler here; this sidesteps that boundary entirely.
  const commitTap = useCallback(
    (event: { x: number; y: number }, success: boolean) => {
      const pressedSlug = pressedFragmentRef.current;
      // Cleared on commit as well, so a second tap landing on empty space
      // (no fragment underneath, so no `onPressIn`) can't re-commit this one.
      pressedFragmentRef.current = null;
      if (!success) return;

      // A fragment's own `onPressIn` fired, so the finger was over a path.
      if (pressedSlug !== null) {
        // Group mode commits the muscle's parent slug; fragment mode passes the
        // exact piece through untouched.
        onFragmentPressRef.current?.(selectionKeyForFragment(pressedSlug, selectByGroup) as BodySlug);
        return;
      }

      // Nothing underneath. Many fragments are only a few points across, so a
      // near miss is the common case rather than a deliberate tap on the
      // background — but only when the caller has opted in.
      const viewBox = parseViewBox(regionSet.viewBox);
      const nearest =
        hitTolerance > 0
          ? findNearestFragment(
              contentPointToViewBox(
                { x: event.x, y: event.y },
                containerWidth.value,
                containerHeight.value,
                viewBox,
              ),
              regionSet.fragments,
              toleranceInViewBoxUnits(hitTolerance, containerWidth.value, scale.value, viewBox.width),
            )
          : null;

      if (nearest) {
        onFragmentPressRef.current?.(selectionKeyForFragment(nearest.slug, selectByGroup) as BodySlug);
        return;
      }

      onPressMissRef.current?.();
    },
    [selectByGroup, hitTolerance, regionSet, containerWidth, containerHeight, scale],
  );

  const tapGesture = useMemo(
    () =>
      Gesture.Tap()
        .maxDistance(TAP_MAX_DISTANCE)
        .maxDuration(TAP_MAX_DURATION_MS)
        .runOnJS(true)
        .onTouchesDown(() => {
          // Per-touch reset. NOT `onFinalize`: when this gesture is composed with
          // the reanimated pinch/pan worklets below, `onFinalize` is delivered to JS
          // *before* `onEnd`, so clearing there wipes the slug before `onEnd` reads
          // it and nothing is ever selected. Resetting on touch-down instead is
          // ordered by the native touch stream, so it holds in both cases.
          pressedFragmentRef.current = null;
        })
        .onEnd(commitTap),
    [commitTap],
  );

  const composedGesture = useMemo(
    () => Gesture.Simultaneous(tapGesture, pinchGesture, panGesture),
    [tapGesture, pinchGesture, panGesture],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  /**
   * The one place zoom is committed, so the button steps and the imperative
   * methods cannot drift apart. `targetTranslate` is optional: omit it to keep
   * the current pan (clamped to the new scale), pass it to move somewhere.
   */
  const applyZoom = (
    nextScaleRaw: number,
    options?: { animated?: boolean; targetTranslate?: { x: number; y: number } },
  ) => {
    const animated = options?.animated ?? true;
    const animate = (target: number) =>
      !animated || reducedMotion ? target : withTiming(target, { duration: zoomAnimationDurationMs });

    const nextScale = clampWorklet(nextScaleRaw, minScale, maxScale);
    savedScale.value = nextScale;
    scale.value = animate(nextScale);

    // Zooming out shrinks the pannable area, so a translation that was legal at
    // the old scale can sit outside the new one. Re-clamped on every change, not
    // only at the floor, or stepping 3x -> 2.5x while panned to an edge leaves
    // the silhouette hanging outside its frame.
    const maxX = maxTranslateWorklet(nextScale, containerWidth.value);
    const maxY = maxTranslateWorklet(nextScale, containerHeight.value);
    const requested = options?.targetTranslate ?? { x: translateX.value, y: translateY.value };
    const nextTranslateX = clampWorklet(requested.x, -maxX, maxX);
    const nextTranslateY = clampWorklet(requested.y, -maxY, maxY);

    savedTranslateX.value = nextTranslateX;
    savedTranslateY.value = nextTranslateY;
    translateX.value = animate(nextTranslateX);
    translateY.value = animate(nextTranslateY);
  };

  const applyZoomStep = (direction: 1 | -1) => {
    applyZoom(savedScale.value + direction * zoomStep);
  };

  useImperativeHandle(
    ref,
    (): BodySilhouetteHandle => ({
      getScale: () => scale.value,
      resetZoom: (options) =>
        applyZoom(minScale, { animated: options?.animated, targetTranslate: { x: 0, y: 0 } }),
      zoomTo: (nextScale, options) => applyZoom(nextScale, { animated: options?.animated }),
      zoomToGroup: (groupSlug, options) => {
        const boxes = regionSet.fragments
          .filter((fragment) => fragment.parentSlug === groupSlug)
          .map((fragment) => fragment.bbox);
        if (boxes.length === 0) return;

        const minX = Math.min(...boxes.map((box) => box.x));
        const minY = Math.min(...boxes.map((box) => box.y));
        const maxBoxX = Math.max(...boxes.map((box) => box.x + box.width));
        const maxBoxY = Math.max(...boxes.map((box) => box.y + box.height));

        const viewBox = parseViewBox(regionSet.viewBox);
        const widthFraction = (maxBoxX - minX) / viewBox.width;
        const heightFraction = (maxBoxY - minY) / viewBox.height;
        if (widthFraction <= 0 || heightFraction <= 0) return;

        // Leave a margin so the muscle is framed rather than cropped to its
        // exact bounds.
        const nextScale = clampWorklet(
          Math.min(1 / widthFraction, 1 / heightFraction) * ZOOM_TO_GROUP_FILL,
          minScale,
          maxScale,
        );

        // Where the group's centre currently sits in unscaled content space...
        const centreX = ((minX + maxBoxX) / 2 - viewBox.x) / viewBox.width * containerWidth.value;
        const centreY = ((minY + maxBoxY) / 2 - viewBox.y) / viewBox.height * containerHeight.value;
        // ...and the translation that brings it to the middle of the container.
        // Inverts `screen = centre + (content - centre) * scale + translate`.
        applyZoom(nextScale, {
          animated: options?.animated,
          targetTranslate: {
            x: (containerWidth.value / 2 - centreX) * nextScale,
            y: (containerHeight.value / 2 - centreY) * nextScale,
          },
        });
      },
    }),
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    containerWidth.value = event.nativeEvent.layout.width;
    containerHeight.value = event.nativeEvent.layout.height;
  };

  const handleFragmentPressIn = useCallback((slug: string) => {
    pressedFragmentRef.current = slug;
  }, []);

  const resolvedAccessibilityMode = resolveAccessibilityMode(
    accessibilityMode,
    Boolean(onFragmentPress),
    selectByGroup,
  );

  // SVG paths cannot be made properly accessible: react-native-svg's Path
  // accepts only `accessible`, `accessibilityLabel`, and `testID` — a role, a
  // selected state, and an activation handler are all dropped, so a screen
  // reader could hear a muscle's name but never its state and never select it.
  // Real views on top can carry the full contract. They are mounted only while a
  // screen reader is actually running, so they never sit in the way of anyone
  // else's taps.
  const overlayTargets =
    screenReaderEnabled &&
    (resolvedAccessibilityMode === 'fragments' || resolvedAccessibilityMode === 'groups')
      ? accessibilityTargets({
          regionSet,
          mode: resolvedAccessibilityMode,
          selectedSlugs,
          labels,
        })
      : null;

  const accessibilityOverlay = overlayTargets && (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {overlayTargets.map((target) => (
        <Pressable
          key={target.id}
          accessible
          accessibilityRole="button"
          accessibilityLabel={target.label}
          accessibilityState={{ selected: target.selected }}
          accessibilityHint={fragmentAccessibilityHint}
          testID={testID ? `${testID}-a11y-${target.id}` : undefined}
          onPress={() => onFragmentPress?.(target.slug as BodySlug)}
          style={{
            position: 'absolute',
            left: `${target.left}%`,
            top: `${target.top}%`,
            width: `${target.width}%`,
            height: `${target.height}%`,
          }}
        />
      ))}
    </View>
  );

  // Silent when the overlay is presenting the fragments individually, and when
  // the caller opted out entirely — otherwise it would announce itself on top
  // of, or instead of, them. The label is dropped along with it, so `none`
  // leaves nothing behind for assistive tech to find.
  const isDiagramAccessible = overlayTargets === null && resolvedAccessibilityMode !== 'none';

  const diagramSvg = (
    <Svg
      viewBox={regionSet.viewBox}
      width="100%"
      height="100%"
      accessible={isDiagramAccessible}
      accessibilityLabel={
        isDiagramAccessible ? (accessibilityLabel ?? diagramLabel(gender, view)) : undefined
      }>
      <Path d={regionSet.outlineD} stroke={outlineColor} strokeWidth={2} fill="none" vectorEffect="non-scaling-stroke" />
      {regionSet.fragments.map((fragment) => {
        const isSelected = isFragmentSelected(fragment, selectedKeys, selectByGroup);
        // The same identifier the consumer holds in `selectedSlugs` and receives
        // from `onFragmentPress`, so one Map keyed by slug drives all three.
        const colorKey = selectByGroup ? fragment.parentSlug : fragment.slug;
        const fillColor =
          colorForSlug?.(colorKey) ?? (isSelected ? selectedFragmentColor : unselectedFragmentColor);
        return (
          <FragmentPath
            key={fragment.slug}
            fragment={fragment}
            fill={fillColor}
            testID={testID ? `${testID}-${fragment.slug}` : undefined}
            onPressIn={onFragmentPress ? handleFragmentPressIn : undefined}
          />
        );
      })}
    </Svg>
  );

  const diagramContent = (
    <>
      {diagramSvg}
      {accessibilityOverlay}
    </>
  );

  if (!zoomable) {
    // With no gestures at all, a read-only diagram works without the consumer
    // mounting GestureHandlerRootView — worth preserving, so the detector is
    // added only when there is actually something to select.
    if (!onFragmentPress) {
      return (
        <View testID={testID} style={[localStyles.selfSizingContainer, aspectRatioStyle, style]}>
          {diagramContent}
        </View>
      );
    }
    return (
      <View testID={testID} style={[localStyles.selfSizingContainer, aspectRatioStyle, style]}>
        <GestureDetector gesture={tapGesture}>
          <View style={localStyles.fill}>{diagramContent}</View>
        </GestureDetector>
      </View>
    );
  }

  const zoomButtonStyle = { backgroundColor: zoomButtonBackgroundColor, borderColor: zoomButtonBorderColor };

  return (
    <View
      testID={testID}
      style={[localStyles.zoomableContainer, aspectRatioStyle, style]}
      onLayout={handleLayout}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[localStyles.fill, animatedStyle]}>{diagramContent}</Animated.View>
      </GestureDetector>
      <View style={localStyles.zoomControls}>
        <Pressable
          style={[localStyles.zoomButton, zoomButtonStyle]}
          onPress={() => applyZoomStep(-1)}
          hitSlop={8}
          testID={testID ? `${testID}-zoom-out` : undefined}
          accessibilityRole="button"
          accessibilityLabel={zoomOutAccessibilityLabel}>
          <Text style={[localStyles.zoomButtonGlyph, { color: zoomButtonIconColor }]}>−</Text>
        </Pressable>
        <Pressable
          style={[localStyles.zoomButton, zoomButtonStyle]}
          onPress={() => applyZoomStep(1)}
          hitSlop={8}
          testID={testID ? `${testID}-zoom-in` : undefined}
          accessibilityRole="button"
          accessibilityLabel={zoomInAccessibilityLabel}>
          <Text style={[localStyles.zoomButtonGlyph, { color: zoomButtonIconColor }]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  // Height comes from the viewBox aspect ratio applied alongside these, so the
  // component sizes itself from its width — never set `height` here as well,
  // or the two rules fight and the diagram overflows its parent.
  selfSizingContainer: { width: '100%' },
  zoomableContainer: { width: '100%', overflow: 'hidden' },
  fill: { width: '100%', height: '100%' },
  zoomControls: { position: 'absolute', bottom: 8, end: 8, flexDirection: 'row', gap: 8 },
  zoomButton: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  zoomButtonGlyph: { fontSize: 16, fontWeight: '600', lineHeight: 18 },
});

export const BodySilhouette = forwardRef<BodySilhouetteHandle, BodySilhouetteProps>(
  BodySilhouetteInner,
);
