import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { TessellateModifier } from "three/examples/jsm/modifiers/TessellateModifier.js";

import maxWordmarkSvg from "@/assets/max-wordmark.svg?raw";

export interface LetterGeometry {
  /** Stable id for React keys and per-letter animation seeds. */
  id: string;
  geometry: THREE.BufferGeometry;
  /** Placement of the letter's own centroid within the centered wordmark group. */
  position: [number, number, number];
}

export interface Wordmark {
  letters: LetterGeometry[];
  /** World-unit extents of the centered wordmark, for responsive fitting. */
  width: number;
  height: number;
}

/** Target height of the whole wordmark in world units — camera framing is tuned to this. */
const WORDMARK_HEIGHT = 3.4;
/** Extrusion depth as a fraction of the wordmark height. */
const DEPTH_RATIO = 0.19;
/** Corner-fillet radius, in SVG units — the outline is drawn sharp, rounding happens here. */
const CORNER_RADIUS = 24;
/** Max facet edge length in world units — drives how dense the flexing mesh is. */
const MAX_EDGE_LENGTH = 0.08;
const TESSELLATE_ITERATIONS = 8;
/** Wordmark SVG viewBox height, in SVG units. */
const SVG_HEIGHT = 389;

/** Document order of the paths in max-wordmark.svg (see the file). */
const LETTER_IDS = ["x", "a", "m"] as const;
/**
 * Depth layering (world units): the letters overlap in plan, so separate them along z
 * to read as independent planes rather than clipping into each other — M in front, X behind.
 */
const LETTER_Z_OFFSET: Record<string, number> = { m: 0.8, a: 0, x: -0.8 };

/** Modular array access that satisfies noUncheckedIndexedAccess for cyclic contours. */
function at<T>(items: readonly T[], index: number): T {
  const value = items[((index % items.length) + items.length) % items.length];
  if (value === undefined) throw new Error("Contour index out of range");
  return value;
}

/** The corner vertices of a line-based contour (start point of each segment). */
function contourCorners(contour: THREE.Path): THREE.Vector2[] {
  return contour.curves.map((curve) => curve.getPoint(0));
}

/**
 * Draws `points` into `target` as a closed contour with each sharp corner replaced by a
 * quadratic fillet, clamped so neighbouring fillets never overlap.
 */
function drawRoundedContour(
  target: THREE.Path,
  points: readonly THREE.Vector2[],
  radius: number,
): void {
  const count = points.length;
  if (count < 3) {
    points.forEach((point, index) => {
      if (index === 0) target.moveTo(point.x, point.y);
      else target.lineTo(point.x, point.y);
    });
    return;
  }

  const entries: THREE.Vector2[] = [];
  const exits: THREE.Vector2[] = [];
  for (let i = 0; i < count; i++) {
    const current = at(points, i);
    const toPrev = at(points, i - 1).clone().sub(current);
    const toNext = at(points, i + 1).clone().sub(current);
    const r = Math.min(radius, toPrev.length() / 2, toNext.length() / 2);
    entries.push(current.clone().addScaledVector(toPrev.normalize(), r));
    exits.push(current.clone().addScaledVector(toNext.normalize(), r));
  }

  const firstExit = at(exits, 0);
  target.moveTo(firstExit.x, firstExit.y);
  for (let i = 1; i <= count; i++) {
    const corner = at(points, i);
    const entry = at(entries, i);
    const exit = at(exits, i);
    target.lineTo(entry.x, entry.y);
    target.quadraticCurveTo(corner.x, corner.y, exit.x, exit.y);
  }
}

/** Rebuilds a letter's shapes (and their holes) with rounded corners. */
function roundShapes(path: THREE.ShapePath, radius: number): THREE.Shape[] {
  return path.toShapes().map((shape) => {
    const rounded = new THREE.Shape();
    drawRoundedContour(rounded, contourCorners(shape), radius);
    for (const hole of shape.holes) {
      const roundedHole = new THREE.Path();
      drawRoundedContour(roundedHole, contourCorners(hole), radius);
      rounded.holes.push(roundedHole);
    }
    return rounded;
  });
}

function extrudeLetter(path: THREE.ShapePath, depth: number): THREE.ExtrudeGeometry {
  return new THREE.ExtrudeGeometry(roundShapes(path, CORNER_RADIUS), {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.18,
    bevelSize: depth * 0.14,
    bevelSegments: 3,
    steps: 1,
    curveSegments: 8,
  });
}

/**
 * Parses the MAX wordmark SVG into one dense, flat-shadeable geometry per letter.
 * Each geometry is centered on its own centroid; `position` places it back into the
 * centered wordmark so letters keep their original kerning and overlap while still
 * being able to float/rotate about their own center.
 */
export function buildWordmark(): Wordmark {
  const depth = SVG_HEIGHT * DEPTH_RATIO;
  const tessellate = new TessellateModifier(MAX_EDGE_LENGTH, TESSELLATE_ITERATIONS);

  const { paths } = new SVGLoader().parse(maxWordmarkSvg);

  // Extrude in SVG space, then flip Y (SVG is y-down, three is y-up).
  const letters = paths.map((path, index) => {
    const geometry = extrudeLetter(path, depth);
    geometry.scale(1, -1, 1);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    if (box === null) throw new Error("Expected extruded geometry to have a bounding box");
    return {
      id: LETTER_IDS[index] ?? `letter-${String(index)}`,
      geometry,
      box: box.clone(),
    };
  });

  // Fit the whole wordmark: uniform scale to target height, centered on the group origin.
  const combined = new THREE.Box3();
  for (const { box } of letters) combined.union(box);
  const combinedSize = combined.getSize(new THREE.Vector3());
  const scale = WORDMARK_HEIGHT / combinedSize.y;
  const combinedCenter = combined.getCenter(new THREE.Vector3());

  const built = letters.map(({ id, geometry, box }) => {
    const letterCenter = box
      .getCenter(new THREE.Vector3())
      .sub(combinedCenter)
      .multiplyScalar(scale);

    geometry.scale(scale, scale, scale);
    geometry.center(); // pivot each letter on its own centroid
    const dense = tessellate.modify(geometry);
    geometry.dispose();
    dense.computeVertexNormals();

    return {
      id,
      geometry: dense,
      position: [letterCenter.x, letterCenter.y, (LETTER_Z_OFFSET[id] ?? 0)],
    } satisfies LetterGeometry;
  });

  return {
    letters: built,
    width: combinedSize.x * scale,
    height: WORDMARK_HEIGHT,
  } satisfies Wordmark;
}
