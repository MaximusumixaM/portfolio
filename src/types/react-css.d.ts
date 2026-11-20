import "react";

// Lets inline styles set CSS custom properties (`style={{ "--shift": "8px" }}`), which React passes
// through as-is, so Tailwind classes can read them (`translate-x-(--shift)`).
declare module "react" {
  interface CSSProperties {
    [property: `--${string}`]: string | number | undefined;
  }
}
