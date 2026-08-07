import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MapShell } from "@/widgets/map/map-shell";
import type { ModuleId } from "@/shared/store/map-store";
import { WaterPanel } from "@/widgets/panels/water-panel";
import { PollutionPanel } from "@/widgets/panels/pollution-panel";
import { LifePanel } from "@/widgets/panels/life-panel";
import { ResourcesPanel } from "@/widgets/panels/resources-panel";
import { IndexPanel } from "@/widgets/panels/index-panel";
import { getDict } from "@/shared/lib/i18n";
import { getLocale } from "@/shared/lib/i18n/server";

const MODULES: ModuleId[] = ["water", "pollution", "life", "resources", "index"];

export function generateStaticParams() {
  return MODULES.map((module) => ({ module }));
}

/** Names the open module, so a pinned tab per dashboard stays distinguishable. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ module: string }>;
}): Promise<Metadata> {
  const { module } = await params;
  const locale = await getLocale();
  const t = getDict(locale);
  const name = MODULES.includes(module as ModuleId) ? t.nav[module as ModuleId] : t.common.map;
  return { title: `${t.common.appName} — ${name}` };
}

const PANELS: Record<ModuleId, React.ComponentType> = {
  water: WaterPanel,
  pollution: PollutionPanel,
  life: LifePanel,
  resources: ResourcesPanel,
  index: IndexPanel,
};

export default async function MapModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  if (!MODULES.includes(module as ModuleId)) notFound();

  const id = module as ModuleId;
  const Panel = PANELS[id];

  return <MapShell module={id} panel={<Panel />} />;
}
