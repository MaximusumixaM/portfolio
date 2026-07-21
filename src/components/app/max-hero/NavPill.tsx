import { NAV_LOGO_HEIGHT_PX, useHeroProgress } from "./heroTransition";

import { cn } from "@/components/lib/utils";

/** Wordmark aspect ratio, from the source SVG viewBox (1047 x 389). */
const LOGO_ASPECT = 1047 / 389;
/** Fraction of the settle where the pill fades in behind the arriving logo. */
const APPEAR_AT = 0.55;

/**
 * The resting place for the settled wordmark. Placeholder chrome for now — the real nav
 * (language dropdown, theme switcher) gets built around this slot later.
 *
 * The logo itself is not in here: it's the 3D wordmark from the canvas, which is fixed
 * above this and animates into the reserved slot as you scroll.
 */
export function NavPill() {
  const progress = useHeroProgress();
  const isSettled = progress > APPEAR_AT;

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed inset-x-0 top-m z-20 flex justify-center transition-all duration-300",
        isSettled
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-s opacity-0",
      )}
    >
      <div className="flex items-center gap-m rounded-round border border-border-default bg-background-default/80 px-l py-s backdrop-blur-medium">
        <span className="visually-hidden">Max Nobell-Cluff</span>
        {/* Reserved slot the 3D logo lands in — sized from the shared constant rather
            than a spacing token so it matches the wordmark exactly. */}
        <div
          aria-hidden="true"
          style={{
            height: `${String(NAV_LOGO_HEIGHT_PX)}px`,
            width: `${String(Math.round(NAV_LOGO_HEIGHT_PX * LOGO_ASPECT))}px`,
          }}
        />
      </div>
    </nav>
  );
}
