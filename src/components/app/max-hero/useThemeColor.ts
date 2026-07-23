import { useEffect, useState } from "react";
import * as THREE from "three";

/**
 * Bridges a Peduncle token into a THREE.Color for use in a WebGL material. Tokens are CSS
 * custom properties, which a shader can't read, so the computed value is sampled — and
 * re-sampled on colour-scheme change, since the semantic tokens are theme-aware.
 */
export function useThemeColor(customProperty: string, fallback: string): THREE.Color {
  const [color, setColor] = useState(() => new THREE.Color(fallback));

  useEffect(() => {
    function read() {
      const value = getComputedStyle(document.documentElement)
        .getPropertyValue(customProperty)
        .trim();
      if (value !== "") setColor(new THREE.Color(value));
    }
    read();
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    query.addEventListener("change", read);
    return () => {
      query.removeEventListener("change", read);
    };
  }, [customProperty]);

  return color;
}
