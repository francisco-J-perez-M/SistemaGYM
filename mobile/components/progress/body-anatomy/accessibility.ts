import type { BodyRegionSet } from './data/bodyRegions.generated';
import { labelForFragment, labelForGroup, type GroupLabelOverrides } from './labels';

/**
 * How the diagram presents itself to VoiceOver/TalkBack.
 *
 * - `auto` (default): `groups` under `selectByGroup`, `fragments` when tappable,
 *   `diagram` when read-only.
 * - `fragments` / `groups`: every piece (or every muscle) is separately
 *   reachable and selectable.
 * - `diagram`: one element describing the whole picture. Right for read-only
 *   diagrams, where 317 stops would be noise.
 * - `none`: hidden from assistive tech entirely.
 */
export type AccessibilityMode = 'auto' | 'fragments' | 'groups' | 'diagram' | 'none';

/** One focusable overlay rectangle, positioned as a percentage of the container. */
export type AccessibilityTarget = {
  /**
   * Unique per rectangle. In group mode a bilateral muscle produces two — one
   * per side — which both commit the same `slug`, so this is what identifies
   * the rectangle itself.
   */
  id: string;
  /** The slug committed when this target is activated. */
  slug: string;
  label: string;
  selected: boolean;
  left: number;
  top: number;
  width: number;
  height: number;
};

type Box = { x: number; y: number; width: number; height: number };

export function parseViewBox(viewBox: string): Box {
  const [x = 0, y = 0, width = 1, height = 1] = viewBox.split(/\s+/).map(Number);
  return { x, y, width, height };
}

export function resolveAccessibilityMode(
  mode: AccessibilityMode,
  isInteractive: boolean,
  selectByGroup: boolean,
): Exclude<AccessibilityMode, 'auto'> {
  if (mode !== 'auto') return mode;
  if (!isInteractive) return 'diagram';
  return selectByGroup ? 'groups' : 'fragments';
}

const VIEW_LABELS: Record<string, string> = { front: 'front view', back: 'back view' };
const GENDER_LABELS: Record<string, string> = { male: 'male', female: 'female' };

/** Prose for the whole diagram, replacing the old `"male-body-front"` slug. */
export function diagramLabel(gender: string, view: string): string {
  const genderLabel = GENDER_LABELS[gender] ?? gender;
  const viewLabel = VIEW_LABELS[view] ?? view;
  return `Human body diagram, ${genderLabel}, ${viewLabel}`;
}

function unionBox(first: Box, second: Box): Box {
  const minX = Math.min(first.x, second.x);
  const minY = Math.min(first.y, second.y);
  const maxX = Math.max(first.x + first.width, second.x + second.width);
  const maxY = Math.max(first.y + first.height, second.y + second.height);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * Builds the overlay rectangles for one region set.
 *
 * Sorted by area descending, because bounding boxes of adjacent muscles do
 * overlap — on male/front, 21% of group-box pairs intersect, and `adductors`
 * sits 92% inside `quadriceps`. Painting the largest first leaves the smaller
 * box on top, so a fully contained muscle stays reachable instead of being
 * swallowed by its neighbour.
 */
export function accessibilityTargets(options: {
  regionSet: BodyRegionSet;
  mode: 'fragments' | 'groups';
  selectedSlugs: readonly string[];
  labels?: GroupLabelOverrides;
}): AccessibilityTarget[] {
  const { regionSet, mode, selectedSlugs, labels } = options;
  const viewBox = parseViewBox(regionSet.viewBox);
  const selected = new Set(selectedSlugs);

  // In group mode, bucket by muscle *and side*. Unioning a bilateral muscle into
  // one box produces a band spanning the entire body — the "forearms" rectangle
  // would cover the abdomen — so exploring by touch would report whatever muscle
  // owned the widest band rather than what is under the finger. Both sides still
  // commit the same slug, so selection behaviour is unchanged.
  const buckets = new Map<string, { slug: string; label: string; box: Box }>();
  for (const fragment of regionSet.fragments) {
    if (mode === 'fragments') {
      buckets.set(fragment.slug, {
        slug: fragment.slug,
        label: labelForFragment(fragment.slug, labels),
        box: fragment.bbox,
      });
      continue;
    }

    const id = fragment.side ? `${fragment.parentSlug}-${fragment.side}` : fragment.parentSlug;
    const existing = buckets.get(id);
    if (existing) {
      existing.box = unionBox(existing.box, fragment.bbox);
      continue;
    }

    const groupLabel = labelForGroup(fragment.parentSlug, labels);
    buckets.set(id, {
      slug: fragment.parentSlug,
      label: fragment.side
        ? `${fragment.side === 'left' ? 'Left' : 'Right'} ${groupLabel.toLowerCase()}`
        : groupLabel,
      box: fragment.bbox,
    });
  }

  return [...buckets.entries()]
    .map(([id, { slug, label, box }]) => ({
      id,
      slug,
      label,
      selected: selected.has(slug),
      // The container's aspect ratio is set from this same viewBox, so the SVG
      // fills it exactly and a plain linear map to percentages is correct.
      // Two of the four viewBoxes have a non-zero origin — hence the subtraction.
      left: ((box.x - viewBox.x) / viewBox.width) * 100,
      top: ((box.y - viewBox.y) / viewBox.height) * 100,
      width: (box.width / viewBox.width) * 100,
      height: (box.height / viewBox.height) * 100,
    }))
    .sort((first, second) => second.width * second.height - first.width * first.height);
}
