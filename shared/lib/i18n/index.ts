export const LOCALES = ["kk", "ru"] as const;
export type Locale = (typeof LOCALES)[number];

export { kk } from "./kk";
export { ru } from "./ru";

import { kk as kkDict } from "./kk";
import { ru as ruDict } from "./ru";

export type Dict = typeof kkDict;

export function getDict(locale: Locale): Dict {
  return locale === "ru" ? (ruDict as Dict) : kkDict;
}
