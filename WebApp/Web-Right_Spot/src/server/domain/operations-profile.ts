import {
  OPERATIONS_AGENT_ID,
  OPERATIONS_DATA_AS_OF,
  OPERATIONS_INITIAL_GENERATION,
  OPERATIONS_LISTING_LIFECYCLE_STATES,
  OPERATIONS_OTHER_AGENT_ID,
  OPERATIONS_PROFILE,
  OPERATIONS_PUBLICATION_STATES,
  OPERATIONS_REQUEST_STATUSES,
  OPERATIONS_SCHEMA_VERSION,
  OPERATIONS_SEED_VERSION,
  OPERATIONS_SLOT_STATUSES,
  OPERATIONS_SOURCE_REVISION,
  OPERATIONS_TIMEZONE,
  type OperationsAvailabilitySlot,
  type OperationsListing,
  type OperationsListingLifecycleState,
  type OperationsProfileState,
  type OperationsPublicationState,
  type OperationsRequestStatus,
  type OperationsViewingRequest,
} from "./operations-profile-types";

const IDENTIFIER_PATTERN = /^[A-Za-z0-9._:-]+$/;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_INSTANT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(\.\d{1,3})?(Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;

const MAX_IDENTIFIER_LENGTH = 100;
const MAX_TEXT_LENGTH = 200;
const MAX_AREA_LENGTH = 80;
const MAX_RENT_GBP = 100_000;
const MAX_BEDROOMS = 20;
const MAX_SIZE_SQ_M = 10_000;

const LISTING_KEYS = [
  "id",
  "revision",
  "title",
  "area",
  "monthlyRentGbp",
  "bedrooms",
  "sizeSqM",
  "availableFrom",
  "publicationState",
  "lifecycleState",
  "assignedAgentId",
  "firstPublishedAt",
];
const REQUEST_KEYS = [
  "id",
  "listingId",
  "listingRevision",
  "assignedAgentId",
  "status",
  "selectedSlotId",
  "createdAt",
  "updatedAt",
];
const SLOT_KEYS = [
  "id",
  "listingId",
  "startsAt",
  "endsAt",
  "status",
  "selectedRequestId",
];
const METADATA_KEYS = [
  "profile",
  "schemaVersion",
  "fixtureGeneration",
  "seedVersion",
  "dataAsOf",
  "sourceRevision",
  "timezone",
];
const PROFILE_KEYS = ["metadata", "listings", "requests", "slots"];

const LEGAL_LIFECYCLES_BY_PUBLICATION: Record<
  OperationsPublicationState,
  ReadonlySet<OperationsListingLifecycleState>
> = {
  PUBLISHED: new Set(["OPEN", "UNAVAILABLE", "LET_AGREED"]),
  UNPUBLISHED: new Set(["UNAVAILABLE", "LET_AGREED", "ARCHIVED"]),
};

const SLOT_STATUS_FOR_REQUEST: Partial<Record<OperationsRequestStatus, OperationsAvailabilitySlot["status"]>> = {
  SLOT_PROPOSED: "HELD_FOR_PROPOSAL",
  VIEWING_CONFIRMED: "CONFIRMED",
};

export class OperationsProfileValidationError extends Error {
  readonly code = "OPERATIONS_VALIDATION_FAILED" as const;

  constructor(message = "Operations profile state is invalid") {
    super(message);
    this.name = "OperationsProfileValidationError";
  }

  toJSON(): { code: "OPERATIONS_VALIDATION_FAILED"; message: string } {
    return { code: this.code, message: this.message };
  }
}

export function createInitialOperationsProfile(
  fixtureGeneration: number = OPERATIONS_INITIAL_GENERATION,
): OperationsProfileState {
  const state: OperationsProfileState = {
    metadata: {
      profile: OPERATIONS_PROFILE,
      schemaVersion: OPERATIONS_SCHEMA_VERSION,
      fixtureGeneration,
      seedVersion: OPERATIONS_SEED_VERSION,
      dataAsOf: OPERATIONS_DATA_AS_OF,
      sourceRevision: OPERATIONS_SOURCE_REVISION,
      timezone: OPERATIONS_TIMEZONE,
    },
    listings: createFixtureListings(),
    requests: createFixtureRequests(),
    slots: createFixtureSlots(),
  };

  validateOperationsProfileState(state);
  return clone(state);
}

export function createDeterministicOperationsProfile(
  fixtureGeneration: number = OPERATIONS_INITIAL_GENERATION,
): OperationsProfileState {
  return createInitialOperationsProfile(fixtureGeneration);
}

export function validateOperationsProfileState(
  value: unknown,
): asserts value is OperationsProfileState {
  const profile = requireRecord(value, "Operations profile");
  assertAllowedKeys(profile, PROFILE_KEYS, "Operations profile");

  const metadata = validateMetadata(profile.metadata);
  const listings = requireArray(profile.listings, "Operations listings");
  const requests = requireArray(profile.requests, "Operations requests");
  const slots = requireArray(profile.slots, "Operations slots");

  const listingIds = new Set<string>();
  const requestIds = new Set<string>();
  const slotIds = new Set<string>();
  const allIds = new Set<string>();
  const listingsById = new Map<string, OperationsListing>();
  const requestsById = new Map<string, OperationsViewingRequest>();
  const slotsById = new Map<string, OperationsAvailabilitySlot>();

  for (const [index, value] of listings.entries()) {
    const listing = validateListing(value, index, metadata.dataAsOf);
    assertUniqueId(listing.id, listingIds, allIds, `listing ${index}`);
    listingsById.set(listing.id, listing);
  }

  for (const [index, value] of requests.entries()) {
    const request = validateRequest(value, index, metadata.dataAsOf);
    assertUniqueId(request.id, requestIds, allIds, `request ${index}`);
    requestsById.set(request.id, request);
  }

  for (const [index, value] of slots.entries()) {
    const slot = validateSlot(value, index);
    assertUniqueId(slot.id, slotIds, allIds, `slot ${index}`);
    slotsById.set(slot.id, slot);
  }

  for (const [index, value] of listings.entries()) {
    const listing = listingsById.get((value as Record<string, unknown>).id as string);
    if (!listing) {
      fail(`Listing ${index} could not be indexed`);
    }
  }

  for (const [index, value] of requests.entries()) {
    const request = requestsById.get((value as Record<string, unknown>).id as string);
    if (!request) {
      fail(`Request ${index} could not be indexed`);
    }
    const listing = listingsById.get(request.listingId);
    if (!listing) {
      fail(`Request ${request.id} references an unknown listing`);
    }
    if (request.assignedAgentId !== listing.assignedAgentId) {
      fail(`Request ${request.id} agent assignment does not match its listing`);
    }
    if (request.listingRevision !== listing.revision) {
      fail(`Request ${request.id} listing revision is stale`);
    }

    const expectedSlotStatus = SLOT_STATUS_FOR_REQUEST[request.status];
    if (expectedSlotStatus) {
      if (!request.selectedSlotId) {
        fail(`Request ${request.id} requires a selected slot`);
      }
      const slot = slotsById.get(request.selectedSlotId);
      if (!slot) {
        fail(`Request ${request.id} references an unknown selected slot`);
      }
      if (slot.listingId !== request.listingId) {
        fail(`Request ${request.id} selected slot belongs to another listing`);
      }
      if (slot.status !== expectedSlotStatus || slot.selectedRequestId !== request.id) {
        fail(`Request ${request.id} selected slot relationship is invalid`);
      }
    } else if (request.selectedSlotId !== undefined) {
      fail(`Request ${request.id} has a selected slot for an unsupported status`);
    }
  }

  for (const [index, value] of slots.entries()) {
    const slot = slotsById.get((value as Record<string, unknown>).id as string);
    if (!slot) {
      fail(`Slot ${index} could not be indexed`);
    }
    if (!listingsById.has(slot.listingId)) {
      fail(`Slot ${slot.id} references an unknown listing`);
    }
    if (slot.selectedRequestId === undefined) {
      continue;
    }

    const request = requestsById.get(slot.selectedRequestId);
    if (!request) {
      fail(`Slot ${slot.id} references an unknown selected request`);
    }
    const expectedSlotStatus = SLOT_STATUS_FOR_REQUEST[request.status];
    if (
      request.listingId !== slot.listingId
      || request.selectedSlotId !== slot.id
      || expectedSlotStatus !== slot.status
    ) {
      fail(`Slot ${slot.id} selected request relationship is invalid`);
    }
  }
}

export const validateOperationsState = validateOperationsProfileState;

export function validateOperationsIdentifier(
  value: unknown,
  label = "Identifier",
): asserts value is string {
  if (
    typeof value !== "string"
    || value.length < 1
    || value.length > MAX_IDENTIFIER_LENGTH
    || value.trim() !== value
    || !IDENTIFIER_PATTERN.test(value)
  ) {
    fail(`${label} is outside its bounds`);
  }
}

export function validateOperationsInstant(
  value: unknown,
  label = "Timestamp",
): asserts value is string {
  const match = typeof value === "string" ? ISO_INSTANT_PATTERN.exec(value) : null;
  if (
    typeof value !== "string"
    || !match
    || !Number.isFinite(Date.parse(value))
    || !isValidIsoDate(`${match[1]}-${match[2]}-${match[3]}`)
  ) {
    fail(`${label} must be an ISO instant`);
  }
}

function validateMetadata(value: unknown): OperationsProfileState["metadata"] {
  const metadata = requireRecord(value, "Operations metadata");
  assertAllowedKeys(metadata, METADATA_KEYS, "Operations metadata");
  if (metadata.profile !== OPERATIONS_PROFILE) {
    fail("Operations profile metadata has an incompatible profile");
  }
  assertPositiveInteger(metadata.schemaVersion, "Operations schema version");
  if (metadata.schemaVersion !== OPERATIONS_SCHEMA_VERSION) {
    fail("Operations schema version is incompatible");
  }
  assertPositiveInteger(metadata.fixtureGeneration, "Operations fixture generation");
  if (metadata.seedVersion !== OPERATIONS_SEED_VERSION) {
    fail("Operations seed version is incompatible");
  }
  if (metadata.sourceRevision !== OPERATIONS_SOURCE_REVISION) {
    fail("Operations source revision is incompatible");
  }
  if (metadata.timezone !== OPERATIONS_TIMEZONE) {
    fail("Operations timezone is incompatible");
  }
  validateOperationsInstant(metadata.dataAsOf, "Operations dataAsOf");
  if (metadata.dataAsOf !== OPERATIONS_DATA_AS_OF) {
    fail("Operations dataAsOf is incompatible");
  }
  return metadata as OperationsProfileState["metadata"];
}

function validateListing(
  value: unknown,
  index: number,
  dataAsOf: string,
): OperationsListing {
  const listing = requireRecord(value, `Listing ${index}`);
  assertAllowedKeys(listing, LISTING_KEYS, `Listing ${index}`);
  validateOperationsIdentifier(listing.id, `Listing ${index} identifier`);
  assertPositiveInteger(listing.revision, `Listing ${listing.id} revision`);
  validateRequiredText(listing.title, MAX_TEXT_LENGTH, `Listing ${listing.id} title`);
  validateRequiredText(listing.area, MAX_AREA_LENGTH, `Listing ${listing.id} area`);
  assertBoundedInteger(listing.monthlyRentGbp, 1, MAX_RENT_GBP, `Listing ${listing.id} rent`);
  assertBoundedInteger(listing.bedrooms, 0, MAX_BEDROOMS, `Listing ${listing.id} bedrooms`);
  assertBoundedInteger(listing.sizeSqM, 1, MAX_SIZE_SQ_M, `Listing ${listing.id} size`);
  validateIsoDate(listing.availableFrom, `Listing ${listing.id} availableFrom`);
  validateOperationsIdentifier(listing.assignedAgentId, `Listing ${listing.id} agent assignment`);
  validateOperationsInstant(listing.firstPublishedAt, `Listing ${listing.id} firstPublishedAt`);
  if (Date.parse(listing.firstPublishedAt) > Date.parse(dataAsOf)) {
    fail(`Listing ${listing.id} firstPublishedAt is after dataAsOf`);
  }
  if (!isOneOf(listing.publicationState, OPERATIONS_PUBLICATION_STATES)) {
    fail(`Listing ${listing.id} publication state is unsupported`);
  }
  if (!isOneOf(listing.lifecycleState, OPERATIONS_LISTING_LIFECYCLE_STATES)) {
    fail(`Listing ${listing.id} lifecycle state is unsupported`);
  }
  const legalLifecycles = LEGAL_LIFECYCLES_BY_PUBLICATION[listing.publicationState];
  if (!legalLifecycles.has(listing.lifecycleState)) {
    fail(`Listing ${listing.id} publication/lifecycle combination is invalid`);
  }
  return listing as OperationsListing;
}

function validateRequest(
  value: unknown,
  index: number,
  dataAsOf: string,
): OperationsViewingRequest {
  const request = requireRecord(value, `Request ${index}`);
  assertAllowedKeys(request, REQUEST_KEYS, `Request ${index}`);
  validateOperationsIdentifier(request.id, `Request ${index} identifier`);
  validateOperationsIdentifier(request.listingId, `Request ${request.id} listing`);
  assertPositiveInteger(request.listingRevision, `Request ${request.id} listing revision`);
  validateOperationsIdentifier(request.assignedAgentId, `Request ${request.id} agent assignment`);
  if (!isOneOf(request.status, OPERATIONS_REQUEST_STATUSES)) {
    fail(`Request ${request.id} status is unsupported`);
  }
  if (request.selectedSlotId !== undefined) {
    validateOperationsIdentifier(request.selectedSlotId, `Request ${request.id} selected slot`);
  }
  validateOperationsInstant(request.createdAt, `Request ${request.id} createdAt`);
  validateOperationsInstant(request.updatedAt, `Request ${request.id} updatedAt`);
  if (Date.parse(request.createdAt) > Date.parse(request.updatedAt)) {
    fail(`Request ${request.id} timestamps are out of order`);
  }
  if (Date.parse(request.updatedAt) > Date.parse(dataAsOf)) {
    fail(`Request ${request.id} updatedAt is after dataAsOf`);
  }
  return request as OperationsViewingRequest;
}

function validateSlot(value: unknown, index: number): OperationsAvailabilitySlot {
  const slot = requireRecord(value, `Slot ${index}`);
  assertAllowedKeys(slot, SLOT_KEYS, `Slot ${index}`);
  validateOperationsIdentifier(slot.id, `Slot ${index} identifier`);
  validateOperationsIdentifier(slot.listingId, `Slot ${slot.id} listing`);
  validateOperationsInstant(slot.startsAt, `Slot ${slot.id} startsAt`);
  validateOperationsInstant(slot.endsAt, `Slot ${slot.id} endsAt`);
  if (Date.parse(slot.startsAt) >= Date.parse(slot.endsAt)) {
    fail(`Slot ${slot.id} time range is invalid`);
  }
  if (!isOneOf(slot.status, OPERATIONS_SLOT_STATUSES)) {
    fail(`Slot ${slot.id} status is unsupported`);
  }
  if (slot.selectedRequestId !== undefined) {
    validateOperationsIdentifier(slot.selectedRequestId, `Slot ${slot.id} selected request`);
    if (slot.status === "AVAILABLE") {
      fail(`Available slot ${slot.id} cannot have a selected request`);
    }
  } else if (slot.status !== "AVAILABLE") {
    fail(`Slot ${slot.id} requires a selected request for its status`);
  }
  return slot as OperationsAvailabilitySlot;
}

function assertUniqueId(
  value: string,
  collection: Set<string>,
  allIds: Set<string>,
  label: string,
): void {
  if (collection.has(value) || allIds.has(value)) {
    fail(`${label} identifier is not unique`);
  }
  collection.add(value);
  allIds.add(value);
}

function assertAllowedKeys(
  value: Record<string, unknown>,
  allowedKeys: readonly string[],
  label: string,
): void {
  const allowed = new Set(allowedKeys);
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    fail(`${label} contains unsupported fields`);
  }
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    fail(`${label} must be an array`);
  }
  return value;
}

function validateRequiredText(value: unknown, max: number, label: string): void {
  if (
    typeof value !== "string"
    || value.length < 1
    || value.length > max
    || value.trim().length === 0
    || value.trim() !== value
  ) {
    fail(`${label} is outside its bounds`);
  }
}

function assertPositiveInteger(value: unknown, label: string): void {
  if (!Number.isInteger(value) || (value as number) < 1) {
    fail(`${label} must be a positive integer`);
  }
}

function assertBoundedInteger(value: unknown, min: number, max: number, label: string): void {
  if (!Number.isInteger(value) || (value as number) < min || (value as number) > max) {
    fail(`${label} is outside its bounds`);
  }
}

function validateIsoDate(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string") {
    fail(`${label} is invalid`);
  }
  if (!isValidIsoDate(value)) {
    fail(`${label} is invalid`);
  }
}

function isValidIsoDate(value: string): boolean {
  const match = ISO_DATE_PATTERN.exec(value);
  const parsed = Date.parse(`${value}T00:00:00.000Z`);
  return Boolean(
    match
    && Number.isFinite(parsed)
    && new Date(parsed).toISOString().slice(0, 10) === value,
  );
}

function isOneOf<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === "string" && values.includes(value as T);
}

function fail(message: string): never {
  throw new OperationsProfileValidationError(message);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createFixtureListings(): OperationsListing[] {
  return [
    {
      id: "ops-listing-fresh-open",
      revision: 1,
      title: "Canal Wharf Two Bedroom",
      area: "Islington",
      monthlyRentGbp: 2450,
      bedrooms: 2,
      sizeSqM: 74,
      availableFrom: "2026-09-15",
      publicationState: "PUBLISHED",
      lifecycleState: "OPEN",
      assignedAgentId: OPERATIONS_AGENT_ID,
      firstPublishedAt: "2026-08-15T09:00:00.000Z",
    },
    {
      id: "ops-listing-stale-open",
      revision: 1,
      title: "Northfield Garden Flat",
      area: "Haringey",
      monthlyRentGbp: 1950,
      bedrooms: 2,
      sizeSqM: 65,
      availableFrom: "2026-10-01",
      publicationState: "PUBLISHED",
      lifecycleState: "OPEN",
      assignedAgentId: OPERATIONS_AGENT_ID,
      firstPublishedAt: "2026-04-15T09:00:00.000Z",
    },
    {
      id: "ops-listing-unavailable",
      revision: 1,
      title: "Riverside Studio",
      area: "Southwark",
      monthlyRentGbp: 1650,
      bedrooms: 1,
      sizeSqM: 42,
      availableFrom: "2026-09-20",
      publicationState: "PUBLISHED",
      lifecycleState: "UNAVAILABLE",
      assignedAgentId: OPERATIONS_AGENT_ID,
      firstPublishedAt: "2026-08-20T09:00:00.000Z",
    },
    {
      id: "ops-listing-let-agreed",
      revision: 1,
      title: "Borough Corner Flat",
      area: "Southwark",
      monthlyRentGbp: 2200,
      bedrooms: 2,
      sizeSqM: 68,
      availableFrom: "2026-08-01",
      publicationState: "PUBLISHED",
      lifecycleState: "LET_AGREED",
      assignedAgentId: OPERATIONS_AGENT_ID,
      firstPublishedAt: "2026-06-01T09:00:00.000Z",
    },
    {
      id: "ops-listing-archived",
      revision: 1,
      title: "Archived Market Mews",
      area: "Hackney",
      monthlyRentGbp: 1800,
      bedrooms: 1,
      sizeSqM: 48,
      availableFrom: "2026-07-01",
      publicationState: "UNPUBLISHED",
      lifecycleState: "ARCHIVED",
      assignedAgentId: OPERATIONS_AGENT_ID,
      firstPublishedAt: "2026-02-01T09:00:00.000Z",
    },
    {
      id: "ops-listing-other-agent",
      revision: 1,
      title: "Other Desk Example House",
      area: "Lambeth",
      monthlyRentGbp: 2050,
      bedrooms: 2,
      sizeSqM: 61,
      availableFrom: "2026-09-25",
      publicationState: "PUBLISHED",
      lifecycleState: "OPEN",
      assignedAgentId: OPERATIONS_OTHER_AGENT_ID,
      firstPublishedAt: "2026-08-25T09:00:00.000Z",
    },
  ];
}

function createFixtureRequests(): OperationsViewingRequest[] {
  return [
    {
      id: "ops-request-confirmed",
      listingId: "ops-listing-fresh-open",
      listingRevision: 1,
      assignedAgentId: OPERATIONS_AGENT_ID,
      status: "VIEWING_CONFIRMED",
      selectedSlotId: "ops-slot-confirmed-upcoming",
      createdAt: "2026-08-27T10:00:00.000Z",
      updatedAt: "2026-08-28T10:00:00.000Z",
    },
    {
      id: "ops-request-proposed",
      listingId: "ops-listing-stale-open",
      listingRevision: 1,
      assignedAgentId: OPERATIONS_AGENT_ID,
      status: "SLOT_PROPOSED",
      selectedSlotId: "ops-slot-proposed-upcoming",
      createdAt: "2026-08-28T11:00:00.000Z",
      updatedAt: "2026-08-29T11:00:00.000Z",
    },
    {
      id: "ops-request-review",
      listingId: "ops-listing-unavailable",
      listingRevision: 1,
      assignedAgentId: OPERATIONS_AGENT_ID,
      status: "AGENT_REVIEWING",
      createdAt: "2026-08-30T12:00:00.000Z",
      updatedAt: "2026-08-30T12:30:00.000Z",
    },
    {
      id: "ops-request-terminal",
      listingId: "ops-listing-let-agreed",
      listingRevision: 1,
      assignedAgentId: OPERATIONS_AGENT_ID,
      status: "AGENT_DECLINED",
      createdAt: "2026-08-26T13:00:00.000Z",
      updatedAt: "2026-08-27T13:00:00.000Z",
    },
  ];
}

function createFixtureSlots(): OperationsAvailabilitySlot[] {
  return [
    {
      id: "ops-slot-confirmed-upcoming",
      listingId: "ops-listing-fresh-open",
      startsAt: "2026-09-03T10:00:00.000Z",
      endsAt: "2026-09-03T10:30:00.000Z",
      status: "CONFIRMED",
      selectedRequestId: "ops-request-confirmed",
    },
    {
      id: "ops-slot-proposed-upcoming",
      listingId: "ops-listing-stale-open",
      startsAt: "2026-09-04T14:00:00.000Z",
      endsAt: "2026-09-04T14:30:00.000Z",
      status: "HELD_FOR_PROPOSAL",
      selectedRequestId: "ops-request-proposed",
    },
    {
      id: "ops-slot-available-upcoming",
      listingId: "ops-listing-fresh-open",
      startsAt: "2026-09-05T16:00:00.000Z",
      endsAt: "2026-09-05T16:30:00.000Z",
      status: "AVAILABLE",
    },
    {
      id: "ops-slot-available-secondary",
      listingId: "ops-listing-unavailable",
      startsAt: "2026-09-02T11:00:00.000Z",
      endsAt: "2026-09-02T11:30:00.000Z",
      status: "AVAILABLE",
    },
    {
      id: "ops-slot-past",
      listingId: "ops-listing-let-agreed",
      startsAt: "2026-08-31T10:00:00.000Z",
      endsAt: "2026-08-31T10:30:00.000Z",
      status: "AVAILABLE",
    },
    {
      id: "ops-slot-other-agent",
      listingId: "ops-listing-other-agent",
      startsAt: "2026-09-06T12:00:00.000Z",
      endsAt: "2026-09-06T12:30:00.000Z",
      status: "AVAILABLE",
    },
    {
      id: "ops-slot-past-confirmed",
      listingId: "ops-listing-archived",
      startsAt: "2026-08-20T15:00:00.000Z",
      endsAt: "2026-08-20T15:30:00.000Z",
      status: "AVAILABLE",
    },
  ];
}
