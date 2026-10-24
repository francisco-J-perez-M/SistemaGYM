import { BODY_REGIONS, GROUP_SLUGS } from './data/bodyRegions.generated';
import { FRAGMENT_BY_SLUG } from './lookups';

const PREFIX = '[body-anatomy]';

const GROUP_SLUG_SET = new Set<string>(GROUP_SLUGS);

// Warnings fire from render, which runs often — dedupe by message so a mistake
// is reported once rather than on every frame.
const alreadyWarned = new Set<string>();

function isDev(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__;
}

function warnOnce(message: string) {
  if (alreadyWarned.has(message)) return;
  alreadyWarned.add(message);
  console.warn(`${PREFIX} ${message}`);
}

/** Test-only: lets a spec assert on a warning that a previous spec already tripped. */
export function resetWarningsForTests() {
  alreadyWarned.clear();
}

/**
 * Rendering is impossible with a bad gender/view, so this throws rather than
 * warns — but with a message that names the valid values, instead of the
 * `Cannot read properties of undefined` a JS consumer gets today.
 */
export function assertValidRegion(gender: string, view: string) {
  if (BODY_REGIONS[gender as keyof typeof BODY_REGIONS]?.[view as 'front' | 'back']) return;

  throw new Error(
    `${PREFIX} No body data for gender="${gender}" view="${view}". ` +
      `gender must be "male" or "female", and view must be "front" or "back".`,
  );
}

export function validateScaleProps(minScale: number, maxScale: number, zoomStep: number) {
  if (!isDev()) return;

  if (!Number.isFinite(minScale) || minScale <= 0) {
    warnOnce(`minScale must be a positive number, got ${minScale}.`);
  }
  if (!Number.isFinite(maxScale) || maxScale <= 0) {
    warnOnce(`maxScale must be a positive number, got ${maxScale}.`);
  }
  if (minScale > maxScale) {
    warnOnce(
      `minScale (${minScale}) is greater than maxScale (${maxScale}), so zooming is pinned to ${maxScale}. ` +
        `Did you mean to swap them?`,
    );
  }
  if (!Number.isFinite(zoomStep) || zoomStep <= 0) {
    warnOnce(`zoomStep must be a positive number, got ${zoomStep} — the +/- buttons will do nothing.`);
  }
}

/**
 * The most common way to use this library wrongly is to mix the two selection
 * modes: fragment slugs with `selectByGroup`, or group slugs without it. Either
 * way *nothing highlights and nothing errors*, which is a miserable thing to
 * debug — so name the exact mismatch.
 */
export function validateSelectedSlugs(selectedSlugs: readonly string[], selectByGroup: boolean) {
  if (!isDev()) return;

  for (const slug of selectedSlugs) {
    const isGroup = GROUP_SLUG_SET.has(slug);
    const isFragment = slug in FRAGMENT_BY_SLUG;

    if (selectByGroup && isFragment && !isGroup) {
      warnOnce(
        `selectedSlugs contains the fragment slug "${slug}", but selectByGroup is set, so slugs are ` +
          `matched against muscle groups like "${FRAGMENT_BY_SLUG[slug]!.parentSlug}". ` +
          `Nothing will highlight. Pass group slugs, or drop selectByGroup.`,
      );
    } else if (!selectByGroup && isGroup && !isFragment) {
      warnOnce(
        `selectedSlugs contains the group slug "${slug}", but selectByGroup is not set, so slugs are ` +
          `matched against individual fragments like "${slug}-male-front-1". ` +
          `Nothing will highlight. Set selectByGroup, or expand the group with fragmentSlugsForGroup().`,
      );
    } else if (!isGroup && !isFragment) {
      warnOnce(
        `selectedSlugs contains "${slug}", which is neither a muscle group nor a fragment. ` +
          `It will never highlight. Check GROUP_SLUGS or FRAGMENT_BY_SLUG for valid identifiers.`,
      );
    }
  }
}
