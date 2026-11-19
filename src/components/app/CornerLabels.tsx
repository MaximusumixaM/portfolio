import { useCallback, useRef } from "react";

import { useAboutProgressEffect } from "@/components/app/about/aboutView";
import { cn } from "@/components/lib/utils";
import { Helper } from "@/components/peduncle/Typography";

// Chrome, not headings — the page's one real heading is the hero's visually-hidden h1. Light and
// widely spaced, so they hold their corner without competing with the wordmark.
const CORNER_LABEL =
  "font-display font-extralight tracking-widest text-foreground-default";

// Name with the role beneath it, top-left for the whole page — handing the corner to the back
// button while About is open. The top-right belongs to the about globe.
export interface CornerLabelsProps {
  /** Server-render them already faded out, for a page loaded at /about. */
  startsHidden: boolean;
}

export function CornerLabels({ startsHidden }: CornerLabelsProps) {
  const labelsRef = useRef<HTMLDivElement>(null);

  useAboutProgressEffect(
    useCallback((eased: number) => {
      if (labelsRef.current !== null) {
        labelsRef.current.style.opacity = String(1 - eased);
      }
    }, []),
  );

  return (
    <div
      ref={labelsRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-m top-m z-40 flex select-none flex-col gap-xs"
      style={startsHidden ? { opacity: 0 } : undefined}
    >
      <Helper className={cn(CORNER_LABEL, "text-large")}>
        Max Nobell-Cluff
      </Helper>
      {/* A size up from the name, so the role reads from the first screen. */}
      <Helper className={cn(CORNER_LABEL, "text-xl")}>
        Interaction designer
      </Helper>
    </div>
  );
}
