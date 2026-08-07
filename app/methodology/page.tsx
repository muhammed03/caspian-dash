import type { Metadata } from "next";
import { MethodologyView } from "@/widgets/methodology/methodology-view";
import { getDict } from "@/shared/lib/i18n";
import { getLocale } from "@/shared/lib/i18n/server";

const DESCRIPTION = {
  kk: "Caspian Watch платформасындағы әрбір есептеудің формуласы, дереккөзі және шектеулері.",
  ru: "Формула, источник и ограничения каждого расчёта платформы Caspian Watch.",
  en: "The formula, source and limitations behind every calculation on the Caspian Watch platform.",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getDict(locale);
  return {
    title: `${t.common.appName} — ${t.methodology.title}`,
    description: DESCRIPTION[locale],
  };
}

export default function MethodologyPage() {
  return <MethodologyView />;
}
