import { ChevronLeft } from "lucide-react";
import { useCallback, useRef } from "react";

import { leaveAbout } from "./aboutRoute";
import { useAboutProgressEffect, useIsAboutOpen } from "./aboutView";

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
      className="fixed left-m top-m z-40"
      style={
        startsShown
          ? { opacity: 1, visibility: "visible" }
          : { opacity: 0, visibility: "hidden" }
      }
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
