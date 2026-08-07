import { cookies } from "next/headers";

import { DEFAULT_LOCALE, isLocale, type Locale } from "./locales";

/**
 * The locale for the current request, read from the cookie the switcher sets.
 * Used by the root layout and by every `generateMetadata`, so the tab title
 * and the page follow the same language.
 */
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get("locale")?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
