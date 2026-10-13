import type { Metadata } from "next";
import { loadPayload, summarizePayload } from "../load-payload";
import { PropertyExplorer } from "../property-explorer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "島一覧",
  description: "日本の有人離島を人口、地域、特徴から探せる島一覧です。",
  alternates: { canonical: "/islands" },
};

export default async function IslandsPage() {
  return <PropertyExplorer payload={summarizePayload(await loadPayload())} initialView="islands" />;
}
