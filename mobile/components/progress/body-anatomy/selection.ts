import { BODY_REGIONS } from './data/bodyRegions.generated';
import type { BodyFragment } from './data/bodyRegions.generated';
import { FRAGMENT_BY_SLUG } from './lookups';

export type SelectionGender = keyof typeof BODY_REGIONS;
export type SelectionBodyView = 'front' | 'back';

// The identifier a tap commits, and the identifier highlight state is matched
// against, depend on the mode:
//
// - Fragment mode (default): every SVG piece stands alone — keys are fragment
//   slugs like "abs-male-front-1".
// - Group mode (`selectByGroup`): all pieces of one muscle act together — keys
//   are parent slugs like "abs". Because every fragment of a muscle commits
//   the SAME key, toggling works no matter which piece was tapped, which the
//   intersection-based alternative cannot guarantee.
export function selectionKeyForFragment(fragmentSlug: string, selectByGroup: boolean): string {
  if (!selectByGroup) return fragmentSlug;

  // An unknown slug can only come from a caller bug; falling back to the slug
  // itself keeps such mistakes visible in consumer state instead of throwing.
  return FRAGMENT_BY_SLUG[fragmentSlug]?.parentSlug ?? fragmentSlug;
}

export function isFragmentSelected(
  fragment: BodyFragment,
  selectedKeys: readonly string[] | ReadonlySet<string>,
  selectByGroup: boolean,
): boolean {
  const key = selectByGroup ? fragment.parentSlug : fragment.slug;
  // A Set is accepted so callers checking many fragments — the component checks
  // every one on each render — pay O(1) per lookup instead of scanning the array.
  return selectedKeys instanceof Set ? selectedKeys.has(key) : (selectedKeys as readonly string[]).includes(key);
}

// Convenience for consumers building labels, counters, or their own
// group-level logic on top of fragment-mode state.
export function fragmentSlugsForGroup(
  parentSlug: string,
  gender: SelectionGender,
  view: SelectionBodyView,
): string[] {
  return BODY_REGIONS[gender][view].fragments
    .filter((fragment) => fragment.parentSlug === parentSlug)
    .map((fragment) => fragment.slug);
}
