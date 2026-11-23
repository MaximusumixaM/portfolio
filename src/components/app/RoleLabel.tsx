import { useCallback, useRef } from "react";

import { useAboutProgressEffect } from "@/components/app/about/aboutView";
import {
  DOCKED_AT,
  HEADER_ROW_HEIGHT_PX,
  HEADER_ROW_TOP_PX,
} from "@/components/app/max-hero/heroTransition";
import { useSectionPast } from "@/components/app/scroll/timeline";
import { cn } from "@/components/lib/utils";
import { Helper } from "@/components/peduncle/Typography";

// The role, top-left for the whole page, handing the corner to the back button while About is open.
// Chrome, not a heading (the page's one real heading is the hero's visually-hidden h1): widely
// spaced and light, so it holds its corner without competing with the wordmark.
export interface RoleLabelProps {
  /** Server-render it already faded out, for a page loaded at /about. */
  startsHidden: boolean;
}

export function RoleLabel({ startsHidden }: RoleLabelProps) {
  const labelRef = useRef<HTMLSpanElement>(null);
  const isHeaderFormed = useSectionPast("hero", DOCKED_AT);

  useAboutProgressEffect(
    useCallback((eased: number) => {
      if (labelRef.current !== null) {
        labelRef.current.style.opacity = String(1 - eased);
      }
    }, []),
  );

  return (
    <div
      aria-hidden="true"
      // Centred in the header row, level with the wordmark and the about icon; in once the header
      // has formed (the hero says it bigger until then).
      className={cn(
        "pointer-events-none fixed left-m z-40 flex select-none items-center transition-opacity duration-500 md:left-l",
        isHeaderFormed ? "opacity-100" : "opacity-0",
      )}
      style={{
        top: `${String(HEADER_ROW_TOP_PX)}px`,
        height: `${String(HEADER_ROW_HEIGHT_PX)}px`,
      }}
    >
      <Helper
        ref={labelRef}
        className="font-display text-medium font-light tracking-widest text-foreground-default md:text-large"
        style={startsHidden ? { opacity: 0 } : undefined}
      >
        UX designer
      </Helper>
    </div>
  );
}
