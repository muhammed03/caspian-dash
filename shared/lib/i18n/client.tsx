"use client";

import { createContext, useContext } from "react";
import { getDict, type Dict, type Locale } from "./index";

const LocaleContext = createContext<{ locale: Locale; dict: Dict }>({
  locale: "kk",
  dict: getDict("kk"),
});

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={{ locale, dict: getDict(locale) }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext).locale;
}

export function useT() {
  return useContext(LocaleContext).dict;
}
