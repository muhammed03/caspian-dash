/**
 * Marker glyphs for the map, inlined as data URIs.
 *
 * They ship inside the bundle rather than as files so the map keeps working
 * with no network, and each is drawn at 2× so it stays crisp on retina.
 */
function svg(body: string, size = 64): string {
  const doc = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${body}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(doc)}`;
}

/** Pin with an industrial silhouette: chimneys over a saw-tooth roof. */
function facilityPin(fill: string, stroke: string): string {
  return svg(`
    <path d="M32 4C20.4 4 11 13.4 11 25c0 14.6 17.6 32.4 19.4 34.2a2.3 2.3 0 0 0 3.2 0C35.4 57.4 53 39.6 53 25 53 13.4 43.6 4 32 4z"
          fill="${fill}" stroke="${stroke}" stroke-width="3"/>
    <g fill="#ffffff">
      <rect x="20" y="27" width="4.4" height="12" rx="1"/>
      <rect x="26.4" y="22" width="4.4" height="17" rx="1"/>
      <path d="M33.5 30.5l5.2-3.6v3.6l5.3-3.6V39H33.5z"/>
    </g>
  `);
}

/** Same pin outline, hollow, for a coordinate that is not confirmed. */
function approxPin(stroke: string): string {
  return svg(`
    <path d="M32 4C20.4 4 11 13.4 11 25c0 14.6 17.6 32.4 19.4 34.2a2.3 2.3 0 0 0 3.2 0C35.4 57.4 53 39.6 53 25 53 13.4 43.6 4 32 4z"
          fill="#ffffff" stroke="${stroke}" stroke-width="3" stroke-dasharray="7 5"/>
    <g fill="${stroke}">
      <rect x="20" y="27" width="4.4" height="12" rx="1"/>
      <rect x="26.4" y="22" width="4.4" height="17" rx="1"/>
      <path d="M33.5 30.5l5.2-3.6v3.6l5.3-3.6V39H33.5z"/>
    </g>
  `);
}

/** Radiation trefoil for the Koshkar-Ata tailings pond. */
function hazardPin(fill: string, stroke: string): string {
  return svg(`
    <path d="M32 4C20.4 4 11 13.4 11 25c0 14.6 17.6 32.4 19.4 34.2a2.3 2.3 0 0 0 3.2 0C35.4 57.4 53 39.6 53 25 53 13.4 43.6 4 32 4z"
          fill="${fill}" stroke="${stroke}" stroke-width="3"/>
    <g fill="#ffffff" transform="translate(32 27)">
      <circle r="3.1"/>
      <path d="M-2.6-4.5a9 9 0 0 1 5.2 0l3-9.6a19 19 0 0 0-11.2 0z"/>
      <path d="M4.1-2.2a9 9 0 0 1 2.6 4.5l10 .5a19 19 0 0 0-5.6-9.7z"/>
      <path d="M-4.1-2.2a9 9 0 0 0-2.6 4.5l-10 .5a19 19 0 0 1 5.6-9.7z"/>
    </g>
  `);
}

export const FACILITY_ICON = facilityPin("#be185d", "#7d1240");
export const FACILITY_ICON_APPROX = approxPin("#be185d");
export const HAZARD_ICON = hazardPin("#9f1239", "#63071f");

/** deck.gl per-icon descriptor; the anchor sits at the tip of the pin. */
export const PIN = { width: 64, height: 64, anchorX: 32, anchorY: 62 } as const;
