import { domainError } from "./errors";
import {
  validateOperationsIdentifier,
  validateOperationsInstant,
  validateOperationsProfileState,
  OperationsProfileValidationError,
} from "./operations-profile";
import {
  OPERATIONS_AGENT_ID,
  OPERATIONS_LISTING_LIFECYCLE_STATES,
  OPERATIONS_PROFILE,
  OPERATIONS_PUBLICATION_STATES,
  OPERATIONS_STALE_THRESHOLD_DAYS,
  OPERATIONS_TIMEZONE,
  type OperationsAvailabilitySlot,
  type OperationsListing,
  type OperationsListingLifecycleState,
  type OperationsProfileState,
  type OperationsPublicationState,
} from "./operations-profile-types";
import type { Actor } from "./types";

export const OPERATIONS_PROJECTION_MAX_ROWS = 25 as const;
export const OPERATIONS_PROJECTION_FRESHNESS = "CURRENT" as const;

export type OperationsUpcomingViewingStatus = "PROPOSED" | "CONFIRMED";

export type UpcomingViewingsQuery = {
  kind: "upcomingViewings";
  from: string;
  to: string;
  status?: OperationsUpcomingViewingStatus;
  area?: string;
  listingId?: string;
};

export type ListingPipelineQuery = {
  kind: "listingPipeline";
  area?: string;
  publicationState?: OperationsPublicationState;
  lifecycleState?: OperationsListingLifecycleState;
  minPublishedAgeDays?: number;
};

export type OperationsProjectionQuery = UpcomingViewingsQuery | ListingPipelineQuery;

type ProjectionEnvelope<TFilters, TItem> = {
  profile: typeof OPERATIONS_PROFILE;
  fixtureGeneration: number;
  timezone: typeof OPERATIONS_TIMEZONE;
  asOf: string;
  dataAsOf: string;
  freshness: typeof OPERATIONS_PROJECTION_FRESHNESS;
  filters: TFilters;
  totalCount: number;
  returnedCount: number;
  truncated: boolean;
  items: TItem[];
};

export type OperationsUpcomingViewing = {
  slotId: string;
  requestId: string;
  listingId: string;
  listingTitle: string;
  area: string;
  status: OperationsUpcomingViewingStatus;
  startsAt: string;
  endsAt: string;
};

export type OperationsListingPipelineRow = {
  id: string;
  revision: number;
  title: string;
  area: string;
  monthlyRentGbp: number;
  bedrooms: number;
  sizeSqM: number;
  availableFrom: string;
  publicationState: OperationsPublicationState;
  lifecycleState: OperationsListingLifecycleState;
  firstPublishedAt: string;
  publishedAgeDays: number;
  stale: boolean;
};

export type OperationsUpcomingViewingsProjection = ProjectionEnvelope<
  UpcomingViewingsQuery,
  OperationsUpcomingViewing
> & {
  counts: Record<OperationsUpcomingViewingStatus, number>;
};

export type OperationsListingPipelineProjection = ProjectionEnvelope<
  ListingPipelineQuery,
  OperationsListingPipelineRow
> & {
  counts: {
    publicationState: Record<OperationsPublicationState, number>;
    lifecycleState: Record<OperationsListingLifecycleState, number>;
  };
};

export type OperationsProfileProjection =
  | OperationsUpcomingViewingsProjection
  | OperationsListingPipelineProjection;

const EMPTY_UPCOMING_COUNTS: Record<OperationsUpcomingViewingStatus, number> = {
  PROPOSED: 0,
  CONFIRMED: 0,
};

export function projectOperationsProfile(
  state: OperationsProfileState,
  actor: Actor,
  query: OperationsProjectionQuery,
  asOf: string,
): OperationsProfileProjection {
  assertAgentActor(actor);
  assertProjectionQuery(query);
  assertValidAsOf(asOf);

  try {
    validateOperationsProfileState(state);
  } catch {
    throw new OperationsProfileValidationError();
  }

  // Complete empty authority is readable only by the existing fixture agent.
  const knownAgentEmptyProfile = actor.id === OPERATIONS_AGENT_ID
    && state.listings.length === 0
    && state.requests.length === 0
    && state.slots.length === 0;
  if (!knownAgentEmptyProfile && !state.listings.some((listing) => listing.assignedAgentId === actor.id)) {
    throw domainError("FORBIDDEN", "Actor cannot read the Operations profile");
  }

  if (query.kind === "upcomingViewings") {
    return projectUpcomingViewings(state, actor.id, query, asOf);
  }
  return projectListingPipeline(state, actor.id, query, asOf);
}

function projectUpcomingViewings(
  state: OperationsProfileState,
  agentId: string,
  query: UpcomingViewingsQuery,
  asOf: string,
): OperationsUpcomingViewingsProjection {
  const filters = normalizeUpcomingQuery(query);
  const fromTimestamp = londonLocalMidnight(filters.from);
  const toTimestamp = londonLocalMidnight(filters.to);
  if (fromTimestamp > toTimestamp) {
    throw domainError("VALIDATION_FAILED", "Upcoming viewing date range is inverted");
  }

  const listingsById = new Map(
    state.listings
      .filter((listing) => listing.assignedAgentId === agentId)
      .map((listing) => [listing.id, listing]),
  );
  const slotsById = new Map(state.slots.map((slot) => [slot.id, slot]));
  const matches: OperationsUpcomingViewing[] = [];

  for (const request of state.requests) {
    if (request.assignedAgentId !== agentId) {
      continue;
    }

    const listing = listingsById.get(request.listingId);
    const slot = request.selectedSlotId ? slotsById.get(request.selectedSlotId) : undefined;
    const status = statusForRequest(request.status);
    if (!listing || !slot || !status) {
      continue;
    }

    assertValidSelectedViewingRelationship(request, listing, slot);
    const startsAt = Date.parse(slot.startsAt);
    if (
      startsAt < Date.parse(asOf)
      || startsAt < fromTimestamp
      || startsAt >= toTimestamp
      || (filters.status !== undefined && filters.status !== status)
      || (filters.area !== undefined && filters.area !== listing.area)
      || (filters.listingId !== undefined && filters.listingId !== listing.id)
    ) {
      continue;
    }

    matches.push({
      slotId: slot.id,
      requestId: request.id,
      listingId: listing.id,
      listingTitle: listing.title,
      area: listing.area,
      status,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
    });
  }

  matches.sort(compareUpcomingViewings);
  const counts = { ...EMPTY_UPCOMING_COUNTS };
  for (const item of matches) {
    counts[item.status] += 1;
  }
  const items = matches.slice(0, OPERATIONS_PROJECTION_MAX_ROWS);

  return {
    ...envelope(state, asOf, filters, matches.length, items),
    counts,
  };
}

function projectListingPipeline(
  state: OperationsProfileState,
  agentId: string,
  query: ListingPipelineQuery,
  asOf: string,
): OperationsListingPipelineProjection {
  const filters = normalizeListingQuery(query);
  const asOfTimestamp = Date.parse(asOf);
  const matches = state.listings
    .filter((listing) => listing.assignedAgentId === agentId)
    .map((listing) => toListingPipelineRow(listing, asOfTimestamp))
    .filter((listing) => matchesListingQuery(listing, filters))
    .sort((left, right) => compareStrings(left.id, right.id));

  const publicationState = emptyPublicationCounts();
  const lifecycleState = emptyLifecycleCounts();
  for (const listing of matches) {
    publicationState[listing.publicationState] += 1;
    lifecycleState[listing.lifecycleState] += 1;
  }
  const items = matches.slice(0, OPERATIONS_PROJECTION_MAX_ROWS);

  return {
    ...envelope(state, asOf, filters, matches.length, items),
    counts: { publicationState, lifecycleState },
  };
}

function envelope<TFilters, TItem>(
  state: OperationsProfileState,
  asOf: string,
  filters: TFilters,
  totalCount: number,
  items: TItem[],
): ProjectionEnvelope<TFilters, TItem> {
  return {
    profile: state.metadata.profile,
    fixtureGeneration: state.metadata.fixtureGeneration,
    timezone: state.metadata.timezone,
    asOf,
    dataAsOf: state.metadata.dataAsOf,
    freshness: OPERATIONS_PROJECTION_FRESHNESS,
    filters,
    totalCount,
    returnedCount: items.length,
    truncated: totalCount > items.length,
    items,
  };
}

function normalizeUpcomingQuery(query: UpcomingViewingsQuery): UpcomingViewingsQuery {
  validateDateOnly(query.from, "Upcoming viewing from date");
  validateDateOnly(query.to, "Upcoming viewing to date");
  if (query.status !== undefined && query.status !== "PROPOSED" && query.status !== "CONFIRMED") {
    throw domainError("VALIDATION_FAILED", "Upcoming viewing status is unsupported");
  }
  const area = query.area === undefined ? undefined : normalizeArea(query.area);
  const listingId = query.listingId === undefined
    ? undefined
    : normalizeIdentifier(query.listingId, "Upcoming viewing listing");
  return {
    kind: "upcomingViewings",
    from: query.from,
    to: query.to,
    ...(query.status === undefined ? {} : { status: query.status }),
    ...(area === undefined ? {} : { area }),
    ...(listingId === undefined ? {} : { listingId }),
  };
}

function normalizeListingQuery(query: ListingPipelineQuery): ListingPipelineQuery {
  const area = query.area === undefined ? undefined : normalizeArea(query.area);
  const publicationState = query.publicationState;
  const lifecycleState = query.lifecycleState;
  if (
    publicationState !== undefined
    && !OPERATIONS_PUBLICATION_STATES.includes(publicationState)
  ) {
    throw domainError("VALIDATION_FAILED", "Listing publication state is unsupported");
  }
  if (
    lifecycleState !== undefined
    && !OPERATIONS_LISTING_LIFECYCLE_STATES.includes(lifecycleState)
  ) {
    throw domainError("VALIDATION_FAILED", "Listing lifecycle state is unsupported");
  }
  if (
    query.minPublishedAgeDays !== undefined
    && (!Number.isInteger(query.minPublishedAgeDays) || query.minPublishedAgeDays < 0)
  ) {
    throw domainError("VALIDATION_FAILED", "Minimum published age must be a non-negative integer");
  }
  return {
    kind: "listingPipeline",
    ...(area === undefined ? {} : { area }),
    ...(publicationState === undefined ? {} : { publicationState }),
    ...(lifecycleState === undefined ? {} : { lifecycleState }),
    ...(query.minPublishedAgeDays === undefined
      ? {}
      : { minPublishedAgeDays: query.minPublishedAgeDays }),
  };
}

function toListingPipelineRow(
  listing: OperationsListing,
  asOfTimestamp: number,
): OperationsListingPipelineRow {
  const publishedLondon = londonCalendarDate(Date.parse(listing.firstPublishedAt));
  const asOfLondon = londonCalendarDate(asOfTimestamp);
  const calendarDays = calendarDayNumber(asOfLondon) - calendarDayNumber(publishedLondon);
  const anniversary = new Date(publishedLondon);
  anniversary.setUTCDate(anniversary.getUTCDate() + calendarDays);
  const publishedAgeDays = Math.max(
    0,
    calendarDays - Number(asOfLondon.getTime() < anniversary.getTime()),
  );
  const staleBoundary = new Date(publishedLondon);
  staleBoundary.setUTCDate(staleBoundary.getUTCDate() + OPERATIONS_STALE_THRESHOLD_DAYS);
  return {
    id: listing.id,
    revision: listing.revision,
    title: listing.title,
    area: listing.area,
    monthlyRentGbp: listing.monthlyRentGbp,
    bedrooms: listing.bedrooms,
    sizeSqM: listing.sizeSqM,
    availableFrom: listing.availableFrom,
    publicationState: listing.publicationState,
    lifecycleState: listing.lifecycleState,
    firstPublishedAt: listing.firstPublishedAt,
    publishedAgeDays,
    stale: asOfLondon.getTime() > staleBoundary.getTime(),
  };
}

function matchesListingQuery(
  listing: OperationsListingPipelineRow,
  query: ListingPipelineQuery,
): boolean {
  return (query.area === undefined || query.area === listing.area)
    && (query.publicationState === undefined || query.publicationState === listing.publicationState)
    && (query.lifecycleState === undefined || query.lifecycleState === listing.lifecycleState)
    && (query.minPublishedAgeDays === undefined
      || listing.publishedAgeDays >= query.minPublishedAgeDays);
}

function assertAgentActor(actor: Actor): void {
  if (!actor || actor.role !== "agent" || typeof actor.id !== "string" || actor.id.length === 0) {
    throw domainError("FORBIDDEN", "Actor cannot read the Operations profile");
  }
}

function assertValidAsOf(asOf: string): void {
  try {
    validateOperationsInstant(asOf, "Operations projection asOf");
  } catch {
    throw domainError("VALIDATION_FAILED", "Operations projection asOf must be an ISO timestamp");
  }
}

function assertProjectionQuery(value: unknown): asserts value is OperationsProjectionQuery {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw domainError("VALIDATION_FAILED", "Operations projection query must be structured");
  }
  const query = value as Record<string, unknown>;
  if (query.kind === "upcomingViewings") {
    assertAllowedQueryKeys(query, ["kind", "from", "to", "status", "area", "listingId"]);
    return;
  }
  if (query.kind === "listingPipeline") {
    assertAllowedQueryKeys(query, [
      "kind",
      "area",
      "publicationState",
      "lifecycleState",
      "minPublishedAgeDays",
    ]);
    return;
  }
  throw domainError("VALIDATION_FAILED", "Operations projection query kind is unsupported");
}

function assertAllowedQueryKeys(
  query: Record<string, unknown>,
  allowedKeys: readonly string[],
): void {
  const allowed = new Set(allowedKeys);
  if (Object.keys(query).some((key) => !allowed.has(key))) {
    throw domainError("VALIDATION_FAILED", "Operations projection query contains unsupported fields");
  }
}

function validateDateOnly(value: string, label: string): void {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw domainError("VALIDATION_FAILED", `${label} must be an ISO calendar date`);
  }
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== value) {
    throw domainError("VALIDATION_FAILED", `${label} must be an ISO calendar date`);
  }
}

function normalizeArea(value: string): string {
  if (
    typeof value !== "string"
    || value.length < 1
    || value.length > 80
    || value.trim() !== value
    || value.trim().length === 0
  ) {
    throw domainError("VALIDATION_FAILED", "Listing area filter is outside its bounds");
  }
  return value;
}

function normalizeIdentifier(value: string, label: string): string {
  try {
    validateOperationsIdentifier(value, label);
  } catch {
    throw domainError("VALIDATION_FAILED", `${label} filter is outside its bounds`);
  }
  return value;
}

function statusForRequest(status: string): OperationsUpcomingViewingStatus | undefined {
  if (status === "SLOT_PROPOSED") return "PROPOSED";
  if (status === "VIEWING_CONFIRMED") return "CONFIRMED";
  return undefined;
}

function assertValidSelectedViewingRelationship(
  request: OperationsProfileState["requests"][number],
  listing: OperationsListing,
  slot: OperationsAvailabilitySlot,
): void {
  const expectedSlotStatus = request.status === "SLOT_PROPOSED"
    ? "HELD_FOR_PROPOSAL"
    : "CONFIRMED";
  if (
    request.listingId !== listing.id
    || slot.listingId !== listing.id
    || slot.selectedRequestId !== request.id
    || slot.status !== expectedSlotStatus
  ) {
    throw new OperationsProfileValidationError();
  }
}

function compareUpcomingViewings(
  left: OperationsUpcomingViewing,
  right: OperationsUpcomingViewing,
): number {
  return Date.parse(left.startsAt) - Date.parse(right.startsAt)
    || compareStrings(left.slotId, right.slotId)
    || compareStrings(left.requestId, right.requestId);
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function londonLocalMidnight(date: string): number {
  validateDateOnly(date, "London date boundary");
  const [year, month, day] = date.split("-").map(Number);
  let candidate = Date.UTC(year, month - 1, day);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const offsetMinutes = londonOffsetMinutes(candidate);
    const adjusted = Date.UTC(year, month - 1, day) - offsetMinutes * 60_000;
    if (adjusted === candidate) {
      return candidate;
    }
    candidate = adjusted;
  }
  throw domainError("VALIDATION_FAILED", "Could not resolve the London date boundary");
}

function londonOffsetMinutes(timestamp: number): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: OPERATIONS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(timestamp));
  const values = new Map(parts.map((part) => [part.type, part.value]));
  const localAsUtc = Date.UTC(
    Number(values.get("year")),
    Number(values.get("month")) - 1,
    Number(values.get("day")),
    Number(values.get("hour")),
    Number(values.get("minute")),
    Number(values.get("second")),
  );
  return Math.round((localAsUtc - timestamp) / 60_000);
}

function londonCalendarDate(timestamp: number): Date {
  // UTC fields encode London wall time for calendar arithmetic, retaining milliseconds.
  return new Date(timestamp + londonOffsetMinutes(timestamp) * 60_000);
}

function calendarDayNumber(date: Date): number {
  const midnight = new Date(date);
  midnight.setUTCHours(0, 0, 0, 0);
  // This counts encoded calendar dates, never elapsed 24-hour periods between instants.
  return midnight.getTime() / MILLISECONDS_PER_CALENDAR_DAY;
}

function emptyPublicationCounts(): Record<OperationsPublicationState, number> {
  return { PUBLISHED: 0, UNPUBLISHED: 0 };
}

function emptyLifecycleCounts(): Record<OperationsListingLifecycleState, number> {
  return { OPEN: 0, UNAVAILABLE: 0, LET_AGREED: 0, ARCHIVED: 0 };
}

const MILLISECONDS_PER_CALENDAR_DAY = 24 * 60 * 60 * 1_000;
