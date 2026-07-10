import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/components/lib/utils";

export const Tabs = TabsPrimitive.Root;
export const TabsContent = TabsPrimitive.Content;

export type TabsListProps = React.ComponentProps<typeof TabsPrimitive.List>;

export function TabsList({ className, ...props }: TabsListProps) {
  return (
    <TabsPrimitive.List
      className={cn("flex gap-l px-l pt-l", className)}
      {...props}
    />
  );
}

export type TabsTriggerProps = React.ComponentProps<
  typeof TabsPrimitive.Trigger
>;

export function TabsTrigger({ className, ...props }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "relative cursor-pointer border-none bg-transparent pb-xs font-sans text-large text-foreground-default",
        "after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-full after:origin-bottom-left after:scale-x-0 after:bg-foreground-default after:transition-transform after:duration-300 after:ease-out",
        "hover:after:scale-x-100 data-[state=active]:after:scale-x-100",
        className,
      )}
      {...props}
    />
  );
}
