const MERGED_LISTING_SUFFIX = /\s*掲載\s*[\d０-９,，]+\s*件を統合\s*/gu;
const WALK_MINUTES = /(?:歩|徒歩)\s*([\d,]+)\s*分/gu;

const clean = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();

export function sanitizeIslandName(value: unknown): string {
  return clean(value).replace(MERGED_LISTING_SUFFIX, " ").replace(/\s+/g, " ").trim();
}

export function sanitizeTransit(value: unknown, maximumWalkMinutes = 299): string | undefined {
  const text = clean(value);
  if (!text) return undefined;
  const alternatives = text.split(/\s+\/\s+/u).map(clean).filter(Boolean);
  const valid = alternatives.filter((alternative) => {
    const minutes = [...alternative.normalize("NFKC").matchAll(WALK_MINUTES)]
      .map((match) => Number(match[1].replace(/,/g, "")))
      .filter(Number.isFinite);
    return !minutes.some((minute) => minute > maximumWalkMinutes);
  });
  return valid.length ? valid.join(" / ") : undefined;
}

export function safePropertyTitle(title: unknown, islandName: string): string {
  const value = clean(title);
  if (!value) return "物件名は掲載元で確認";
  const minutes = [...value.normalize("NFKC").matchAll(WALK_MINUTES)]
    .map((match) => Number(match[1].replace(/,/g, "")))
    .filter(Number.isFinite);
  return minutes.some((minute) => minute >= 300) ? `${islandName}の賃貸物件` : value;
}

type DeduplicableProperty = {
  island_id?: string;
  title?: string;
  address?: string;
  monthly_rent_yen?: number | null;
  floor_plan?: string;
  building_area_m2?: number | null;
  floor?: string | null;
  management_fee_yen?: number | null;
  source_url?: string;
  source_urls?: string[];
  duplicate_listing_count?: number;
  last_seen_at?: string | null;
};

const identityText = (value: unknown) => clean(value).toLowerCase().replace(/[‐‑‒–—―−ー]/g, "-");
const baseIdentity = (property: DeduplicableProperty) => [
  property.island_id, property.title, property.address, property.monthly_rent_yen,
  property.floor_plan, property.building_area_m2,
].map(identityText).join("|");
const optionalIdentity = (property: DeduplicableProperty) =>
  [property.floor, property.management_fee_yen].map(identityText);
const sourceUrls = (property: DeduplicableProperty) =>
  [...new Set((property.source_urls?.length ? property.source_urls : [property.source_url]).filter((url): url is string => Boolean(url)))];

export function deduplicateProperties<T extends DeduplicableProperty>(properties: T[]): T[] {
  const candidatesByBase = new Map<string, T[]>();
  for (const property of properties) {
    const key = baseIdentity(property);
    const candidates = candidatesByBase.get(key) || [];
    candidates.push(property);
    candidatesByBase.set(key, candidates);
  }
  const merged: T[] = [];
  for (const candidates of candidatesByBase.values()) {
    candidates.sort((left, right) =>
      optionalIdentity(right).filter(Boolean).length - optionalIdentity(left).filter(Boolean).length);
    const variants: T[] = [];
    for (const property of candidates) {
      const optional = optionalIdentity(property);
      const exact = variants.find((candidate) => optionalIdentity(candidate).every((value, index) => value === optional[index]));
      const compatible = variants.filter((candidate) => optionalIdentity(candidate)
        .every((value, index) => !value || !optional[index] || value === optional[index]));
      const target = exact || (compatible.length === 1 ? compatible[0] : undefined);
      if (target) {
        const urls = [...new Set([...sourceUrls(target), ...sourceUrls(property)])];
        target.source_urls = urls;
        target.duplicate_listing_count = urls.length;
        if (!target.floor && property.floor) target.floor = property.floor;
        if (target.management_fee_yen == null && property.management_fee_yen != null) target.management_fee_yen = property.management_fee_yen;
        if (property.last_seen_at && (!target.last_seen_at || property.last_seen_at > target.last_seen_at)) target.last_seen_at = property.last_seen_at;
        continue;
      }
      const urls = sourceUrls(property);
      variants.push({ ...property, source_urls: urls, duplicate_listing_count: urls.length });
    }
    merged.push(...variants);
  }
  return merged;
}
