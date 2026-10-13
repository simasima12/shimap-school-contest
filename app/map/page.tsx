import type { Metadata } from "next";
import { loadPayload, summarizePayload } from "../load-payload";
import { PropertyExplorer } from "../property-explorer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "島の地図",
  description: "地図から日本の有人離島を探せます。",
  alternates: { canonical: "/map" },
};

export default async function MapPage() {
  return <PropertyExplorer payload={summarizePayload(await loadPayload())} initialView="map" />;
}
