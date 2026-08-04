import { useEffect, useState } from "react";
import * as THREE from "three";

// Samples a Peduncle CSS token into a THREE.Color (a shader can't read CSS vars), re-sampling on colour-scheme change.
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
