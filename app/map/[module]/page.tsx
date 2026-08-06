import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MapShell } from "@/widgets/map/map-shell";
import type { ModuleId } from "@/shared/store/map-store";
import { WaterPanel } from "@/widgets/panels/water-panel";
import { PollutionPanel } from "@/widgets/panels/pollution-panel";
import { LifePanel } from "@/widgets/panels/life-panel";
import { ResourcesPanel } from "@/widgets/panels/resources-panel";
import { IndexPanel } from "@/widgets/panels/index-panel";

const MODULES: ModuleId[] = ["water", "pollution", "life", "resources", "index"];

export function generateStaticParams() {
  return MODULES.map((module) => ({ module }));
}

export const metadata: Metadata = { title: "Caspian Watch — карта" };

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
