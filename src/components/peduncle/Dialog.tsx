import * as DialogPrimitive from "@radix-ui/react-dialog";

import { cn } from "@/components/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export type DialogContentProps = React.ComponentProps<
  typeof DialogPrimitive.Content
> & { title: string };

export function DialogContent({
  className,
  children,
  title,
  ...props
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      {/* z-50 clears the fixed hero canvas (z-30) and HUD (z-40) so the backdrop dims them. */}
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
      <DialogPrimitive.Content
        className={cn(
          "fixed z-50 overflow-y-auto bg-background-default text-foreground-default",
          // Mobile: a fullscreen sheet.
          "inset-0",
          // Desktop: a large centered card floating over the dimmed page.
          "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[90vh] sm:w-[90vw] sm:max-w-5xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xxl sm:border sm:border-border-default sm:shadow-2xl",
          className,
        )}
        {...props}
      >
        <DialogPrimitive.Title className="visually-hidden">
          {title}
        </DialogPrimitive.Title>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
