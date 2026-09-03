import type { WorkflowListingDto } from "./workflow-api";

const AREA_LOCALE = "en-GB";

export type TenantListingFilters = {
  area?: string;
  maxRent?: number;
  minSizeSqM?: number;
  availableBy?: string;
};

/**
 * Compatibility-only transport input. The logical Search contract uses
 * `availableBy`; the legacy HTTP query may still arrive as `availableFrom`.
 */
export type TenantListingHttpFilters = TenantListingFilters & {
  availableFrom?: string;
};

export type TenantListingAppliedFilters = {
  area?: string;
  maxRent?: number;
  minSizeSqM?: number;
  availableBy?: string;
};

export type TenantListingPageState = "results" | "empty";

export type TenantListingsResponse = {
  fixtureGeneration: number;
  appliedFilters: TenantListingAppliedFilters;
  matchedCount: number;
  listings: WorkflowListingDto[];
  pagePath: "/tenant";
  pageState: TenantListingPageState;
};

export function collectCanonicalAreas(listings: readonly { area: string }[]): string[] {
  const seen = new Set<string>();
  const canonicalAreas: string[] = [];
  for (const listing of listings) {
    const area = listing.area.trim();
    const canonicalKey = area.toLocaleLowerCase(AREA_LOCALE);
    if (canonicalKey.length === 0 || seen.has(canonicalKey)) continue;
    seen.add(canonicalKey);
    canonicalAreas.push(area);
  }
  return canonicalAreas;
}

export function suggestCanonicalAreas(listings: readonly { area: string }[], query: string): string[] {
  const normalizedQuery = normalizeSearchText(query).toLocaleLowerCase(AREA_LOCALE);
  const canonicalAreas = collectCanonicalAreas(listings);
  if (normalizedQuery.length === 0) return canonicalAreas;
  return canonicalAreas.filter((area) =>
    area.toLocaleLowerCase(AREA_LOCALE).startsWith(normalizedQuery));
}

export function resolveCanonicalArea(listings: readonly { area: string }[], rawValue: string): string | null {
  const normalized = normalizeSearchText(rawValue);
  if (normalized.length === 0) return null;
  const target = normalized.toLocaleLowerCase(AREA_LOCALE);
  for (const area of collectCanonicalAreas(listings)) {
    if (area.toLocaleLowerCase(AREA_LOCALE) === target) {
      return area;
    }
  }
  return null;
}

export function normalizeSearchText(value: string): string {
  return value.trim();
}
