import { AboutView, type AboutSocialLink } from "@/components/app/AboutView";
import { useHeroProgress } from "@/components/app/max-hero/heroTransition";
import { Button } from "@/components/peduncle/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components/peduncle/Dialog";
import type { Award } from "@/data/site";

export interface AboutDialogProps {
  bio: string;
  awards: Award[];
  socialLinks: AboutSocialLink[];
  photoSrc: string;
}

// Sits in the hero's bottom-right corner and clears out with the rest of the hero chrome on scroll.
export function AboutDialog({
  bio,
  awards,
  socialLinks,
  photoSrc,
}: AboutDialogProps) {
  const progress = useHeroProgress();
  const opacity = Math.max(0, 1 - progress * 1.8);

  return (
    <Dialog>
      {opacity > 0 && (
        <div className="fixed right-m bottom-l z-40" style={{ opacity }}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="font-mono text-xs uppercase tracking-widest opacity-70 hover:opacity-100"
            >
              About
            </Button>
          </DialogTrigger>
        </div>
      )}

      <DialogContent title="About Max Nobell-Cluff">
        <DialogClose asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-s right-m z-10 text-xxl leading-none"
            aria-label="Close about"
          >
            &times;
          </Button>
        </DialogClose>
        <AboutView
          bio={bio}
          awards={awards}
          socialLinks={socialLinks}
          photoSrc={photoSrc}
        />
      </DialogContent>
    </Dialog>
  );
}
