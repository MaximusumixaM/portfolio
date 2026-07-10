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
  thumbnail: ResolvedImage;
  about: string;
  notes: ProjectNote[];
  images: ResolvedImage[];
  videoEmbedUrl?: string;
}
