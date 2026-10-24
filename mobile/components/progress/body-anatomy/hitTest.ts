import type { BodyFragment } from './data/bodyRegions.generated';

export type Point = { x: number; y: number };

type ViewBox = { x: number; y: number; width: number; height: number };

/**
 * Maps a tap into the region set's viewBox units.
 *
 * Gesture Handler reports `x`/`y` in the handler view's own coordinate space,
 * already undoing the zoom/pan transform applied to that view — measured on a
 * simulator: at 2x, a touch whose transformed position was 43pt from the left
 * edge arrived as 113, exactly the untransformed content coordinate. So there
 * is no matrix to invert here, only a proportional map.
 *
 * The SVG fills the container exactly, because the container's aspect ratio is
 * set from this same viewBox. The origin is added back because two of the four
 * sets do not start at 0,0.
 *
 * If a platform ever reports these coordinates differently the result lands far
 * outside the body, and `findNearestFragment` then finds nothing within
 * tolerance — the near-miss simply does not fire, rather than selecting
 * something wrong.
 */
export function contentPointToViewBox(
  point: Point,
  containerWidth: number,
  containerHeight: number,
  viewBox: ViewBox,
): Point {
  if (containerWidth <= 0 || containerHeight <= 0) return { x: NaN, y: NaN };

  return {
    x: viewBox.x + (point.x / containerWidth) * viewBox.width,
    y: viewBox.y + (point.y / containerHeight) * viewBox.height,
  };
}

/** Screen points converted to viewBox units at the current zoom. */
export function toleranceInViewBoxUnits(
  tolerance: number,
  containerWidth: number,
  scale: number,
  viewBoxWidth: number,
): number {
  if (containerWidth <= 0 || scale <= 0) return 0;
  return (tolerance / (containerWidth * scale)) * viewBoxWidth;
}

/** Distance from a point to a rectangle; zero when the point is inside it. */
function distanceToBox(point: Point, box: BodyFragment['bbox']): number {
  const dx = Math.max(box.x - point.x, 0, point.x - (box.x + box.width));
  const dy = Math.max(box.y - point.y, 0, point.y - (box.y + box.height));
  return Math.hypot(dx, dy);
}

/**
 * The fragment a near-miss should be treated as hitting.
 *
 * Only ever consulted when the touch landed on no path at all, so a bounding
 * box is a good enough stand-in for the real outline. Ties — a point inside
 * several overlapping boxes — go to the smallest box, which is the most
 * specific answer and the one a finger aiming at a small fragment wants.
 */
export function findNearestFragment(
  point: Point,
  fragments: readonly BodyFragment[],
  tolerance: number,
): BodyFragment | null {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || tolerance <= 0) return null;

  let best: BodyFragment | null = null;
  let bestDistance = Infinity;
  let bestArea = Infinity;

  for (const fragment of fragments) {
    const distance = distanceToBox(point, fragment.bbox);
    if (distance > tolerance) continue;

    const area = fragment.bbox.width * fragment.bbox.height;
    if (distance < bestDistance || (distance === bestDistance && area < bestArea)) {
      best = fragment;
      bestDistance = distance;
      bestArea = area;
    }
  }

  return best;
}
