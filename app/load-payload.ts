import type { PropertyPayload } from "./property-explorer";
import islandData from "./islands_top50.json";
import storedData from "./property-data.json";
import { deduplicateProperties, sanitizeIslandName, sanitizeTransit } from "./property-normalization";

export async function loadPayload(): Promise<PropertyPayload> {
  const stored = storedData as PropertyPayload;
  const officialIslandNames = new Map(islandData.islands.map((island) => [island.id, island.name]));
  const normalizedItems = (stored.items || []).map((item) => ({
    external_id: item.external_id,
    title: item.title,
    monthly_rent_yen: item.monthly_rent_yen,
    floor_plan: item.floor_plan,
    building_area_m2: item.building_area_m2,
    floor: item.floor,
    management_fee_yen: item.management_fee_yen,
    built_text: item.built_text,
    address: item.address,
    transit: sanitizeTransit(item.transit),
    island_id: item.island_id,
    island_name: officialIslandNames.get(item.island_id || "") || sanitizeIslandName(item.island_name),
    source_url: item.source_url,
    source_urls: item.source_urls,
    duplicate_listing_count: item.duplicate_listing_count,
    last_seen_at: item.last_seen_at,
  }));
  const items = deduplicateProperties(normalizedItems);
  const searchStatuses = (stored.searchStatuses || []).map((status) => ({
    islandId: status.islandId,
    islandName: status.islandName,
    status: status.status,
    count: status.count,
    checkedAt: status.checkedAt,
  }));

  return {
    total: items.length,
    items,
    searchStatuses,
    generatedAt: stored.generatedAt || null,
    notice: stored.notice,
  };
}

export function summarizePayload(payload: PropertyPayload): PropertyPayload {
  return {
    ...payload,
    items: payload.items.map((item) => ({ island_id: item.island_id })),
  };
}
