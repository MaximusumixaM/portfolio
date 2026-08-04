/** Real-world sites the projects were made at — pinned on the portfolio globe. */
export interface ProjectLocation {
  /** City + country, shown above the project title. */
  label: string;
  /** The institution or studio at that city. */
  place: string;
  lat: number;
  lng: number;
  /** ISO 3166-1 alpha-3, matching `ISO_A3` in `public/geo/countries.geojson`. */
  countryCode: string;
  /** ISO 3166-2, matching `iso` in `public/geo/regions.geojson`. */
  regionCode: string;
}

export const locations = {
  hfg: {
    label: "Schwäbisch Gmünd, Germany",
    place: "Hochschule für Gestaltung Schwäbisch Gmünd",
    lat: 48.8046,
    lng: 9.8086,
    countryCode: "DEU",
    regionCode: "DE-BW",
  },
  designForHumans: {
    label: "Vancouver, Canada",
    place: "Design for Humans",
    lat: 49.2827,
    lng: -123.1078,
    countryCode: "CAN",
    regionCode: "CA-BC",
  },
  emilyCarr: {
    label: "Vancouver, Canada",
    place: "Emily Carr University of Art + Design",
    lat: 49.2657,
    lng: -123.0958,
    countryCode: "CAN",
    regionCode: "CA-BC",
  },
} satisfies Record<string, ProjectLocation>;
