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
      <DialogPrimitive.Overlay className="fixed inset-0 z-10 bg-black/40" />
      <DialogPrimitive.Content
        className={cn(
          "fixed inset-0 z-20 h-screen w-screen overflow-y-auto bg-background-default text-foreground-default",
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
