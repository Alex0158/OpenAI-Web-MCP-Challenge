export const OPERATIONS_PROFILE = "operations" as const;
export type OperationsProfile = typeof OPERATIONS_PROFILE;

export const OPERATIONS_TIMEZONE = "Europe/London" as const;
export type OperationsTimezone = typeof OPERATIONS_TIMEZONE;

export const OPERATIONS_AGENT_ID = "agent-demo" as const;
export const OPERATIONS_OTHER_AGENT_ID = "agent-other" as const;

export const OPERATIONS_SCHEMA_VERSION = 1 as const;
export const OPERATIONS_INITIAL_GENERATION = 1 as const;
export const OPERATIONS_SEED_VERSION = "operations-fixture-v1" as const;
export const OPERATIONS_SOURCE_REVISION = "operations-profile-authority-v1" as const;
export const OPERATIONS_DATA_AS_OF = "2026-09-01T12:00:00.000Z" as const;
export const OPERATIONS_STALE_THRESHOLD_DAYS = 90 as const;

export const OPERATIONS_PUBLICATION_STATES = [
  "PUBLISHED",
  "UNPUBLISHED",
] as const;
export type OperationsPublicationState = (typeof OPERATIONS_PUBLICATION_STATES)[number];

export const OPERATIONS_LISTING_LIFECYCLE_STATES = [
  "OPEN",
  "UNAVAILABLE",
  "LET_AGREED",
  "ARCHIVED",
] as const;
export type OperationsListingLifecycleState =
  (typeof OPERATIONS_LISTING_LIFECYCLE_STATES)[number];

export const OPERATIONS_REQUEST_STATUSES = [
  "TENANT_DRAFT",
  "REQUEST_SUBMITTED",
  "AGENT_REVIEWING",
  "SLOT_PROPOSED",
  "VIEWING_CONFIRMED",
  "TENANT_DECLINED",
  "EXPIRED",
  "AGENT_DECLINED",
] as const;
export type OperationsRequestStatus = (typeof OPERATIONS_REQUEST_STATUSES)[number];
export type OperationsRequestState = OperationsRequestStatus;

export const OPERATIONS_SLOT_STATUSES = [
  "AVAILABLE",
  "HELD_FOR_PROPOSAL",
  "CONFIRMED",
] as const;
export type OperationsSlotStatus = (typeof OPERATIONS_SLOT_STATUSES)[number];

export type OperationsProfileMetadata = {
  profile: OperationsProfile;
  schemaVersion: number;
  fixtureGeneration: number;
  seedVersion: string;
  dataAsOf: string;
  sourceRevision: string;
  timezone: OperationsTimezone;
};

export type OperationsListing = {
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
  assignedAgentId: string;
  firstPublishedAt: string;
};

export type OperationsViewingRequest = {
  id: string;
  listingId: string;
  listingRevision: number;
  assignedAgentId: string;
  status: OperationsRequestStatus;
  selectedSlotId?: string;
  createdAt: string;
  updatedAt: string;
};

export type OperationsAvailabilitySlot = {
  id: string;
  listingId: string;
  startsAt: string;
  endsAt: string;
  status: OperationsSlotStatus;
  selectedRequestId?: string;
};

export type OperationsProfileState = {
  metadata: OperationsProfileMetadata;
  listings: OperationsListing[];
  requests: OperationsViewingRequest[];
  slots: OperationsAvailabilitySlot[];
};

export type OperationsState = OperationsProfileState;
export type OperationsSnapshot = OperationsProfileState;
