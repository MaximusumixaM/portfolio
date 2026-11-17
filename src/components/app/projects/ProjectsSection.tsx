import {
  HERO_SCROLL_SCREENS,
  PORTFOLIO_RISE_AT,
} from "@/components/app/max-hero/heroTransition";
import { sectionTrackId } from "@/components/app/scroll/timeline";
import { BodyText, Heading } from "@/components/peduncle/Typography";

/** Pulls the portfolio up over the hero's tail, so it starts rising just before the globe docks. */
const HERO_OVERLAP_SCREENS = (1 - PORTFOLIO_RISE_AT) * HERO_SCROLL_SCREENS;

// Placeholder for the full-screen portfolio, which rises in under the docking globe. Positioned so
// it paints over the hero's pinned screen; still under the canvas (z-20), so the globe stays on top.
export function ProjectsSection() {
  return (
    <section
      id={sectionTrackId("projects")}
      aria-labelledby="projects-heading"
      className="relative z-10 flex min-h-screen w-full flex-col justify-center gap-m bg-background-default px-m md:px-l"
      style={{ marginTop: `${String(-HERO_OVERLAP_SCREENS * 100)}vh` }}
    >
      <Heading level="h2" id="projects-heading">
        Projects
      </Heading>
      <BodyText className="text-foreground-secondary">
        Placeholder: projects go here.
      </BodyText>
    </section>
  );
}
