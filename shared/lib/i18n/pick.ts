import { DEFAULT_LOCALE, LOCALES, type Locale } from "./locales";

/**
 * One string per locale. Every locale is required, so adding a fourth language
 * makes the compiler point at each table that still needs a translation
 * instead of letting it fall through to Russian at runtime.
 */
export type Trio = Record<Locale, string>;

/** Optional variant, for fields that legitimately have no text (a caveat that does not apply). */
export type TrioOrNull = Record<Locale, string | null | undefined>;

export function byLocale(locale: Locale, trio: Trio): string;
export function byLocale(locale: Locale, trio: TrioOrNull): string | null;
export function byLocale(locale: Locale, trio: TrioOrNull): string | null {
  return trio[locale] ?? null;
}

/**
 * Fallback order used when a record has not been translated yet: the requested
 * locale first, then the remaining ones in a fixed order so the reader always
 * sees *something* rather than an empty cell.
 */
const FALLBACK: Record<Locale, readonly Locale[]> = {
  kk: ["kk", "ru", "en"],
  ru: ["ru", "kk", "en"],
  en: ["en", "ru", "kk"],
};

/**
 * Reads a suffixed field off a data record — `pick(river, "name", locale)`
 * returns `name_en`, `name_ru` or `name_kk` depending on the locale and on
 * what the record actually carries.
 *
 * The dataset files use this `_kk` / `_ru` / `_en` convention throughout, so
 * this single helper replaces the reads that used to be spelled out as a
 * two-way conditional at every call site.
 */
export function pick(
  record: Record<string, unknown> | null | undefined,
  field: string,
  locale: Locale
): string {
  if (!record) return "";
  for (const candidate of FALLBACK[locale] ?? FALLBACK[DEFAULT_LOCALE]) {
    const value = record[`${field}_${candidate}`];
    if (typeof value === "string" && value.length > 0) return value;
  }
  const bare = record[field];
  return typeof bare === "string" ? bare : "";
}

/** Same as `pick`, but returns null instead of "" so callers can skip the row entirely. */
export function pickOrNull(
  record: Record<string, unknown> | null | undefined,
  field: string,
  locale: Locale
): string | null {
  const value = pick(record, field, locale);
  return value.length > 0 ? value : null;
}

/** BCP-47 tags for `Intl`. Kazakh and Russian both group with a space; English uses a comma. */
const INTL_TAG: Record<Locale, string> = {
  kk: "kk-KZ",
  ru: "ru-RU",
  en: "en-US",
};

export function intlTag(locale: Locale): string {
  return INTL_TAG[locale] ?? INTL_TAG[DEFAULT_LOCALE];
}

/**
 * Locale-correct number formatting. Replaces the hardcoded `"ru-RU"` that used
 * to appear at every call site, which showed Russian grouping to Kazakh and
 * English readers alike.
 */
export function formatNumber(
  value: number | null | undefined,
  locale: Locale,
  options?: Intl.NumberFormatOptions
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return value.toLocaleString(intlTag(locale), options);
}

/** Fixed-decimal convenience wrapper — the most common shape at the call sites. */
export function formatFixed(
  value: number | null | undefined,
  locale: Locale,
  digits: number
): string {
  return formatNumber(value, locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export { LOCALES, DEFAULT_LOCALE, type Locale };
