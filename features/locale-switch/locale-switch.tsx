"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/shared/lib/cn";
import { LOCALES, type Locale } from "@/shared/lib/i18n";
import { useLocale } from "@/shared/lib/i18n/client";

const LABELS: Record<Locale, string> = { kk: "ҚАЗ", ru: "РУС" };

export function LocaleSwitch({ className }: { className?: string }) {
  const current = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function pick(locale: Locale) {
    if (locale === current) return;
    document.cookie = `locale=${locale}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div
      className={cn("glass flex items-center rounded-full p-0.5 text-[11px] font-medium", className)}
      role="group"
      aria-label="Language"
    >
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => pick(locale)}
          aria-pressed={locale === current}
          disabled={pending}
          className={cn(
            "rounded-full px-2.5 py-1 transition-colors duration-300",
            locale === current ? "bg-glow/20 text-glow" : "text-mist/60 hover:text-foam"
          )}
        >
          {LABELS[locale]}
        </button>
      ))}
    </div>
  );
}
