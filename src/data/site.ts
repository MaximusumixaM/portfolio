import linkedinIcon from "../assets/images/social/linkedin.png";
import vimeoIcon from "../assets/images/social/vimeo.png";
import instagramIcon from "../assets/images/social/instagram.png";
import type { ImageMetadata } from "astro";

export interface SocialLink {
  label: string;
  href: string;
  icon: ImageMetadata;
}

export interface Award {
  date: string;
  title: string;
  description: string;
}

export const siteTitle = "Max Nobell-Cluff — Portfolio";

export const bio =
  "I am a fourth year design student at the Emily Carr University of Art and Design - majoring in Interaction Design - having completed an exchange at the Hochschule fur Gestaltung Schwabisch Gmund in Germany. I'm currently working on my grad project which is focused around 3D interactions, while also working as a design contractor for Tulip Interfaces. I was born in Vancouver, grew up in a multilingual and multicultural French-Canadian and Swedish family. My interests range from design to technology, and to other industries that have the potential to change the human experience, and I believe that IxD plays a critical role in how we approach these developments.";

export const awards: Award[] = [
  {
    date: "June 2015",
    title: "ECIS Award",
    description:
      "The European Council of International Schools — Award for Excellence in International Understanding",
  },
];

export const socialLinks: SocialLink[] = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/max-nobell-cluff-167655179/",
    icon: linkedinIcon,
  },
  {
    label: "Vimeo",
    href: "https://vimeo.com/user84047752/",
    icon: vimeoIcon,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/nobellcluff/",
    icon: instagramIcon,
  },
];
