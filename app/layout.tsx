import type { Metadata, Viewport } from "next";
import { Inter, Unbounded } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { Providers } from "./providers";
import { LOCALES, type Locale } from "@/shared/lib/i18n";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  display: "swap",
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Caspian Watch — Каспий теңізінің экологиялық мониторингі",
  description:
    "AI-платформа экологического мониторинга Каспийского моря: уровень воды, береговая линия, загрязнение, флора и фауна, прогнозы.",
};

export const viewport: Viewport = {
  themeColor: "#05070b",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const raw = cookieStore.get("locale")?.value;
  const locale: Locale = LOCALES.includes(raw as Locale) ? (raw as Locale) : "kk";

  return (
    <html lang={locale} className="dark">
      <body
        className={`${inter.variable} ${unbounded.variable} noise bg-ocean min-h-screen antialiased`}
      >
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
