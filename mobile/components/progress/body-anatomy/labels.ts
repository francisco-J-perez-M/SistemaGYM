import { FRAGMENTS_BY_PARENT, GROUP_SLUGS } from './data/bodyRegions.generated';
import type {
  BodyFragmentAxis,
  BodyFragmentSide,
  GroupSlug,
} from './data/bodyRegions.generated';
import { FRAGMENT_BY_SLUG } from './lookups';

/**
 * Display names, written in sentence case so they compose: qualifiers are
 * prepended and the group name is lowercased, giving "Upper left abdominals"
 * rather than "Upper left Abdominals".
 *
 * Override any of these by passing `labels` to the label helpers — the shape is
 * a partial map, so an app localizing to French supplies only what it needs.
 */
export const GROUP_LABELS: Readonly<Record<GroupSlug, string>> = {
  'abs': 'Abdominales',
  'adductors': 'Aductores',
  'ankles': 'Tobillos',
  'biceps': 'Bíceps',
  'calves': 'Pantorrillas',
  'chest': 'Pecho',
  'deltoids': 'Hombros',
  'feet': 'Pies',
  'forearm': 'Antebrazos',
  'gluteal': 'Glúteos',
  'hair': 'Cabello',
  'hamstring': 'Isquiotibiales',
  'hands': 'Manos',
  'head': 'Cabeza',
  'knees': 'Rodillas',
  'lower-back': 'Lumbar',
  'neck': 'Cuello',
  'obliques': 'Oblicuos',
  'quadriceps': 'Cuádriceps',
  'tibialis': 'Tibial',
  'trapezius': 'Trapecio',
  'triceps': 'Tríceps',
  'upper-back': 'Espalda alta',
};

export type GroupLabelOverrides = Partial<Record<GroupSlug, string>>;

export type MuscleGroup = {
  slug: GroupSlug;
  label: string;
  /** Fragments carrying this group across *all four* gender x view sets. */
  fragmentCount: number;
};

/**
 * Every muscle group with its display name and size, sorted by slug — enough to
 * render a picker, a legend, or a settings list without touching the raw data.
 */
export const MUSCLE_GROUPS: readonly MuscleGroup[] = GROUP_SLUGS.map((slug) => ({
  slug,
  label: GROUP_LABELS[slug],
  fragmentCount: FRAGMENTS_BY_PARENT[slug].length,
}));

function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Display name for a muscle group. Unknown slugs are returned unchanged rather
 * than throwing, so a stale identifier in stored user data still renders
 * something a person can read.
 */
export function labelForGroup(groupSlug: string, labels?: GroupLabelOverrides): string {
  return labels?.[groupSlug as GroupSlug] ?? GROUP_LABELS[groupSlug as GroupSlug] ?? groupSlug;
}

export type FragmentDescription = {
  group: GroupSlug | string;
  groupLabel: string;
  side: BodyFragmentSide;
  axis: BodyFragmentAxis;
  /** e.g. "Upper left abdominals" */
  label: string;
};

/**
 * Everything needed to describe one fragment in prose — the pieces separately,
 * plus the composed label — for accessibility labels, legends, and summaries.
 */
export function describeFragment(
  fragmentSlug: string,
  labels?: GroupLabelOverrides,
): FragmentDescription {
  const fragment = FRAGMENT_BY_SLUG[fragmentSlug];

  if (!fragment) {
    return { group: fragmentSlug, groupLabel: fragmentSlug, side: null, axis: null, label: fragmentSlug };
  }

  const groupLabel = labelForGroup(fragment.parentSlug, labels);
  // Axis before side reads the way people say it: "upper left abs", not
  // "left upper abs".
  const qualifiers = [fragment.axis, fragment.side].filter(Boolean).join(' ');
  const label = qualifiers
    ? capitalizeFirst(`${qualifiers} ${groupLabel.toLowerCase()}`)
    : groupLabel;

  return { group: fragment.parentSlug, groupLabel, side: fragment.side, axis: fragment.axis, label };
}

/**
 * Display name for a single fragment, e.g. `"abs-male-front-1"` ->
 * `"Upper left abdominals"`. Falls back to the raw slug when it is unknown.
 */
export function labelForFragment(fragmentSlug: string, labels?: GroupLabelOverrides): string {
  return describeFragment(fragmentSlug, labels).label;
}

/**
 * Display name for whichever identifier `onFragmentPress` reported, without the
 * caller having to know which selection mode produced it.
 */
export function labelForSlug(slug: string, labels?: GroupLabelOverrides): string {
  return slug in GROUP_LABELS ? labelForGroup(slug, labels) : labelForFragment(slug, labels);
}
