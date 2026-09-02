export const REQUEST_STATES = [
  "TENANT_DRAFT",
  "REQUEST_SUBMITTED",
  "AGENT_REVIEWING",
  "SLOT_PROPOSED",
  "VIEWING_CONFIRMED",
  "TENANT_DECLINED",
  "EXPIRED",
  "AGENT_DECLINED",
] as const;

export type RequestState = (typeof REQUEST_STATES)[number];
export type ActorRole = "tenant" | "agent";
export type ListingStatus = "PUBLISHED" | "UNPUBLISHED";
export type SlotStatus = "AVAILABLE" | "HELD_FOR_PROPOSAL" | "CONFIRMED";
export const FAVOURITE_STATES = ["ACTIVE", "REMOVED"] as const;
export type FavouriteState = (typeof FAVOURITE_STATES)[number];
export type FavouriteStatus = FavouriteState;

export type Actor = {
  id: string;
  role: ActorRole;
};

export type Listing = {
  id: string;
  version: number;
  status: ListingStatus;
  assignedAgentId: string;
  title: string;
  address: string;
  area: string;
  monthlyRentGbp: number;
  bedrooms: number;
  sizeSqM: number;
  availableFrom: string;
  description: string;
  imageKey: string;
};

export type TenantListing = Omit<Listing, "assignedAgentId" | "status">;

export type AvailabilitySlot = {
  id: string;
  listingId: string;
  startsAt: string;
  endsAt: string;
  status: SlotStatus;
  heldByRequestId?: string;
};

export type PreparedResponse =
  | {
      kind: "SLOT_PROPOSAL";
      slotId: string;
      tenantNote?: string;
    }
  | {
      kind: "AGENT_DECLINE";
      tenantNote?: string;
    };

export type SentResponse =
  | {
      kind: "SLOT_PROPOSAL";
      slotId: string;
      tenantNote?: string;
    }
  | {
      kind: "AGENT_DECLINE";
      tenantNote?: string;
    };

export type ViewingRequest = {
  id: string;
  listingId: string;
  listingVersion: number;
  tenantId: string;
  agentId: string;
  preferredTimes: string[];
  tenantNote?: string;
  state: RequestState;
  version: number;
  fixtureGeneration: number;
  preparedResponse?: PreparedResponse;
  sentResponse?: SentResponse;
  proposalExpiresAt?: string;
  internalReviewNote?: string;
};

export type Favourite = {
  tenantId: string;
  listingId: string;
  state: FavouriteState;
  version: number;
  createdAt: string;
  updatedAt: string;
  savedListingVersion: number;
  savedMonthlyRentGbp: number;
};

export type AuditEntry = {
  sequence: number;
  commandId?: string;
  operation: string;
  actorId?: string;
  actorRole?: ActorRole;
  requestId: string;
  fromState: RequestState | null;
  toState: RequestState;
  requestVersion: number;
};

export type ProcessedCommand = {
  commandId: string;
  fingerprint: string;
  result: DomainCommandResult | FavouriteCommandResult;
};

export type WorkflowState = {
  fixtureGeneration: number;
  tenantId: string;
  agentId: string;
  listings: Listing[];
  slots: AvailabilitySlot[];
  request: ViewingRequest | null;
  favourites: Favourite[];
  audit: AuditEntry[];
  processedCommands: ProcessedCommand[];
};

export type ResponsePreparationInput =
  | {
      kind: "SLOT_PROPOSAL";
      slotId: string;
      tenantNote?: string;
    }
  | {
      kind: "AGENT_DECLINE";
      tenantNote?: string;
    };

type CommandMetadata = {
  commandId: string;
  actor: Actor;
  fixtureGeneration: number;
  requestId: string;
  expectedRequestVersion: number;
};

export type WorkflowCommand =
  | (CommandMetadata & {
      type: "CREATE_REQUEST_DRAFT";
      listingId: string;
      expectedListingVersion: number;
      expectedRequestVersion: 0;
      preferredTimes: string[];
      tenantNote?: string;
    })
  | (CommandMetadata & {
      type: "UPDATE_REQUEST_DRAFT";
      listingId: string;
      expectedListingVersion: number;
      preferredTimes: string[];
      tenantNote?: string;
    })
  | (CommandMetadata & {
      type: "SUBMIT_REQUEST";
      listingId: string;
      expectedListingVersion: number;
    })
  | (CommandMetadata & {
      type: "START_AGENT_REVIEW";
    })
  | (CommandMetadata & {
      type: "PREPARE_AGENT_RESPONSE";
      preparation: ResponsePreparationInput;
      internalReviewNote?: string;
    })
  | (CommandMetadata & {
      type: "SEND_SLOT_PROPOSAL";
    })
  | (CommandMetadata & {
      type: "SEND_AGENT_DECLINE";
    })
  | (CommandMetadata & {
      type: "CONFIRM_VIEWING";
    })
  | (CommandMetadata & {
      type: "DECLINE_VIEWING";
    });

export type FavouriteCommand =
  | {
      type: "SAVE_FAVOURITE";
      commandId: string;
      actor: Actor;
      fixtureGeneration: number;
      listingId: string;
      expectedListingVersion: number;
      expectedFavouriteVersion: number;
    }
  | {
      type: "REMOVE_FAVOURITE";
      commandId: string;
      actor: Actor;
      fixtureGeneration: number;
      listingId: string;
      expectedFavouriteVersion: number;
    };

export type DomainCommandResult = {
  commandId: string;
  requestId: string;
  requestState: RequestState;
  requestVersion: number;
  slotId?: string;
  idempotent?: boolean;
};

export type FavouriteCommandResult = {
  commandId: string;
  listingId: string;
  favouriteState: FavouriteState;
  favouriteVersion: number;
  idempotent?: boolean;
};

export type CommandSuccess = {
  ok: true;
  state: WorkflowState;
  result: DomainCommandResult;
};

export type CommandFailure = {
  ok: false;
  state: WorkflowState;
  error: import("./errors").DomainError;
};

export type CommandOutcome = CommandSuccess | CommandFailure;

export type FavouriteCommandSuccess = {
  ok: true;
  state: WorkflowState;
  result: FavouriteCommandResult;
};

export type FavouriteCommandFailure = {
  ok: false;
  state: WorkflowState;
  error: import("./errors").DomainError;
};

export type FavouriteCommandOutcome = FavouriteCommandSuccess | FavouriteCommandFailure;

export type TenantProjection = {
  request: {
    id: string;
    listingId: string;
    preferredTimes: string[];
    tenantNote?: string;
    state: RequestState;
    version: number;
    response?: SentResponse;
    proposalExpiresAt?: string;
  };
  listing: TenantListing;
  timeline: AuditEntry[];
};

export type AgentProjection = {
  request: ViewingRequest;
  listing: Listing;
  availability: AvailabilitySlot[];
};

export type ProjectionOutcome<T> = {
  state: WorkflowState;
  projection: T;
};
