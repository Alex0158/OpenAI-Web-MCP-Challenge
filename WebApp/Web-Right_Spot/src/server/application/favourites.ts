import type {
  Actor,
  FavouriteCommand,
  FavouriteCommandOutcome,
  ProjectionOutcome,
} from "../domain/types";
import type {
  AgentListingInterestProjection,
  TenantFavouritesProjection,
} from "../domain/favourite-projections";
import type { WorkflowStore } from "../persistence/workflow-store";

export type FavouriteApplicationPort = Pick<
  WorkflowStore,
  | "applyFavouriteCommand"
  | "readTenantFavourites"
  | "readAgentListingInterest"
>;

export class FavouriteApplication {
  private readonly store: FavouriteApplicationPort;

  constructor(store: FavouriteApplicationPort) {
    this.store = store;
  }

  applyCommand(
    command: FavouriteCommand,
    now: string,
  ): FavouriteCommandOutcome {
    return this.store.applyFavouriteCommand(command, now);
  }

  readTenantFavourites(
    actor: Actor,
    now: string,
  ): ProjectionOutcome<TenantFavouritesProjection> {
    return this.store.readTenantFavourites(actor, now);
  }

  readAgentListingInterest(
    actor: Actor,
    now: string,
  ): ProjectionOutcome<AgentListingInterestProjection> {
    return this.store.readAgentListingInterest(actor, now);
  }
}
