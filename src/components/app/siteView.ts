import type { AboutSection } from "@/components/app/about/aboutView";

/** The view a page opens on: the portfolio, About (on one of its sections), or one project. */
export type SiteView =
  | { kind: "portfolio" }
  | { kind: "about"; section: AboutSection }
  | { kind: "project"; projectId: string };

export const PORTFOLIO_VIEW: SiteView = { kind: "portfolio" };
