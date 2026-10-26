import { useEffect, useState } from "react";
import * as THREE from "three";

/** Root attributes that repoint tokens (`style` carries the chapter blend); any change means re-sampling. */
const THEME_ATTRIBUTES = ["data-chapter", "data-chapter-next", "style"];

// Samples a Peduncle CSS token into a THREE.Color (a shader can't read CSS vars), re-sampling on
// colour-scheme change and whenever the chapter blend moves.
export function useThemeColor(
  customProperty: string,
  fallback: string,
): THREE.Color {
  const [color, setColor] = useState(() => new THREE.Color(fallback));

  useEffect(() => {
    const root = document.documentElement;
    let lastValue = "";

    function read() {
      const value = getComputedStyle(root)
        .getPropertyValue(customProperty)
        .trim();
      if (value === "" || value === lastValue) return;
      lastValue = value;
      setColor(sampleCssColor(value));
    }

    read();
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    query.addEventListener("change", read);
    const observer = new MutationObserver(read);
    observer.observe(root, { attributeFilter: THEME_ATTRIBUTES });

    return () => {
      query.removeEventListener("change", read);
      observer.disconnect();
    };
  }, [customProperty]);

  return color;
}

let sampler: CanvasRenderingContext2D | null = null;

/**
 * Resolves any CSS colour to sRGB by painting it, since a blended token computes to `oklch()`,
 * which THREE's parser can't read.
 */
function sampleCssColor(value: string): THREE.Color {
  sampler ??= document
    .createElement("canvas")
    .getContext("2d", { willReadFrequently: true });
  if (sampler === null) return new THREE.Color(value);
  sampler.clearRect(0, 0, 1, 1);
  sampler.fillStyle = value;
  sampler.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0] = sampler.getImageData(0, 0, 1, 1).data;
  return new THREE.Color().setRGB(
    r / 255,
    g / 255,
    b / 255,
    THREE.SRGBColorSpace,
  );
}
