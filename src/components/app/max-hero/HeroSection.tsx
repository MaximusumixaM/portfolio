import { HeroHud } from "./HeroHud";
import { HERO_SCROLL_SCREENS } from "./heroTransition";

import { sectionTrackId } from "@/components/app/scroll/timeline";

// One pinned screen: the wordmark assembles in the shared canvas and the circle it leaves behind
// becomes the globe.
export function HeroSection() {
  return (
    // One pinned screen plus the scroll it takes to play the sequence through.
    <div
      id={sectionTrackId("hero")}
      className="relative w-full"
      style={{ height: `${String((1 + HERO_SCROLL_SCREENS) * 100)}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-background-default">
        <HeroHud />
      </div>
    </div>
  );
}
