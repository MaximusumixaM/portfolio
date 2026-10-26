import { cn } from "@/components/lib/utils";
import { Helper } from "@/components/peduncle/Typography";

// Chrome, not headings — the page's one real heading is the hero's visually-hidden h1. Light and
// widely spaced, so they hold their corners without competing with the wordmark.
const CORNER_LABEL =
  "font-display text-large font-extralight tracking-widest text-foreground-default";

// The top corners hold their places for the whole page — every section rearranges around them.
export function CornerLabels() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-40 select-none"
    >
      <Helper className={cn("absolute left-m top-m", CORNER_LABEL)}>
        Max Nobell-Cluff
      </Helper>
      <Helper className={cn("absolute right-m top-m", CORNER_LABEL)}>
        Interaction designer
      </Helper>
    </div>
  );
}
