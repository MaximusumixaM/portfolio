/** Stroke width of the drawn border, in px. */
const STROKE_WIDTH = 1.5;
/** Time the temporary centre-out lines take to reach the pill edges. */
const TEMP_MS = 380;
/** Time the real border segments take to close around the outline. */
const REAL_MS = 560;

type End = "left" | "right";
type Edge = "top" | "bottom";

interface NavPillBorderProps {
  width: number;
  height: number;
  /** True once the logo has arrived; kicks off the draw. */
  drawn: boolean;
}

interface Segment {
  id: string;
  d: string;
}

interface Pill {
  width: number;
  height: number;
  /** Cap radius — half the height, since the pill is `rounded-round`. */
  radius: number;
}

function endX(pill: Pill, side: End): number {
  return side === "left" ? 0 : pill.width;
}

function edgeY(pill: Pill, edge: Edge): number {
  return edge === "top" ? 0 : pill.height;
}

/** Where a cap meets the straight edge. */
function cornerX(pill: Pill, side: End): number {
  return side === "left" ? pill.radius : pill.width - pill.radius;
}

/** Sweep flag for a cap travelled from its mid-point out to `edge`. */
function capSweep(side: End, edge: Edge): number {
  return (side === "left") === (edge === "top") ? 1 : 0;
}

/** Leaves an end's mid-point onto `edge`, round its cap. */
function leaveEnd(pill: Pill, side: End, edge: Edge): string {
  const { radius } = pill;
  return `A ${radius},${radius} 0 0 ${capSweep(side, edge)} ${cornerX(pill, side)},${edgeY(pill, edge)}`;
}

/** A quarter of the outline: an end's mid-point, round its cap, in along `edge` to the centre. */
function quarterFromEnd(pill: Pill, side: End, edge: Edge): string {
  return `M ${endX(pill, side)},${pill.radius} ${leaveEnd(pill, side, edge)} L ${pill.width / 2},${edgeY(pill, edge)}`;
}

// Draws the pill's border on settle, centre-out, which reads as the logo arriving and pushing its
// own frame outwards.
export function NavPillBorder({ width, height, drawn }: NavPillBorderProps) {
  if (width === 0 || height === 0) return null;

  const pill: Pill = { width, height, radius: height / 2 };
  const { radius } = pill;

  // Temporary lines: centre → each side mid-point (drawn, then faded).
  const tempLines: Segment[] = [
    { id: "temp-west", d: `M ${width / 2},${radius} L 0,${radius}` },
    { id: "temp-east", d: `M ${width / 2},${radius} L ${width},${radius}` },
  ];

  const outline: Segment[] = [
    { id: "west-top", d: quarterFromEnd(pill, "left", "top") },
    { id: "west-bottom", d: quarterFromEnd(pill, "left", "bottom") },
    { id: "east-top", d: quarterFromEnd(pill, "right", "top") },
    { id: "east-bottom", d: quarterFromEnd(pill, "right", "bottom") },
  ];

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
            transition: `stroke-dashoffset ${String(REAL_MS)}ms ease ${drawn ? String(TEMP_MS) : "0"}ms`,
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
