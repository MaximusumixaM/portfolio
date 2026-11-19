import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useOpenProject } from "./openProject";
import type { Project } from "./project";
import {
  isPlainClick,
  leaveProject,
  projectPath,
  switchProject,
} from "./projectRoute";

import { usePrefersReducedMotion } from "@/components/lib/usePrefersReducedMotion";
import { cn } from "@/components/lib/utils";
import { Button } from "@/components/peduncle/Button";
import { BodyText, Heading, Helper } from "@/components/peduncle/Typography";

/** How far down the viewport a section counts as being read, for the strip's fill. */
const READING_LINE = 0.5;

function sectionId(projectId: string, index: number): string {
  return `${projectId}-section-${String(index)}`;
}

export interface ProjectPageProps {
  project: Project;
  /** None for the first project: the way back is disabled, not wrapped round. */
  previous: Project | undefined;
  /** None for the last project. */
  next: Project | undefined;
  /** The page's own scroll, which the view also fades in and out. */
  scrollerRef: React.RefObject<HTMLDivElement | null>;
  /** The big title, where focus lands as the project opens. */
  headingRef: React.Ref<HTMLHeadingElement>;
}

// One project as a magazine spread: a big title and cover, then each section as an image set
// beside its text, some images running edge to edge, and the previous/next projects at the end. A
// slim header stays pinned on top: ✕, "Title · Section" once the big title has scrolled under it,
// previous/next, and the sections as a strip that fills as you read.
export function ProjectPage({
  project,
  previous,
  next,
  scrollerRef,
  headingRef,
}: ProjectPageProps) {
  const isOpen = useOpenProject() === project.id;
  const prefersReducedMotion = usePrefersReducedMotion();
  const headerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [isCompact, setIsCompact] = useState(false);
  /** The section being read: the last one whose top the reading line has passed (the first, before any). */
  const [currentSection, setCurrentSection] = useState(0);

  // Each scroll: the header compacts once the big title is under it, names the section being read,
  // and each section's strip segment fills as the reading line passes through it (written
  // directly, no re-render).
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (scroller === null) return;
    const page = scroller;
    function update() {
      const header = headerRef.current;
      const title = titleRef.current;
      if (header !== null && title !== null) {
        setIsCompact(
          page.scrollTop >
            title.offsetTop + title.offsetHeight - header.offsetHeight,
        );
      }
      const sections = page.querySelectorAll<HTMLElement>(
        "[data-project-section]",
      );
      const fills = page.querySelectorAll<HTMLElement>("[data-strip-fill]");
      const isAtEnd =
        page.scrollTop + page.clientHeight >= page.scrollHeight - 1;
      const readingAt = page.scrollTop + page.clientHeight * READING_LINE;
      let reading = 0;
      sections.forEach((section, index) => {
        if (isAtEnd || section.offsetTop <= readingAt) reading = index;
        const fill = fills[index];
        if (fill === undefined) return;
        const read = isAtEnd
          ? 1
          : Math.min(
              1,
              Math.max(
                0,
                (readingAt - section.offsetTop) / section.offsetHeight,
              ),
            );
        fill.style.scale = `${String(read)} 1`;
      });
      setCurrentSection(reading);
    }
    update();
    page.addEventListener("scroll", update, { passive: true });
    return () => {
      page.removeEventListener("scroll", update);
    };
  }, [scrollerRef]);

  // ← and → step through the projects, as the header's arrows do (and stop at either end).
  const previousId = previous?.id;
  const nextId = next?.id;
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const targetId =
        event.key === "ArrowLeft"
          ? previousId
          : event.key === "ArrowRight"
            ? nextId
            : undefined;
      if (targetId !== undefined) switchProject(targetId);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, previousId, nextId]);

  function jumpToSection(index: number) {
    const page = scrollerRef.current;
    const section = document.getElementById(sectionId(project.id, index));
    if (page === null || section === null) return;
    page.scrollTo({
      top: section.offsetTop - (headerRef.current?.offsetHeight ?? 0),
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  return (
    <div
      ref={scrollerRef}
      // Its own scroll; Lenis holds the page itself still.
      data-lenis-prevent=""
      className="relative h-full overflow-y-auto"
    >
      <div
        ref={headerRef}
        className={cn(
          "sticky top-0 z-10 flex flex-col gap-xs px-m pb-xs pt-m transition-colors duration-300 md:px-l",
          isCompact &&
            "bg-background-default/70 backdrop-blur-large backdrop-saturate-150",
        )}
      >
        <div className="flex items-center gap-m">
          <Button
            variant="ghost"
            onClick={leaveProject}
            className="shrink-0 font-display text-large font-light tracking-widest"
          >
            {/* Inline, so `align-middle` centres the icon on the lowercase letters, not the line box. */}
            <span>
              <X
                aria-hidden="true"
                className="mr-s inline size-[1em] align-middle"
                strokeWidth={1.5}
              />
              close
            </span>
          </Button>
          {/* Title · section, once the big title has scrolled away under the header. */}
          <span
            aria-hidden="true"
            className={cn(
              "min-w-0 truncate font-display text-large transition-opacity duration-300",
              isCompact ? "opacity-100" : "opacity-0",
            )}
          >
            <span className="font-semibold">{project.title}</span>
            <span className="text-foreground-secondary">
              <span className="mx-s">·</span>
              {project.sections[currentSection]?.title}
            </span>
          </span>
          <div className="ml-auto flex shrink-0 items-center gap-s">
            <StepLink
              project={previous}
              direction="previous"
              icon={ChevronLeft}
            />
            <StepLink project={next} direction="next" icon={ChevronRight} />
          </div>
        </div>
        <ProgressStrip
          projectId={project.id}
          sections={project.sections}
          currentSection={currentSection}
          onJump={jumpToSection}
        />
      </div>

      <div className="flex flex-col gap-xl pb-xl">
        <div ref={titleRef} className="flex flex-col gap-m px-m pt-l md:px-l">
          <Heading
            ref={headingRef}
            level="h2"
            tabIndex={-1}
            className="text-heading-lg outline-none"
          >
            {project.title}
          </Heading>
          <ul aria-label="Tags" className="flex flex-wrap gap-xs">
            {project.tags.map((tag) => (
              <li key={tag}>
                <Helper className="rounded-round bg-background-secondary px-s text-small text-foreground-secondary">
                  {tag}
                </Helper>
              </li>
            ))}
          </ul>
          <BodyText className="max-w-prose text-xl text-foreground-secondary">
            {project.summary}
          </BodyText>
        </div>
        <ImagePlaceholder
          color={project.color}
          className="aspect-4/3 md:aspect-21/9"
        />
        {project.sections.map((section, index) => (
          <SectionSpread
            key={section.title}
            id={sectionId(project.id, index)}
            section={section}
            color={project.color}
            isMirrored={index % 2 === 1}
            hasBleed={index % 2 === 0}
          />
        ))}
        <EndLinks previous={previous} next={next} />
      </div>
    </div>
  );
}

type StepDirection = "previous" | "next";

const STEP_LABEL: Record<StepDirection, string> = {
  previous: "Previous project",
  next: "Next project",
};

interface StepLinkProps {
  /** None at either end of the list, where the arrow shows disabled. */
  project: Project | undefined;
  direction: StepDirection;
  icon: typeof ChevronLeft;
}

/** A header arrow: a real link to the previous or next project, handled in place. */
function StepLink({ project, direction, icon: Icon }: StepLinkProps) {
  const arrow = (
    <Icon aria-hidden="true" className="size-[1em]" strokeWidth={1.5} />
  );
  if (project === undefined) {
    return (
      <Button
        variant="ghost"
        size="icon"
        disabled
        aria-label={STEP_LABEL[direction]}
        className="text-xl pointer-coarse:p-s"
      >
        {arrow}
      </Button>
    );
  }
  const label = `${STEP_LABEL[direction]}: ${project.title}`;
  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      // A bigger target for fingers.
      className="text-xl pointer-coarse:p-s"
    >
      <a
        href={projectPath(project.id)}
        aria-label={label}
        title={label}
        onClick={(event) => {
          if (!isPlainClick(event)) return;
          event.preventDefault();
          switchProject(project.id);
        }}
      >
        {arrow}
      </a>
    </Button>
  );
}

interface ProgressStripProps {
  projectId: string;
  sections: Project["sections"];
  /** The one being read, announced as the current location. */
  currentSection: number;
  onJump: (index: number) => void;
}

/** The sections as a strip of segments that fill as you read; each names itself on hover and jumps there. */
function ProgressStrip({
  projectId,
  sections,
  currentSection,
  onJump,
}: ProgressStripProps) {
  return (
    <nav aria-label="Sections">
      <ol className="flex gap-xs">
        {sections.map((section, index) => (
          <li key={section.title} className="min-w-0 flex-1">
            <a
              href={`#${sectionId(projectId, index)}`}
              aria-current={index === currentSection ? "location" : undefined}
              onClick={(event) => {
                event.preventDefault();
                onJump(index);
              }}
              className="group/segment flex flex-col gap-xs py-xs pointer-coarse:py-s focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
            >
              <span className="relative h-xs overflow-hidden rounded-round bg-background-secondary">
                <span
                  data-strip-fill=""
                  className="absolute inset-0 origin-left bg-foreground-default"
                  style={{ scale: "0 1" }}
                />
              </span>
              {/* Touch has no hover to reveal them, and they'd only truncate on a phone; the header
                  names the section being read instead. */}
              <span className="truncate text-small text-foreground-secondary opacity-0 transition-opacity duration-300 pointer-coarse:hidden group-hover/segment:opacity-100 group-focus-visible/segment:opacity-100">
                {section.title}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

interface SectionSpreadProps {
  id: string;
  section: Project["sections"][number];
  color: string;
  /** Puts the image on the right, so spreads alternate. */
  isMirrored: boolean;
  /** Follows the spread with an image running edge to edge. */
  hasBleed: boolean;
}

/** One section: an image beside its text, sometimes followed by a full-bleed image. */
function SectionSpread({
  id,
  section,
  color,
  isMirrored,
  hasBleed,
}: SectionSpreadProps) {
  const headingId = `${id}-heading`;
  return (
    <section
      id={id}
      data-project-section=""
      aria-labelledby={headingId}
      className="flex flex-col gap-xl"
    >
      <div className="grid items-center gap-l px-m md:grid-cols-12 md:px-l">
        <ImagePlaceholder
          color={color}
          className={cn(
            "aspect-4/3 rounded-xl md:col-span-7",
            isMirrored && "md:order-last",
          )}
        />
        <div className="flex flex-col gap-s md:col-span-5">
          <Heading level="h3" id={headingId}>
            {section.title}
          </Heading>
          <BodyText className="text-foreground-secondary">
            {section.text}
          </BodyText>
        </div>
      </div>
      {hasBleed && <ImagePlaceholder color={color} className="aspect-21/9" />}
    </section>
  );
}

interface ImagePlaceholderProps {
  color: string;
  className: string;
}

/** Where an image will go: a block washed in the project's colour, a shade deeper than the page. */
function ImagePlaceholder({ color, className }: ImagePlaceholderProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("relative overflow-hidden", className)}
    >
      <div
        className="absolute inset-0 opacity-25"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

interface EndLinksProps {
  previous: Project | undefined;
  next: Project | undefined;
}

/** The ways on at the end of a project: the previous and next ones, by name (each only if there is one). */
function EndLinks({ previous, next }: EndLinksProps) {
  return (
    <nav
      aria-label="More projects"
      // Stacked on phones, where two long titles side by side would squeeze each other.
      className="flex flex-col gap-m px-m sm:flex-row sm:items-start sm:justify-between md:px-l"
    >
      {previous !== undefined && (
        <EndLink project={previous} direction="previous" />
      )}
      {next !== undefined && <EndLink project={next} direction="next" />}
    </nav>
  );
}

interface EndLinkProps {
  project: Project;
  direction: StepDirection;
}

function EndLink({ project, direction }: EndLinkProps) {
  const isNext = direction === "next";
  const Arrow = isNext ? ChevronRight : ChevronLeft;
  const arrow = (
    <Arrow
      aria-hidden="true"
      className={cn(
        "inline size-[1em] align-middle",
        isNext ? "ml-xs" : "mr-xs",
      )}
      strokeWidth={1.5}
    />
  );
  return (
    <Button
      asChild
      variant="ghost"
      className={cn(
        "h-auto flex-col gap-xs",
        // The next one sits on the right even when there's no previous.
        isNext
          ? "items-end self-end text-right sm:ml-auto"
          : "items-start self-start text-left",
      )}
    >
      <a
        href={projectPath(project.id)}
        onClick={(event) => {
          if (!isPlainClick(event)) return;
          event.preventDefault();
          switchProject(project.id);
        }}
      >
        <Helper className="text-foreground-secondary">
          {STEP_LABEL[direction]}
        </Helper>
        <span className="font-display text-heading-md font-semibold">
          {isNext ? null : arrow}
          {project.title}
          {isNext ? arrow : null}
        </span>
      </a>
    </Button>
  );
}
