/** Stroke width of the drawn border, in px. */
const STROKE_WIDTH = 1.5;
/** Time the temporary centre-out lines take to reach the pill edges. */
const TEMP_MS = 380;
/** Time the real border segments take to close around the outline. */
const REAL_MS = 560;
/** Total time from `drawn` flipping to a closed outline, for whatever follows the border. */
export const BORDER_DRAW_MS = TEMP_MS + REAL_MS;

type End = "left" | "right";
type Edge = "top" | "bottom";

interface NavPillBorderProps {
  width: number;
  height: number;
  /** True once the logo has arrived; kicks off the draw. */
  drawn: boolean;
  /** End that butts up against a neighbouring pill: squared off rather than capped. */
  flatEnd?: End;
  /**
   * Where the outline draws from. `centre` shoots out to both side mid-points and closes four
   * quarters around them; an end sends one line along each edge to meet at the far cap.
   */
  origin?: "centre" | End;
}

interface Segment {
  id: string;
  d: string;
}

interface Pill {
  width: number;
  height: number;
  /** Cap radius — half the height, since these pills are `rounded-round`. */
  radius: number;
  flatEnd: End | undefined;
}

function endX(pill: Pill, side: End): number {
  return side === "left" ? 0 : pill.width;
}

function edgeY(pill: Pill, edge: Edge): number {
  return edge === "top" ? 0 : pill.height;
}

/** Where a cap meets the straight edge; a flat end has no cap, so its edge runs to the end itself. */
function cornerX(pill: Pill, side: End): number {
  if (pill.flatEnd === side) return endX(pill, side);
  return side === "left" ? pill.radius : pill.width - pill.radius;
}

/** Sweep flag for a cap travelled from its mid-point out to `edge`; reverse it to come back. */
function capSweep(side: End, edge: Edge): number {
  return (side === "left") === (edge === "top") ? 1 : 0;
}

/** Leaves an end's mid-point onto `edge`: round its cap, or straight along the flat edge. */
function leaveEnd(pill: Pill, side: End, edge: Edge): string {
  const y = edgeY(pill, edge);
  if (pill.flatEnd === side) return `L ${endX(pill, side)},${y}`;
  const { radius } = pill;
  return `A ${radius},${radius} 0 0 ${capSweep(side, edge)} ${cornerX(pill, side)},${y}`;
}

/** Arrives at an end's mid-point from `edge` — the same curve, travelled the other way. */
function arriveEnd(pill: Pill, side: End, edge: Edge): string {
  if (pill.flatEnd === side) return `L ${endX(pill, side)},${pill.radius}`;
  const { radius } = pill;
  const sweep = 1 - capSweep(side, edge);
  return `A ${radius},${radius} 0 0 ${sweep} ${endX(pill, side)},${pill.radius}`;
}

/** A quarter of the outline: an end's mid-point, round its cap, in along `edge` to the centre. */
function quarterFromEnd(pill: Pill, side: End, edge: Edge): string {
  return `M ${endX(pill, side)},${pill.radius} ${leaveEnd(pill, side, edge)} L ${pill.width / 2},${edgeY(pill, edge)}`;
}

/** Half the outline: an end's mid-point, along `edge`, round the far cap to the far mid-point. */
function halfFromEnd(pill: Pill, side: End, edge: Edge): string {
  const far: End = side === "left" ? "right" : "left";
  return `M ${endX(pill, side)},${pill.radius} ${leaveEnd(pill, side, edge)} L ${cornerX(pill, far)},${edgeY(pill, edge)} ${arriveEnd(pill, far, edge)}`;
}

// Draws a pill's border on settle. The wordmark's pill draws centre-out, which reads as the logo
// arriving and pushing its own frame outwards; the actions flanking it draw from the end they're
// tucked behind, so each one looks like it's growing out of the pill it emerged from.
export function NavPillBorder({
  width,
  height,
  drawn,
  flatEnd,
  origin = "centre",
}: NavPillBorderProps) {
  if (width === 0 || height === 0) return null;

  const pill: Pill = { width, height, radius: height / 2, flatEnd };
  const { radius } = pill;

  // Temporary lines: centre → each side mid-point (drawn, then faded).
  const tempLines: Segment[] =
    origin === "centre"
      ? [
          { id: "temp-west", d: `M ${width / 2},${radius} L 0,${radius}` },
          {
            id: "temp-east",
            d: `M ${width / 2},${radius} L ${width},${radius}`,
          },
        ]
      : [];

  const outline: Segment[] =
    origin === "centre"
      ? [
          { id: "west-top", d: quarterFromEnd(pill, "left", "top") },
          { id: "west-bottom", d: quarterFromEnd(pill, "left", "bottom") },
          { id: "east-top", d: quarterFromEnd(pill, "right", "top") },
          { id: "east-bottom", d: quarterFromEnd(pill, "right", "bottom") },
        ]
      : [
          { id: "sweep-top", d: halfFromEnd(pill, origin, "top") },
          { id: "sweep-bottom", d: halfFromEnd(pill, origin, "bottom") },
        ];

  // Only the centre-out draw has to wait for its temp lines to reach the edges first.
  const outlineDelay = origin === "centre" ? TEMP_MS : 0;
  const stroke = "var(--color-border-default)";

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={width}
      height={height}
      style={{ overflow: "visible" }}
      aria-hidden="true"
    >
      {outline.map((segment) => (
        <path
          key={segment.id}
          d={segment.d}
          pathLength={1}
          fill="none"
          stroke={stroke}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          style={{
            strokeDasharray: 1,
            strokeDashoffset: drawn ? 0 : 1,
            transition: `stroke-dashoffset ${String(REAL_MS)}ms ease ${drawn ? String(outlineDelay) : "0"}ms`,
          }}
        />
      ))}
      {tempLines.map((segment) => (
        <path
          key={segment.id}
          d={segment.d}
          pathLength={1}
          fill="none"
          stroke={stroke}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          style={{
            strokeDasharray: 1,
            strokeDashoffset: drawn ? 0 : 1,
            // Fade away once they've reached the edges, so no line bisects the pill.
            opacity: drawn ? 0 : 1,
            transition: `stroke-dashoffset ${String(TEMP_MS)}ms ease, opacity 200ms ease ${drawn ? String(TEMP_MS) : "0"}ms`,
          }}
        />
      ))}
    </svg>
  );
}
