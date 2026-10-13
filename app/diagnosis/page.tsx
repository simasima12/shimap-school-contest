import islandData from "../islands_top50.json";
import { loadPayload } from "../load-payload";
import { IslandLivingDiagnosis } from "./island-living-diagnosis";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "島暮らし診断", description: "質問への回答と収録データの特徴から、希望に近い島を探す簡易診断です。", alternates: { canonical: "/diagnosis" } };

export default async function DiagnosisPage() {
  const payload = await loadPayload();
  const propertyCounts = Object.fromEntries(islandData.islands.map((island) => [island.id, payload.items.filter((item) => item.island_id === island.id).length]));
  return <IslandLivingDiagnosis islands={islandData.islands} propertyCounts={propertyCounts} />;
}
