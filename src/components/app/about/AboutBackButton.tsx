import { ChevronLeft } from "lucide-react";
import { useCallback, useRef } from "react";

import { leaveAbout } from "./aboutRoute";
import { useAboutProgressEffect, useIsAboutOpen } from "./aboutView";

import {
  HEADER_ROW_HEIGHT_PX,
  HEADER_ROW_TOP_PX,
} from "@/components/app/max-hero/heroTransition";
import { Button } from "@/components/peduncle/Button";

// Takes the top-left from the name labels while About is open, and pans back to the portfolio.
export interface AboutBackButtonProps {
  /** Server-render it already showing, for a page loaded at /about. */
  startsShown: boolean;
}

export function AboutBackButton({ startsShown }: AboutBackButtonProps) {
  const isOpen = useIsAboutOpen();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useAboutProgressEffect(
    useCallback((eased: number) => {
      const wrapper = wrapperRef.current;
      if (wrapper === null) return;
      wrapper.style.opacity = String(eased);
      wrapper.style.visibility = eased > 0 ? "visible" : "hidden";
    }, []),
  );

  return (
    <div
      ref={wrapperRef}
      data-about-layer=""
      inert={!isOpen}
      // Centred in the header row, where the role label was.
      className="fixed left-m z-40 flex items-center md:left-l"
      style={{
        top: `${String(HEADER_ROW_TOP_PX)}px`,
        height: `${String(HEADER_ROW_HEIGHT_PX)}px`,
        ...(startsShown
          ? { opacity: 1, visibility: "visible" }
          : { opacity: 0, visibility: "hidden" }),
      }}
    >
      <Button
        variant="ghost"
        onClick={leaveAbout}
        className="font-display text-large font-light tracking-widest"
      >
        {/* Sized and coloured by the text, thin-stroked to sit with the light type. Inline, so
            `align-middle` centres it on the lowercase letters rather than the line box. */}
        <span>
          <ChevronLeft
            aria-hidden="true"
            className="mr-s inline size-[1em] align-middle"
            strokeWidth={1.5}
          />
          back
        </span>
      </Button>
    </div>
  );
}
