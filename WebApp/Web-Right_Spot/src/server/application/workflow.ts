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

  readAgentProjection(
    actor: Actor,
    now: string,
  ): ProjectionOutcome<AgentProjection> {
    return this.store.readAgentProjection(actor, now);
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
