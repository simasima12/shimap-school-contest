import type { Metadata } from "next";
import { loadPayload, summarizePayload } from "../load-payload";
import { PropertyExplorer } from "../property-explorer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "データについて",
  description: "島ップで使用しているデータの出典、更新方法、注意事項を説明します。",
  alternates: { canonical: "/data" },
};

export default async function DataPage() {
  return <PropertyExplorer payload={summarizePayload(await loadPayload())} initialView="data" />;
}
