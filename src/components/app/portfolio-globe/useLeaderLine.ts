import { useCallback, useRef } from "react";

/** Horizontal run before the label, so the line arrives flat rather than at an angle. */
const ELBOW_PX = 28;
/** Breathing room between the line's end and the first character of the label. */
const LABEL_GAP_PX = 10;

export interface LeaderLine {
  sectionRef: React.RefObject<HTMLElement | null>;
  labelRef: React.RefObject<HTMLElement | null>;
  lineRef: React.RefObject<SVGPolylineElement | null>;
  /** Redraws from a viewport-space point to the label. Safe to call every frame. */
  drawFrom: (viewportX: number, viewportY: number, isVisible: boolean) => void;
}

/**
 * The rule linking the selected location on the globe to its label in the panel. Driven straight
 * from the render loop, so it writes to the DOM rather than going through React state.
 */
export function useLeaderLine(): LeaderLine {
  const sectionRef = useRef<HTMLElement>(null);
  const labelRef = useRef<HTMLElement>(null);
  const lineRef = useRef<SVGPolylineElement>(null);

  const drawFrom = useCallback(
    (viewportX: number, viewportY: number, isVisible: boolean) => {
      const section = sectionRef.current;
      const label = labelRef.current;
      const line = lineRef.current;
      if (section === null || label === null || line === null) return;

      if (!isVisible) {
        line.style.opacity = "0";
        return;
      }

      const sectionRect = section.getBoundingClientRect();
      const labelRect = label.getBoundingClientRect();
      const startX = viewportX - sectionRect.left;
      const startY = viewportY - sectionRect.top;
      const endX = labelRect.left - sectionRect.left - LABEL_GAP_PX;
      const endY = labelRect.top - sectionRect.top + labelRect.height / 2;

      line.setAttribute(
        "points",
        `${startX.toFixed(1)},${startY.toFixed(1)} ${(endX - ELBOW_PX).toFixed(1)},${endY.toFixed(1)} ${endX.toFixed(1)},${endY.toFixed(1)}`,
      );
      line.style.opacity = "1";
    },
    [],
  );

  return { sectionRef, labelRef, lineRef, drawFrom };
}
