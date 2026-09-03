import {
  projectOperationsProfile,
  type OperationsProfileProjection,
  type OperationsProjectionQuery,
} from "../domain/operations-profile-projection";
import type { Actor } from "../domain/types";
import {
  DEFAULT_OPERATIONS_DATABASE_PATH,
  OperationsStore,
  type OperationsStoreOptions,
} from "../persistence/operations-store";

type OperationsStorePort = Pick<OperationsStore, "readState" | "close">;

export type OperationsInsightsApplicationOptions = OperationsStoreOptions & {
  createStore?: () => OperationsStorePort;
  now?: () => string;
};

export class OperationsInsightsApplication {
  private readonly store: OperationsStorePort;
  private readonly now: () => string;

  constructor(options: OperationsInsightsApplicationOptions = {}) {
    this.store = options.createStore?.() ?? new OperationsStore({
      databasePath: options.databasePath ?? DEFAULT_OPERATIONS_DATABASE_PATH,
      initialTimestamp: options.initialTimestamp,
    });
    this.now = options.now ?? (() => new Date().toISOString());
  }

  read(actor: Actor, query: OperationsProjectionQuery): OperationsProfileProjection {
    return projectOperationsProfile(this.store.readState(), actor, query, this.now());
  }

  close(): void {
    this.store.close();
  }
}

export function createOperationsInsightsApplication(
  options: OperationsInsightsApplicationOptions = {},
): OperationsInsightsApplication {
  return new OperationsInsightsApplication(options);
}
