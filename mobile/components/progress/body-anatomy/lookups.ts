import { BODY_REGIONS } from './data/bodyRegions.generated';
import type { BodyFragment } from './data/bodyRegions.generated';

function buildFragmentBySlug(): Record<string, BodyFragment> {
  const map: Record<string, BodyFragment> = {};
  for (const gender of ['male', 'female'] as const) {
    for (const view of ['front', 'back'] as const) {
      for (const fragment of BODY_REGIONS[gender][view].fragments) {
        map[fragment.slug] = fragment;
      }
    }
  }
  return map;
}

// Computed once at import time — a few hundred fragments is negligible.
export const FRAGMENT_BY_SLUG: Record<string, BodyFragment> = buildFragmentBySlug();
