import { domainError } from "../domain/errors";
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
  ProjectionOutcome,
  TenantProjection,
  WorkflowCommand,
  WorkflowState,
} from "../domain/types";
import {
  readTenantListing,
  readTenantListings,
  type ListingCollection,
  type ListingDetail,
  type ListingFilters,
} from "./listings";

export class WorkflowApplication {
  private readonly store: WorkflowStore;

  constructor(options: WorkflowStoreOptions | string = {}) {
    this.store = new WorkflowStore(options);
  }

  readState(): WorkflowState {
    return this.store.readState();
  }

  applyCommand(command: WorkflowCommand, now: string): CommandOutcome {
    return this.store.applyCommand(command, now);
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

  readAgentQueue(
    actor: Actor,
    now: string,
  ): ProjectionOutcome<AgentProjection | null> {
    const state = this.store.readState();
    if (actor.role !== "agent" || actor.id !== state.agentId) {
      throw domainError("FORBIDDEN", "Actor cannot read the agent queue");
    }
    if (!state.request) {
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
