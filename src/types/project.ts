import type { ProjectLocation } from "@/data/locations";

export interface ResolvedImage {
  src: string;
  srcSet: string;
  sizes: string;
  width: number;
  height: number;
  alt: string;
}

export interface ProjectNote {
  label: string;
  text: string;
}

export interface ResolvedProject {
  slug: string;
  title: string;
  location: ProjectLocation;
  thumbnail: ResolvedImage;
  about: string;
  notes: ProjectNote[];
  images: ResolvedImage[];
  videoEmbedUrl?: string;
}
