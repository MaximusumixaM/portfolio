import { cn } from "@/components/lib/utils";

export type HeadingLevel = "h1" | "h2" | "h3";

/** Headings are sized by their semantic level: h1 = 32px, h2 = 24px, h3 = 20px. */
const HEADING_SIZE: Record<HeadingLevel, string> = {
  h1: "text-heading-lg",
  h2: "text-heading-md",
  h3: "text-heading-sm",
};

export type HeadingProps = React.ComponentProps<"h1"> & { level: HeadingLevel };

export function Heading({ level, className, ...props }: HeadingProps) {
  const Tag = level;
  return (
    <Tag className={cn("font-display", HEADING_SIZE[level], className)} {...props} />
  );
}

export type BodyTextProps = React.ComponentProps<"p">;

export function BodyText({ className, ...props }: BodyTextProps) {
  return (
    <p
      className={cn("font-display text-large", className)}
      {...props}
    />
  );
}

export type HelperProps = React.ComponentProps<"span">;

export function Helper({ className, ...props }: HelperProps) {
  return (
    <span
      className={cn("font-sans text-medium text-foreground-default-hover", className)}
      {...props}
    />
  );
}
