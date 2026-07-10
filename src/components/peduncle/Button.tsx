import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/components/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-s rounded-large font-sans text-medium transition-colors cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-background-default border border-border-default text-foreground-default hover:bg-background-default-hover",
        accent: "bg-background-accent-default text-foreground-on-accent hover:bg-background-accent-hover",
        ghost: "text-foreground-default hover:text-foreground-default-hover",
      },
      size: {
        default: "p-s",
        sm: "px-s py-xs",
        icon: "p-xs",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  type = "button",
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      type={asChild ? undefined : type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
