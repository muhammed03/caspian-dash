import { kk as kkDict } from "./kk";
import { ru as ruDict } from "./ru";
import { en as enDict } from "./en";
import { DEFAULT_LOCALE, type Locale } from "./locales";

export { LOCALES, DEFAULT_LOCALE, isLocale, type Locale } from "./locales";
export type { Dict } from "./types";
export {
  byLocale,
  pick,
  pickOrNull,
  formatNumber,
  formatFixed,
  intlTag,
  type Trio,
} from "./pick";

export { kk } from "./kk";
export { ru } from "./ru";
export { en } from "./en";

import type { Dict } from "./types";

/**
 * Keyed rather than branched: adding a locale means adding a row here, not
 * finding every conditional that assumed there were only two languages.
 */
const DICTS: Record<Locale, Dict> = {
  kk: kkDict,
  ru: ruDict,
  en: enDict,
};

export function getDict(locale: Locale): Dict {
  return DICTS[locale] ?? DICTS[DEFAULT_LOCALE];
}
