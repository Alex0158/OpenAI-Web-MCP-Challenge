import { domainError } from "../domain/errors";
import { FavouriteApplication } from "./favourites";
import {
  DEFAULT_SNAPSHOT_TIMESTAMP,
  WorkflowStore,
  type WorkflowResetResult,
  type WorkflowStoreOptions,
} from "../persistence/workflow-store";
import type {
  Actor,
  AgentProjection,
  CommandOutcome,
  FavouriteCommand,
  FavouriteCommandOutcome,
  ProjectionOutcome,
  TenantProjection,
  WorkflowCommand,
  WorkflowState,
} from "../domain/types";
import type {
  AgentListingInterestProjection,
  TenantFavouritesProjection,
} from "../domain/favourite-projections";
import {
  readTenantListing,
  readTenantListings,
  type ListingCollection,
  type ListingDetail,
  type ListingFilters,
} from "./listings";

export class WorkflowApplication {
  private readonly store: WorkflowStore;
  private readonly favouriteApplication: FavouriteApplication;

  constructor(options: WorkflowStoreOptions | string = {}) {
    this.store = new WorkflowStore(options);
    this.favouriteApplication = new FavouriteApplication(this.store);
  }

  readState(): WorkflowState {
    return this.store.readState();
  }

  applyCommand(command: WorkflowCommand, now: string): CommandOutcome {
    return this.store.applyCommand(command, now);
  }

  applyFavouriteCommand(
    command: FavouriteCommand,
    now: string,
  ): FavouriteCommandOutcome {
    return this.favouriteApplication.applyCommand(command, now);
  }

  readTenantProjection(
    actor: Actor,
    now: string,
  ): ProjectionOutcome<TenantProjection> {
    return this.store.readTenantProjection(actor, now);
  }

  readTenantRequest(
    actor: Actor,
    now: string,
  ): ProjectionOutcome<TenantProjection | null> {
    const state = this.store.readState();
    if (actor.role !== "tenant" || actor.id !== state.tenantId) {
      throw domainError("FORBIDDEN", "Actor cannot read the tenant request");
    }
    if (!state.request) {
      return { state, projection: null };
    }
    return this.store.readTenantProjection(actor, now);
  }

  readAgentProjection(
    actor: Actor,
    now: string,
  ): ProjectionOutcome<AgentProjection> {
    return this.store.readAgentProjection(actor, now);
  }

  readTenantFavourites(
    actor: Actor,
    now: string,
  ): ProjectionOutcome<TenantFavouritesProjection> {
    return this.favouriteApplication.readTenantFavourites(actor, now);
  }

  readAgentListingInterest(
    actor: Actor,
    now: string,
  ): ProjectionOutcome<AgentListingInterestProjection> {
    return this.favouriteApplication.readAgentListingInterest(actor, now);
  }

  readAgentQueue(
    actor: Actor,
    now: string,
  ): ProjectionOutcome<AgentProjection | null> {
    const state = this.store.readState();
    if (actor.role !== "agent" || actor.id !== state.agentId) {
      throw domainError("FORBIDDEN", "Actor cannot read the agent queue");
    }
    if (!state.request || state.request.state === "TENANT_DRAFT") {
      return { state, projection: null };
    }
    return this.store.readAgentProjection(actor, now);
  }

  readTenantListings(actor: Actor, filters: ListingFilters = {}): ListingCollection {
    return readTenantListings(this.store.readState(), actor, filters);
  }

  readTenantListing(actor: Actor, listingId: string): ListingDetail {
    return readTenantListing(this.store.readState(), actor, listingId);
  }

  reset(now: string = DEFAULT_SNAPSHOT_TIMESTAMP): WorkflowResetResult {
    return this.store.reset(now);
  }

  close(): void {
    this.store.close();
  }
}

export function createWorkflowApplication(
  options: WorkflowStoreOptions | string = {},
): WorkflowApplication {
  return new WorkflowApplication(options);
}
