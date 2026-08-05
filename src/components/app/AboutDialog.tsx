import { AboutView, type AboutSocialLink } from "@/components/app/AboutView";
import { Button } from "@/components/peduncle/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
} from "@/components/peduncle/Dialog";
import type { Award } from "@/data/site";

export interface AboutContent {
  bio: string;
  awards: Award[];
  socialLinks: AboutSocialLink[];
  photoSrc: string;
}

export interface AboutDialogProps extends AboutContent {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

// Controlled from outside: the nav's own About action opens it, so the trigger lives there.
export function AboutDialog({
  isOpen,
  onOpenChange,
  bio,
  awards,
  socialLinks,
  photoSrc,
}: AboutDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
