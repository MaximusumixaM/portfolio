/** Real-world sites the projects were made at — pinned on the portfolio globe. */
export interface ProjectLocation {
  /** City + country, shown above the project title. */
  label: string;
  /** The institution or studio at that city. */
  place: string;
  lat: number;
  lng: number;
}

export const locations = {
  hfg: {
    label: "Schwäbisch Gmünd, Germany",
    place: "Hochschule für Gestaltung Schwäbisch Gmünd",
    lat: 48.8046,
    lng: 9.8086,
  },
  designForHumans: {
    label: "Vancouver, Canada",
    place: "Design for Humans",
    lat: 49.2827,
    lng: -123.1078,
  },
  emilyCarr: {
    label: "Vancouver, Canada",
    place: "Emily Carr University of Art + Design",
    lat: 49.2657,
    lng: -123.0958,
  },
} satisfies Record<string, ProjectLocation>;
