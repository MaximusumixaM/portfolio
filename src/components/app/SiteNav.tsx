import { TabsList, TabsTrigger } from "@/components/peduncle/Tabs";

export interface NavItem {
  id: string;
  label: string;
}

const items: NavItem[] = [
  { id: "projects", label: "Projects" },
  { id: "about", label: "About" },
];

export function SiteNav() {
  return (
    <TabsList aria-label="Primary">
      {items.map((item) => (
        <TabsTrigger key={item.id} value={item.id}>
          {item.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
