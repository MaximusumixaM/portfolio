import * as TabsPrimitive from "@radix-ui/react-tabs";
import { useEffect, useRef } from "react";

import { cn } from "@/components/lib/utils";

// Radix tabs (roles, arrow-key movement between tabs, the active tab in the tab order) styled as a
// row of words: the current one semibold and in full colour, the rest a weight lighter and
// receding, with one underline that slides along to the selection.

export const Tabs = TabsPrimitive.Root;

export type TabsListProps = React.ComponentProps<typeof TabsPrimitive.List>;

/** A row of tabs with one underline that slides to whichever is selected. */
export function TabsList({ className, children, ...props }: TabsListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const underlineRef = useRef<HTMLSpanElement>(null);

  // Follows the selected tab (its state, and its size as fonts load or the row reflows). The first
  // placement lands without sliding; after that the move animates.
  useEffect(() => {
    const list = listRef.current;
    const underline = underlineRef.current;
    if (list === null || underline === null) return;
    const row = list;
    const line = underline;
    function place() {
      const selected = row.querySelector<HTMLElement>(
        '[role="tab"][data-state="active"]',
      );
      if (selected === null) {
        line.style.opacity = "0";
        return;
      }
      line.style.opacity = "1";
      line.style.transform = `translateX(${String(selected.offsetLeft)}px)`;
      line.style.width = `${String(selected.offsetWidth)}px`;
    }
    place();
    const frame = requestAnimationFrame(() => {
      line.dataset.settled = "";
    });
    const selection = new MutationObserver(place);
    selection.observe(row, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-state"],
    });
    const sizes = new ResizeObserver(place);
    sizes.observe(row);
    for (const tab of row.querySelectorAll('[role="tab"]')) sizes.observe(tab);
    return () => {
      cancelAnimationFrame(frame);
      selection.disconnect();
      sizes.disconnect();
    };
  }, []);

  return (
    <TabsPrimitive.List
      ref={listRef}
      className={cn("relative flex gap-m overflow-x-auto", className)}
      {...props}
    >
      {children}
      <span
        ref={underlineRef}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 h-px w-0 bg-foreground-default opacity-0 data-settled:transition-[transform,width] data-settled:duration-300 data-settled:ease-out motion-reduce:transition-none"
      />
    </TabsPrimitive.List>
  );
}

export type TabsTriggerProps = React.ComponentProps<
  typeof TabsPrimitive.Trigger
>;

export function TabsTrigger({
  className,
  children,
  ...props
}: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "shrink-0 cursor-pointer border-b border-transparent py-xs font-display text-xl font-medium tracking-wide whitespace-nowrap text-foreground-tertiary transition-colors hover:text-foreground-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus data-[state=active]:font-semibold data-[state=active]:text-foreground-default",
        className,
      )}
      {...props}
    >
      {/* An unseen semibold copy holds each tab at its selected width, so the row doesn't shift
          as the selection (and the weight) moves along it. */}
      <span className="grid">
        <span className="col-start-1 row-start-1">{children}</span>
        <span
          aria-hidden="true"
          className="invisible col-start-1 row-start-1 font-semibold"
        >
          {children}
        </span>
      </span>
    </TabsPrimitive.Trigger>
  );
}

export type TabsContentProps = React.ComponentProps<
  typeof TabsPrimitive.Content
>;

export function TabsContent({ className, ...props }: TabsContentProps) {
  return (
    <TabsPrimitive.Content
      className={cn(
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
        className,
      )}
      {...props}
    />
  );
}
