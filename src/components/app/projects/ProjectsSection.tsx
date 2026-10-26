import {
  sectionTrackId,
  useSectionSelector,
} from "@/components/app/scroll/timeline";
import { cn } from "@/components/lib/utils";
import { BodyText, Heading } from "@/components/peduncle/Typography";

// Placeholder for the full-screen projects section. It sits over the journey's last pinned screen
// and appears the moment the globe goes, standing in for the musket's fragments forming the page.
export function ProjectsSection() {
  const isJourneyOver = useSectionSelector(
    "about",
    (progress) => progress >= 1,
  );

  return (
    <section
      id={sectionTrackId("projects")}
      aria-labelledby="projects-heading"
      className={cn(
        // Kept in the accessibility tree while hidden; only sighted visitors wait for the journey.
        "-mt-[100vh] flex min-h-screen w-full flex-col justify-center gap-m px-m md:px-l",
        isJourneyOver ? "opacity-100" : "pointer-events-none opacity-0",
      )}
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
