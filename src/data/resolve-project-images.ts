import { getImage } from "astro:assets";

import type { Project, ProjectDetailImage } from "@/data/projects";
import type { ResolvedImage, ResolvedProject } from "@/types/project";

const THUMBNAIL_WIDTHS = [320, 480, 640];
const THUMBNAIL_SIZES = "(max-width: 767px) 30vw, 17vw";
const DETAIL_WIDTHS = [480, 768, 1024];
const DETAIL_SIZES = "(max-width: 767px) 98vw, 70vw";

async function resolveImage(
  image: ProjectDetailImage,
  widths: number[],
  sizes: string,
): Promise<ResolvedImage> {
  const result = await getImage({ src: image.src, widths, sizes });
  return {
    src: result.src,
    srcSet: result.srcSet.attribute,
    sizes,
    width: image.src.width,
    height: image.src.height,
    alt: image.alt,
  };
}

export async function resolveProjects(
  projects: Project[],
): Promise<ResolvedProject[]> {
  return Promise.all(
    projects.map(async (project) => {
      const [thumbnail, images] = await Promise.all([
        resolveImage(
          { src: project.thumbnail, alt: "" },
          THUMBNAIL_WIDTHS,
          THUMBNAIL_SIZES,
        ),
        Promise.all(
          project.images.map((image) =>
            resolveImage(image, DETAIL_WIDTHS, DETAIL_SIZES),
          ),
        ),
      ]);

      return {
        slug: project.slug,
        title: project.title,
        thumbnail,
        about: project.about,
        notes: project.notes,
        images,
        videoEmbedUrl: project.videoEmbedUrl,
      };
    }),
  );
}
