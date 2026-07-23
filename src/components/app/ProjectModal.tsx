import { Button } from "@/components/peduncle/Button";
import { Dialog, DialogClose, DialogContent } from "@/components/peduncle/Dialog";
import { Heading, BodyText } from "@/components/peduncle/Typography";
import type { ResolvedProject } from "@/types/project";

export interface ProjectModalProps {
  project: ResolvedProject | undefined;
  onOpenChange: (isOpen: boolean) => void;
}

export function ProjectModal({ project, onOpenChange }: ProjectModalProps) {
  return (
    <Dialog open={project !== undefined} onOpenChange={onOpenChange}>
      {project !== undefined && (
        <DialogContent title={project.title}>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-s right-m z-10 text-xxl leading-none"
              aria-label="Close project details"
            >
              &times;
            </Button>
          </DialogClose>
          <div className="grid h-full grid-cols-1 gap-l overflow-y-auto p-m pt-xl md:grid-cols-[minmax(220px,22vw)_1fr] md:p-l">
            <div>
              <Heading level="h2">{project.title}</Heading>
              <Heading level="h3" className="mt-m mb-xs">
                About
              </Heading>
              <BodyText className="leading-snug">{project.about}</BodyText>
              {project.notes.map((note) => (
                <div key={note.label}>
                  <Heading level="h3" className="mt-m mb-xs">
                    {note.label}
                  </Heading>
                  <BodyText className="leading-snug">{note.text}</BodyText>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-m">
              {project.images.map((image) => (
                <img
                  key={image.src}
                  className="block max-w-full"
                  src={image.src}
                  srcSet={image.srcSet}
                  sizes={image.sizes}
                  width={image.width}
                  height={image.height}
                  alt={image.alt}
                />
              ))}
              {project.videoEmbedUrl !== undefined && (
                <iframe
                  className="aspect-video w-full border-none"
                  src={project.videoEmbedUrl}
                  title={`${project.title} video`}
                  allowFullScreen
                />
              )}
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
