import type { kk } from "./kk";

/**
 * Kazakh is the reference shape: it is the default locale, so it is the one
 * that is always complete. Every other dictionary is checked against it with
 * `satisfies Dict`, which turns a forgotten key into a build error instead of
 * an `undefined` that renders as a blank label.
 */
export type Dict = typeof kk;
