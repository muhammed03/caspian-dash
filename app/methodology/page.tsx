import type { Metadata } from "next";
import { MethodologyView } from "@/widgets/methodology/methodology-view";

export const metadata: Metadata = {
  title: "Caspian Watch — Әдістеме / Методика",
  description:
    "Формула, источник и ограничения каждого расчёта платформы Caspian Watch.",
};

export default function MethodologyPage() {
  return <MethodologyView />;
}
