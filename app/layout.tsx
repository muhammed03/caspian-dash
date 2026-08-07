import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { getDict } from "@/shared/lib/i18n";
import { getLocale } from "@/shared/lib/i18n/server";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  display: "swap",
});

const DESCRIPTION = {
  kk: "Каспий теңізімен не болып жатыр: су деңгейі, жағалау сызығы, ластану, жануарлар және болжам — түсінікті карталар мен графиктерде.",
  ru: "Что происходит с Каспийским морем: уровень воды, береговая линия, загрязнение, животные и прогноз — на понятных картах и графиках.",
  en: "What is happening to the Caspian Sea: water level, shoreline, pollution, wildlife and projections — on maps and charts you can actually read.",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getDict(locale);
  return {
    title: `${t.common.appName} — ${t.common.tagline}`,
    description: DESCRIPTION[locale],
  };
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body className={`${inter.variable} min-h-screen antialiased`}>
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
