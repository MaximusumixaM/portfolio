import { cn } from "@/components/lib/utils";

/** How much of the pinboard a piece takes: two by two, two across, two down, or one cell. */
export type CollageShape = "big" | "wide" | "tall" | "small";

export interface CollageItem {
  id: string;
  shape: CollageShape;
}

const SHAPE_SPAN: Record<CollageShape, string> = {
  big: "col-span-2 row-span-2",
  wide: "col-span-2",
  tall: "row-span-2",
  small: "",
};

function placeholders(
  prefix: string,
  shapes: readonly CollageShape[],
): CollageItem[] {
  return shapes.map((shape, index) => ({
    id: `${prefix}-${String(index + 1)}`,
    shape,
  }));
}

/** Stand-ins until the real drawings and photos (each tab its own arrangement). */
export const PLACEHOLDER_DRAWINGS = placeholders("drawing", [
  "tall",
  "big",
  "small",
  "small",
  "wide",
  "small",
  "tall",
  "small",
  "wide",
]);

export const PLACEHOLDER_PHOTOS = placeholders("photo", [
  "big",
  "small",
  "tall",
  "small",
  "wide",
  "small",
  "small",
  "big",
  "small",
  "tall",
  "wide",
  "small",
]);

export interface CollageProps {
  items: readonly CollageItem[];
  label: string;
}

/**
 * A mixed-size pinboard of pieces: four columns (two on phones), each piece spanning by its
 * shape, packed densely so the gaps fill. Grey blocks for now where the images will go.
 */
export function Collage({ items, label }: CollageProps) {
  return (
    <ul
      aria-label={label}
      className="mx-auto grid w-full max-w-5xl grid-flow-dense auto-rows-[8rem] grid-cols-2 gap-s md:auto-rows-[12rem] md:grid-cols-4"
    >
      {items.map(({ id, shape }) => (
        <li
          key={id}
          aria-hidden="true"
          className={cn(
            "rounded-xl bg-background-secondary",
            SHAPE_SPAN[shape],
          )}
        />
      ))}
    </ul>
  );
}
