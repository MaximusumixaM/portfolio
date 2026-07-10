import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/components/lib/utils";

const headingVariants = cva("font-display", {
  variants: {
    size: {
      large: "text-xxl",
      medium: "text-xl",
      small: "text-large",
    },
  },
  defaultVariants: { size: "medium" },
});

export type HeadingLevel = "h1" | "h2" | "h3";

export type HeadingProps = React.ComponentProps<"h1"> &
  VariantProps<typeof headingVariants> & { level: HeadingLevel };

export function Heading({
  level,
  size,
  className,
  ...props
}: HeadingProps) {
  const Tag = level;
  return (
    <Tag className={cn(headingVariants({ size }), className)} {...props} />
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
