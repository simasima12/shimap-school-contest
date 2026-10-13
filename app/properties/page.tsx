import type { Metadata } from "next";
import { loadPayload } from "../load-payload";
import { PropertyExplorer } from "../property-explorer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "賃貸物件検索",
  description: "島ごとに取得した賃貸物件情報を検索できます。",
  alternates: { canonical: "/properties" },
};

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<{ island?: string; query?: string }> }) {
  const { island, query } = await searchParams;
  return <PropertyExplorer payload={await loadPayload()} initialView="properties" initialIslandId={island} initialPropertyQuery={query} />;
}
