import { useCallback, useRef } from "react";

/** Horizontal run before the label, so the line arrives flat rather than at an angle. */
const ELBOW_PX = 28;
/** Breathing room between the line's end and the first character of the label. */
const LABEL_GAP_PX = 10;

export interface LeaderLine {
  /** The layer the line is drawn in; every coordinate is measured against its box. */
  overlayRef: React.RefObject<HTMLDivElement | null>;
  /** The chapter title the line runs out to. */
  labelRef: React.RefObject<HTMLHeadingElement | null>;
  lineRef: React.RefObject<SVGPolylineElement | null>;
  /** The dot marking the city itself, at the line's start. */
  cityDotRef: React.RefObject<SVGCircleElement | null>;
  /**
   * Redraws from a viewport-space point to the label, `drawn` (0–1) of the way along it. Safe to
   * call every frame.
   */
  drawFrom: (viewportX: number, viewportY: number, drawn: number) => void;
}

/**
 * The rule running from the chapter's pin on the globe out to its title. Driven straight from the
 * render loop, so it writes to the DOM rather than going through React state.
 */
export function useLeaderLine(): LeaderLine {
  const overlayRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLHeadingElement>(null);
  const lineRef = useRef<SVGPolylineElement>(null);
  const cityDotRef = useRef<SVGCircleElement>(null);

  const drawFrom = useCallback(
    (viewportX: number, viewportY: number, drawn: number) => {
      const line = lineRef.current;
      const cityDot = cityDotRef.current;
      if (line === null || cityDot === null) return;

      const overlay = overlayRef.current;
      const label = labelRef.current;
      if (drawn <= 0 || overlay === null || label === null) {
        line.style.opacity = "0";
        cityDot.style.opacity = "0";
        return;
      }

      const overlayRect = overlay.getBoundingClientRect();
      const labelRect = label.getBoundingClientRect();
      const startX = viewportX - overlayRect.left;
      const startY = viewportY - overlayRect.top;
      const endX = labelRect.left - overlayRect.left - LABEL_GAP_PX;
      const endY = labelRect.top - overlayRect.top + labelRect.height / 2;

      line.setAttribute(
        "points",
        `${startX.toFixed(1)},${startY.toFixed(1)} ${(endX - ELBOW_PX).toFixed(1)},${endY.toFixed(1)} ${endX.toFixed(1)},${endY.toFixed(1)}`,
      );
      // `pathLength` is 1, so the dash offset is simply how much is still to draw.
      line.style.strokeDashoffset = String(1 - drawn);
      line.style.opacity = "1";

      cityDot.setAttribute("cx", startX.toFixed(1));
      cityDot.setAttribute("cy", startY.toFixed(1));
      cityDot.style.opacity = "1";
    },
    [],
  );

  return { overlayRef, labelRef, lineRef, cityDotRef, drawFrom };
}
