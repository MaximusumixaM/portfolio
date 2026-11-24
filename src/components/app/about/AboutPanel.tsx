import { useCallback, useEffect, useRef, useState } from "react";

import {
  ABOUT_SECTIONS,
  SLIDE_SECONDS,
  aboutSectionIndex,
  isAboutSection,
  selectChapter,
  showAboutSection,
  slideToAboutSection,
  useAboutProgressEffect,
  useAboutSection,
  useActiveChapter,
  useIsAboutOpen,
  useShownChapter,
  type AboutSection,
} from "./aboutView";
import type { Chapter, Chapters } from "./chapter";
import { Collage, PLACEHOLDER_DRAWINGS, PLACEHOLDER_PHOTOS } from "./Collage";
import type { Experience } from "./experience";

import { useGlobeDrag } from "@/components/app/portfolio-globe/useGlobeDrag";
import { usePrefersReducedMotion } from "@/components/lib/usePrefersReducedMotion";
import { cn } from "@/components/lib/utils";
import { Badge } from "@/components/peduncle/Badge";
import { Button } from "@/components/peduncle/Button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/peduncle/Tabs";
import { BodyText, Heading, Helper } from "@/components/peduncle/Typography";

const SECTION_LABELS: Record<AboutSection, string> = {
  story: "Story",
  experience: "Experience",
  drawings: "Drawings",
  photos: "Photos",
};

// The About page: a screen sitting just off to the right of the portfolio, panned across into view
// as the globe rides over from the corner into its left half. Its sections are slides in a row,
// the tabs across the top sliding between them; the globe rides in the story's slide, so it goes
// with it. In the story every place is listed; picking one opens its text, moves the globe to it,
// and runs the line from its pin to its heading.
export interface AboutPanelProps {
  /** Server-render it already in place, for a page loaded at an About URL. */
  startsOpen: boolean;
  /** The section a page loaded at an About URL shows, rendered in place from the server. */
  initialSection: AboutSection;
  chapters: Chapters;
  experience: Experience;
  /** Lands on the heading of the place whose marks are on the globe — where the leader line runs. */
  titleRef: React.Ref<HTMLHeadingElement>;
}

export function AboutPanel({
  startsOpen,
  initialSection,
  chapters,
  experience,
  titleRef,
}: AboutPanelProps) {
  const activeChapter = useActiveChapter();
  const shownChapter = useShownChapter();
  const isOpen = useIsAboutOpen();
  const panelRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const drag = useGlobeDrag(isOpen);
  const [isMounted, setIsMounted] = useState(false);
  // Until mounted, the section the page was loaded at (so the server's render is already on it),
  // then the store's, which the route has set to that same section by then: no slide on landing.
  const storeSection = useAboutSection();
  const section = isMounted ? storeSection : initialSection;
  const isOnStory = section === "story";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useAboutProgressEffect(
    useCallback(
      (eased: number) => {
        const panel = panelRef.current;
        if (panel === null) return;
        panel.style.visibility = eased > 0 ? "visible" : "hidden";
        // Reduced motion trades the pan for a cross-fade.
        panel.style.transform = prefersReducedMotion
          ? ""
          : `translateX(${String((1 - eased) * 100)}%)`;
        panel.style.opacity = prefersReducedMotion ? String(eased) : "";
      },
      [prefersReducedMotion],
    ),
  );

  useEffect(() => {
    if (isOpen) headingRef.current?.focus({ preventScroll: true });
  }, [isOpen]);

  return (
    <div
      ref={panelRef}
      data-about-layer=""
      inert={!isOpen}
      className="fixed inset-0 z-10 overflow-hidden bg-background-default"
      style={
        startsOpen
          ? { visibility: "visible" }
          : { visibility: "hidden", transform: "translateX(100%)" }
      }
    >
      {/* Over where the globe sits in the story (it's in the click-through canvas), so it can be
          turned here too; above the slides. Mirrors GlobeStage's About layout. */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute left-1/2 top-[30%] z-10 size-[min(68vw,40vh)] -translate-x-1/2 -translate-y-1/2 touch-none rounded-round md:left-[26%] md:top-1/2 md:size-[min(64vh,44vw)]",
          // Nothing to turn once the globe has slid away with the story.
          !isOnStory && "pointer-events-none",
        )}
        onPointerDown={drag.onPointerDown}
        onPointerMove={drag.onPointerMove}
        onPointerUp={drag.onPointerUp}
        onPointerCancel={drag.onPointerCancel}
        onDragStart={drag.onDragStart}
      />

      <Tabs
        value={section}
        onValueChange={(value) => {
          if (!isAboutSection(value)) return;
          if (prefersReducedMotion) showAboutSection(value);
          else slideToAboutSection(value);
        }}
        asChild
      >
        <section aria-labelledby="about-heading" className="h-full">
          {/* Where focus lands on opening; the tabs name the sections from there. */}
          <Heading
            ref={headingRef}
            level="h2"
            id="about-heading"
            tabIndex={-1}
            className="visually-hidden"
          >
            About
          </Heading>
          {/* Across the top, above every slide, just under the header. */}
          <div className="absolute inset-x-0 top-0 z-20 flex px-m pt-xl md:justify-center md:px-l">
            <TabsList aria-label="About" className="max-w-full">
              {ABOUT_SECTIONS.map((id) => (
                <TabsTrigger key={id} value={id}>
                  {SECTION_LABELS[id]}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {/* The row of slides, moved along to the chosen one (the globe, in the canvas, moving with
              the story's slide on the same timing). */}
          <div
            className="flex h-full"
            style={{
              transform: `translateX(${String(-aboutSectionIndex(section) * 100)}%)`,
              transition: prefersReducedMotion
                ? "none"
                : `transform ${String(SLIDE_SECONDS)}s cubic-bezier(0.65, 0, 0.35, 1)`,
            }}
          >
            <Slide value="story" isShown={isOnStory}>
              <div className="grid min-h-full md:grid-cols-2">
                {/* The globe's half (its top, when stacked, under the tabs). */}
                <div className="h-[55vh] md:h-auto" />
                {/* Padded the same top and bottom, so the places centre on the globe's middle line. */}
                <div className="flex flex-col justify-center px-m pb-xl md:px-l md:py-[calc(2*var(--spacing-xl))]">
                  <ul className="flex max-w-prose flex-col gap-m">
                    {chapters.map((chapter, index) => (
                      <ChapterItem
                        key={chapter.id}
                        chapter={chapter}
                        index={index}
                        isExpanded={index === activeChapter}
                        // The line only runs while the story is showing.
                        titleRef={
                          isOnStory && index === shownChapter
                            ? titleRef
                            : undefined
                        }
                      />
                    ))}
                  </ul>
                </div>
              </div>
            </Slide>
            <Slide value="experience" isShown={section === "experience"}>
              <WideSlide>
                <ExperienceSection experience={experience} />
              </WideSlide>
            </Slide>
            <Slide value="drawings" isShown={section === "drawings"}>
              <WideSlide>
                <Collage
                  items={PLACEHOLDER_DRAWINGS}
                  label="Hand drawings and other visual art"
                />
              </WideSlide>
            </Slide>
            <Slide value="photos" isShown={section === "photos"}>
              <WideSlide>
                <Collage items={PLACEHOLDER_PHOTOS} label="Photos" />
              </WideSlide>
            </Slide>
          </div>
        </section>
      </Tabs>
    </div>
  );
}

interface SlideProps {
  value: AboutSection;
  isShown: boolean;
  children: React.ReactNode;
}

/** One section's slide: a screen wide, scrolling on its own; out of reach while it's not showing. */
function Slide({ value, isShown, children }: SlideProps) {
  return (
    <TabsContent
      value={value}
      // Kept in the row (not unmounted) so it can slide in and out.
      forceMount
      inert={!isShown}
      // Its own scroll; Lenis holds the page itself still.
      data-lenis-prevent=""
      className="h-full w-full shrink-0 overflow-y-auto"
    >
      {children}
    </TabsContent>
  );
}

/**
 * A slide given the full width: padded the same top and bottom, so its content centres on the
 * screen's middle line, and a long one still scrolls clear of the tabs.
 */
function WideSlide({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col justify-center px-m py-[calc(2*var(--spacing-xl))] md:px-l">
      {children}
    </div>
  );
}

interface ChapterItemProps {
  chapter: Chapter;
  index: number;
  isExpanded: boolean;
  titleRef: React.Ref<HTMLHeadingElement> | undefined;
}

/** One place: a heading that opens it (closing the others), and its text beneath. */
function ChapterItem({
  chapter,
  index,
  isExpanded,
  titleRef,
}: ChapterItemProps) {
  const textId = `chapter-text-${chapter.id}`;

  return (
    <li className="flex flex-col">
      <Heading ref={titleRef} level="h3">
        <Button
          variant="ghost"
          aria-expanded={isExpanded}
          aria-controls={textId}
          onClick={() => {
            selectChapter(index);
          }}
          className="h-auto justify-start p-0 text-left font-display text-heading-sm font-semibold"
        >
          {chapter.place.label}
        </Button>
      </Heading>
      {/* Opens and closes by animating the row height (0fr ↔ 1fr), so it slides rather than jumps. */}
      <div
        id={textId}
        inert={!isExpanded}
        className={cn(
          "grid transition-[grid-template-rows] duration-300",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <BodyText className="pb-s pt-s">{chapter.text}</BodyText>
        </div>
      </div>
    </li>
  );
}

interface ExperienceSectionProps {
  experience: Experience;
}

/**
 * The CV side, centred on the screen in two columns: where Max has worked on the left; what he's
 * good at, then what he's been recognised for, on the right.
 */
function ExperienceSection({ experience }: ExperienceSectionProps) {
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-xl md:grid-cols-2">
      <ExperienceList id="experience-work" title="Work">
        {experience.work.map(({ id, role, organisation, place, years }) => (
          <li key={id} className="flex flex-col">
            <BodyText className="font-medium">{role}</BodyText>
            <Helper className="text-foreground-secondary">
              {organisation} · {place} · {years}
            </Helper>
          </li>
        ))}
      </ExperienceList>
      <div className="flex flex-col gap-xl">
        <SkillsSection skills={experience.skills} />
        <ExperienceList id="experience-awards" title="Awards">
          {experience.awards.map(({ id, title, issuer, description, date }) => (
            <li key={id} className="flex flex-col">
              <BodyText className="font-medium">{title}</BodyText>
              <Helper className="text-foreground-secondary">
                {description}, {issuer} · {date}
              </Helper>
            </li>
          ))}
        </ExperienceList>
      </div>
    </div>
  );
}

interface ExperienceListProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

/** A titled list of entries: work, awards. */
function ExperienceList({ id, title, children }: ExperienceListProps) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-s">
      <Heading level="h3" id={id}>
        {title}
      </Heading>
      <ul className="flex flex-col gap-s">{children}</ul>
    </section>
  );
}

interface SkillsSectionProps {
  skills: Experience["skills"];
}

/** Skills as badges (each with its logo and colour, if it has them), in subsections by group. */
function SkillsSection({ skills }: SkillsSectionProps) {
  const groups = Map.groupBy(skills, ({ group }) => group);
  return (
    <section
      aria-labelledby="experience-skills"
      className="flex flex-col gap-s"
    >
      <Heading level="h3" id="experience-skills">
        Skills
      </Heading>
      <div className="flex flex-col gap-m">
        {Array.from(groups, ([group, members]) => (
          <div key={group} className="flex flex-col gap-xs">
            <Helper className="text-foreground-tertiary">{group}</Helper>
            <ul className="flex flex-wrap gap-xs">
              {members.map(({ id, name, icon, tint }) => (
                <li key={id}>
                  <Badge
                    tint={tint}
                    icon={
                      icon === undefined ? undefined : (
                        <img src={icon} alt="" className="size-full" />
                      )
                    }
                  >
                    {name}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
