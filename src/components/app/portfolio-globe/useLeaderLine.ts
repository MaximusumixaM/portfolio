import { useCallback, useRef } from "react";

/** Horizontal run before the label, so the line arrives flat rather than at an angle. */
const ELBOW_PX = 28;
/** Breathing room between the line's end and the first character of the label. */
const LABEL_GAP_PX = 10;

export interface LeaderLine {
  /** The layer the line is drawn in; every coordinate is measured against its box. */
  overlayRef: React.RefObject<HTMLDivElement | null>;
  labelRef: React.RefObject<HTMLElement | null>;
  lineRef: React.RefObject<SVGPolylineElement | null>;
  /** The dot marking the city itself, at the line's start. */
  cityDotRef: React.RefObject<SVGCircleElement | null>;
  /** Redraws from a viewport-space point to the label. Safe to call every frame. */
  drawFrom: (viewportX: number, viewportY: number, isVisible: boolean) => void;
}

/**
 * The rule linking the selected location on the globe to its label in the panel. Driven straight
 * from the render loop, so it writes to the DOM rather than going through React state.
 */
export function useLeaderLine(): LeaderLine {
  const overlayRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLElement>(null);
  const lineRef = useRef<SVGPolylineElement>(null);
  const cityDotRef = useRef<SVGCircleElement>(null);

  const drawFrom = useCallback(
    (viewportX: number, viewportY: number, isVisible: boolean) => {
      const overlay = overlayRef.current;
      const label = labelRef.current;
      const line = lineRef.current;
      const cityDot = cityDotRef.current;
      if (
        overlay === null ||
        label === null ||
        line === null ||
        cityDot === null
      ) {
        return;
      }

      if (!isVisible) {
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
      line.style.opacity = "1";

      cityDot.setAttribute("cx", startX.toFixed(1));
      cityDot.setAttribute("cy", startY.toFixed(1));
      cityDot.style.opacity = "1";
    },
    [],
  );

  return { overlayRef, labelRef, lineRef, cityDotRef, drawFrom };
}
