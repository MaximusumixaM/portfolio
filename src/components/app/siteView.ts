/** The view a page opens on: the portfolio, About, or one project (by its id). */
export type SiteView =
  | { kind: "portfolio" }
  | { kind: "about" }
  | { kind: "project"; projectId: string };

export const PORTFOLIO_VIEW: SiteView = { kind: "portfolio" };
