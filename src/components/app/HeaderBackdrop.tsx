import {
  DOCKED_AT,
  HEADER_HEIGHT_PX,
} from "@/components/app/max-hero/heroTransition";
import { useSectionPast } from "@/components/app/scroll/timeline";
import { cn } from "@/components/lib/utils";

// The header's one shared ground: a frosted strip across the top (as the project header's), so
// whatever scrolls under the name, the wordmark and the about icon blurs out of their way. Under the
// canvas, so the 3D wordmark and globe stay crisp on top of it; in once the hero has played out.
export function HeaderBackdrop() {
  const isDocked = useSectionPast("hero", DOCKED_AT);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-10 bg-background-default/70 backdrop-blur-large backdrop-saturate-150 transition-opacity duration-300",
        isDocked ? "opacity-100" : "opacity-0",
      )}
      style={{ height: `${String(HEADER_HEIGHT_PX)}px` }}
    />
  );
}
