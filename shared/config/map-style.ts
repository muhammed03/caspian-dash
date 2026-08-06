/**
 * Map framing constants. The basemap itself is drawn by deck.gl from the
 * GeoJSON committed under data/geo — there is no tile server and no style
 * document, which is what lets the map render with the network unplugged.
 */
export const CASPIAN_CENTER: [number, number] = [50.9, 42.6];

export const CASPIAN_BOUNDS: [[number, number], [number, number]] = [
  [40.0, 33.0],
  [62.0, 50.5],
];
