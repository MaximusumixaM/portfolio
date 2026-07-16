import { useEffect, useState } from "react";

/** Tracks the user's `prefers-reduced-motion` setting, reacting to live changes. */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => {
      setPrefersReduced(event.matches);
    };
    query.addEventListener("change", onChange);
    return () => {
      query.removeEventListener("change", onChange);
    };
  }, []);

  return prefersReduced;
}
