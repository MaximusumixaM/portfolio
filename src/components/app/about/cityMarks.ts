import { phase } from "@/components/app/scroll/timeline";

/**
 * A city's arrival on the About globe, as sub-ranges of the marks' 0–1 progress: the country's
 * province lines draw from the city, the country (lightly) and the city's province shade in, the
 * pin rises, and the leader line runs out to its heading.
 */
export const ARRIVAL = {
  provinces: [0, 0.6],
  shade: [0.3, 0.7],
  pin: [0.35, 0.65],
  line: [0.5, 0.85],
} as const;

export interface CityMarks {
  provinces: number;
  shade: number;
  pin: number;
  line: number;
}

export function cityMarks(progress: number): CityMarks {
  return {
    provinces: phase(progress, ARRIVAL.provinces),
    shade: phase(progress, ARRIVAL.shade),
    pin: phase(progress, ARRIVAL.pin),
    line: phase(progress, ARRIVAL.line),
  };
}
