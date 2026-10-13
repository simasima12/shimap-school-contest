import { loadPayload, summarizePayload } from "./load-payload";
import { PropertyExplorer } from "./property-explorer";

export const dynamic = "force-dynamic";

export default async function Home() {
  const payload = summarizePayload(await loadPayload());
  return <PropertyExplorer payload={payload} initialView="home" />;
}
