export type OperationsPublicationState = "PUBLISHED" | "UNPUBLISHED";
export type OperationsLifecycleState = "OPEN" | "UNAVAILABLE" | "LET_AGREED" | "ARCHIVED";
export type OperationsViewingStatus = "PROPOSED" | "CONFIRMED";

export type OperationsApiQuery =
  | {
      kind: "listingPipeline";
      area?: string;
      publicationState?: OperationsPublicationState;
      lifecycleState?: OperationsLifecycleState;
      minPublishedAgeDays?: number;
    }
  | {
      kind: "upcomingViewings";
      from: string;
      to: string;
      status?: OperationsViewingStatus;
      area?: string;
      listingId?: string;
    };

export type OperationsApiListingItem = {
  id: string;
  revision: number;
  title: string;
  area: string;
  monthlyRentGbp: number;
  bedrooms: number;
  sizeSqM: number;
  availableFrom: string;
  publicationState: OperationsPublicationState;
  lifecycleState: OperationsLifecycleState;
  firstPublishedAt: string;
  publishedAgeDays: number;
  stale: boolean;
};

export type OperationsApiViewingItem = {
  slotId: string;
  requestId: string;
  listingId: string;
  listingTitle: string;
  area: string;
  status: OperationsViewingStatus;
  startsAt: string;
  endsAt: string;
};

type OperationsApiEnvelope<TQuery extends OperationsApiQuery, TItem> = {
  profile: "operations";
  fixtureGeneration: number;
  timezone: "Europe/London";
  asOf: string;
  dataAsOf: string;
  freshness: "CURRENT";
  filters: TQuery;
  totalCount: number;
  returnedCount: number;
  truncated: boolean;
  items: TItem[];
};

export type OperationsApiResponse =
  | (OperationsApiEnvelope<Extract<OperationsApiQuery, { kind: "listingPipeline" }>, OperationsApiListingItem> & {
      counts: {
        publicationState: Record<OperationsPublicationState, number>;
        lifecycleState: Record<OperationsLifecycleState, number>;
      };
    })
  | (OperationsApiEnvelope<Extract<OperationsApiQuery, { kind: "upcomingViewings" }>, OperationsApiViewingItem> & {
      counts: Record<OperationsViewingStatus, number>;
    });

export type OperationsApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "VALIDATION_FAILED"
  | "PERSISTENCE_ERROR"
  | "AUTHORITY_UNAVAILABLE";

export type OperationsApiErrorResponse = {
  error: {
    code: OperationsApiErrorCode;
    message: string;
  };
};
