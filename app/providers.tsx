"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { LocaleProvider } from "@/shared/lib/i18n/client";
import type { Locale } from "@/shared/lib/i18n";
import { SmoothScroll } from "@/shared/ui/smooth-scroll";
import { SiteHeader } from "@/widgets/site-header/site-header";

export function Providers({
  locale = "kk",
  children,
}: {
  locale?: Locale;
  children: React.ReactNode;
}) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      <LocaleProvider locale={locale}>
        <SmoothScroll />
        <SiteHeader />
        {children}
      </LocaleProvider>
    </QueryClientProvider>
  );
}
