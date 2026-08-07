/**
 * The locale list lives on its own so that helper modules can depend on the
 * type without pulling in the dictionaries — several `shared/lib` modules are
 * imported by the dictionaries' own consumers and would otherwise cycle.
 */
export const LOCALES = ["kk", "ru", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "kk";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
