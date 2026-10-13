export { BodySilhouette } from './BodySilhouette';
export type {
  BodySilhouetteProps,
  BodySilhouetteHandle,
  BodySlugInput,
  Gender,
  BodyView,
} from './BodySilhouette';

export { BODY_REGIONS, FRAGMENTS_BY_PARENT, GROUP_SLUGS } from './data/bodyRegions.generated';
export type {
  BodyFragment,
  BodyFragmentBox,
  BodyFragmentSide,
  BodyFragmentAxis,
  BodyRegionSet,
  BodySlug,
  FragmentSlug,
  GroupSlug,
} from './data/bodyRegions.generated';

export { FRAGMENT_BY_SLUG } from './lookups';

export { accessibilityTargets, diagramLabel } from './accessibility';
export { contentPointToViewBox, findNearestFragment } from './hitTest';
export type { AccessibilityMode, AccessibilityTarget } from './accessibility';

export {
  GROUP_LABELS,
  MUSCLE_GROUPS,
  describeFragment,
  labelForFragment,
  labelForGroup,
  labelForSlug,
} from './labels';
export type { FragmentDescription, GroupLabelOverrides, MuscleGroup } from './labels';

export {
  selectionKeyForFragment,
  isFragmentSelected,
  fragmentSlugsForGroup,
} from './selection';
export type { SelectionGender, SelectionBodyView } from './selection';
