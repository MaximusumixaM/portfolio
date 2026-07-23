/** Stroke width of the drawn border, in px. */
const STROKE_WIDTH = 1.5;
/** Time the temporary centre-out lines take to reach the pill edges. */
const TEMP_MS = 380;
/** Time the four real border segments take to close around the outline. */
const REAL_MS = 560;

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

/**
 * Draws the pill's border once the logo settles. Two temporary lines run from the centre
 * out to the west and east mid-points (then fade), and four real segments grow from those
 * mid-points around the stadium outline to meet at top- and bottom-centre — so the border
 * appears to build out of the two side points rather than fading in whole.
 */
export function NavPillBorder({ width, height, drawn }: NavPillBorderProps) {
  if (width === 0 || height === 0) return null;

  const w = width;
  const h = height;
  const r = h / 2; // rounded-round pill: cap radius is half the height
  const midX = w / 2;

  // Temporary lines: centre → each side mid-point (drawn, then faded).
  const tempLines: Segment[] = [
    { id: "temp-west", d: `M ${midX},${r} L 0,${r}` },
    { id: "temp-east", d: `M ${midX},${r} L ${w},${r}` },
  ];

  // Real border: from the side mid-points, N and S around the outline to the centres.
  const realSegments: Segment[] = [
    { id: "west-n", d: `M 0,${r} A ${r},${r} 0 0 1 ${r},0 L ${midX},0` },
    { id: "west-s", d: `M 0,${r} A ${r},${r} 0 0 0 ${r},${h} L ${midX},${h}` },
    { id: "east-n", d: `M ${w},${r} A ${r},${r} 0 0 0 ${w - r},0 L ${midX},0` },
    { id: "east-s", d: `M ${w},${r} A ${r},${r} 0 0 1 ${w - r},${h} L ${midX},${h}` },
  ];

  const stroke = "var(--color-border-default)";

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={w}
      height={h}
      style={{ overflow: "visible" }}
      aria-hidden="true"
    >
      {realSegments.map((segment) => (
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
            // Wait for the temp lines to reach the edges before growing.
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
