import { Heading, BodyText } from "@/components/peduncle/Typography";
import type { Award } from "@/data/site";

export interface AboutSocialLink {
  label: string;
  href: string;
  iconSrc: string;
}

export interface AboutViewProps {
  bio: string;
  awards: Award[];
  socialLinks: AboutSocialLink[];
  photoSrc: string;
}

export function AboutView({
  bio,
  awards,
  socialLinks,
  photoSrc,
}: AboutViewProps) {
  return (
    <div className="grid grid-cols-1 items-start gap-l p-l md:grid-cols-2">
      <div>
        <Heading level="h1" className="mb-l">
          Max Nobell-Cluff
        </Heading>
        <Heading level="h2" className="mt-l mb-xs">
          Bio
        </Heading>
        <BodyText className="leading-snug">{bio}</BodyText>
        <Heading level="h2" className="mt-l mb-xs">
          Awards
        </Heading>
        {awards.map((award) => (
          <BodyText key={award.title} className="leading-snug">
            {award.date}: {award.title}
            <br />- {award.description}
          </BodyText>
        ))}
        <div className="mt-l flex gap-l">
          {socialLinks.map((link) => (
            <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
              <img
                className="h-7 w-7 cursor-pointer"
                src={link.iconSrc}
                alt={link.label}
              />
            </a>
          ))}
        </div>
      </div>
      <div>
        <img
          className="block h-auto w-full"
          src={photoSrc}
          alt="Photo of Max Nobell-Cluff"
        />
      </div>
    </div>
  );
}
