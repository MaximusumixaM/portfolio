import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/components/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-xs rounded-round bg-background-secondary font-sans whitespace-nowrap text-foreground-secondary",
  {
    variants: {
      size: {
        default: "px-s py-xxs text-medium",
        sm: "px-s text-small",
      },
    },
    defaultVariants: { size: "default" },
  },
);

export type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    /** Leads the label, sized to the text (e.g. a tool's logo). */
    icon?: React.ReactNode;
    /** A colour of the thing's own (e.g. a tool's brand), washed faintly into the badge. */
    tint?: string;
  };

/** A small rounded label: a tag, a skill. */
export function Badge({
  className,
  size,
  icon,
  tint,
  style,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ size }), className)}
      style={
        tint === undefined
          ? style
          : {
              backgroundColor: `color-mix(in srgb, ${tint} 16%, var(--color-background-secondary))`,
              ...style,
            }
      }
      {...props}
    >
      {icon !== undefined && (
        <span aria-hidden="true" className="flex size-[1em] shrink-0">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}
