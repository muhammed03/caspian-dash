import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { Providers } from "./providers";
import { LOCALES, type Locale } from "@/shared/lib/i18n";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Caspian Watch — Каспий теңізінің экологиялық мониторингі",
  description:
    "Что происходит с Каспийским морем: уровень воды, береговая линия, загрязнение, животные и прогноз — на понятных картах и графиках.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const raw = cookieStore.get("locale")?.value;
  const locale: Locale = LOCALES.includes(raw as Locale) ? (raw as Locale) : "kk";

  return (
    <html lang={locale}>
      <body className={`${inter.variable} min-h-screen antialiased`}>
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
