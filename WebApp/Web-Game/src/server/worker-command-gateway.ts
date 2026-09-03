import type {
  ClientSnapshot,
  FullSnapshotInput,
  MovePlayerInput,
  PlayerMoveResult,
} from "./world-projection";
import { ClientSnapshotService, PlayerMovementService } from "./world-projection";
import type {
  MovementIntentResult,
  MovementIntentMutationInput,
  MovementCadenceFailureListener,
  PlayerMovementCadenceService,
  SessionSetMovementIntentInput,
  SessionStopMovementIntentInput,
  SetMovementIntentInput,
  StopMovementIntentInput,
} from "./player-movement-cadence";
import type { WorldClockAdvanceResult } from "./world-clock";
import type { WorldWorker } from "./world-worker";
import type {
  AssignSoldierMissionInput,
  AssignSoldierMissionResult,
  ForceRecallSoldierInput,
  ForceRecallSoldierResult,
  MissionService,
} from "./mission-service";
import type {
  InspectClientSnapshotResult,
  InspectMissionHistoryResult,
  InspectMissionsResult,
  InspectShelterStateResult,
} from "../shared/page-tool-contract";

export type WorkerGatewayErrorCode = "WORKER_NOT_READY" | "WORKER_CLOCK_UNAVAILABLE" | "MISSION_UNAVAILABLE" | "GATEWAY_CLOSED";

export class WorkerGatewayError extends Error {
  readonly code: WorkerGatewayErrorCode;

  constructor(code: WorkerGatewayErrorCode) {
    super(code);
    this.name = "WorkerGatewayError";
    this.code = code;
  }
}

export interface WorkerCommandGatewayOptions {
  worker: Pick<WorldWorker, "state" | "advance">;
  movement: PlayerMovementService;
  cadence: PlayerMovementCadenceService;
  snapshot: ClientSnapshotService;
  mission?: MissionService;
}

/**
 * Process-local FIFO handoff for commands, reads, and explicit worker clock
 * advances. It does not create a timer or a durable queue.
 */
export class WorkerCommandGateway {
  private readonly worker: WorkerCommandGatewayOptions["worker"];
  private readonly movement: PlayerMovementService;
  private readonly cadence: PlayerMovementCadenceService;
  private readonly snapshot: ClientSnapshotService;
  private readonly mission?: MissionService;
  private tail: Promise<void> = Promise.resolve();
  private closed = false;

  constructor(options: WorkerCommandGatewayOptions) {
    this.worker = options.worker;
    this.movement = options.movement;
    this.cadence = options.cadence;
    this.snapshot = options.snapshot;
    this.mission = options.mission;
  }

  movePlayer(input: MovePlayerInput): Promise<PlayerMoveResult> {
    const request = { ...input };
    return this.enqueue(() => {
      this.cadence.stopForPlayerMutation({
        worldId: request.worldId,
        playerId: request.playerId,
        binding: request.binding,
        commandId: request.commandId,
        idempotencyKey: request.idempotencyKey,
        reason: "move_player",
      });
      return this.movement.move(request);
    });
  }

  setMovementIntent(input: SetMovementIntentInput): Promise<MovementIntentResult> {
    const request = { ...input };
    return this.enqueue(() => this.cadence.setIntent(request));
  }

  stopMovementIntent(input: StopMovementIntentInput): Promise<MovementIntentResult> {
    const request = { ...input };
    return this.enqueue(() => this.cadence.stopIntent(request));
  }

  setMovementIntentForSession(input: SessionSetMovementIntentInput): Promise<MovementIntentResult> {
    const request = { ...input };
    return this.enqueue(() => this.cadence.setIntentForSession(request));
  }

  stopMovementIntentForSession(input: SessionStopMovementIntentInput): Promise<MovementIntentResult> {
    const request = { ...input };
    return this.enqueue(() => this.cadence.stopIntentForSession(request));
  }

  revokeMovementIntentOwner(ownerId: string): void {
    this.cadence.revokeIntentOwner(ownerId);
  }

  onMovementIntentFailure(listener: MovementCadenceFailureListener): void {
    this.cadence.onFailure(listener);
  }

  stopMovementIntentForMutation(input: MovementIntentMutationInput): Promise<void> {
    const request = { ...input };
    return this.enqueue(() => this.cadence.stopForPlayerMutation(request));
  }

  fullSnapshot(input: FullSnapshotInput): Promise<ClientSnapshot> {
    const request = { ...input };
    return this.enqueue(() => this.snapshot.full(request));
  }

  inspectShelterState(input: FullSnapshotInput & { readonly requestId: string }): Promise<InspectShelterStateResult> {
    const request = { ...input };
    return this.enqueue(() => this.snapshot.inspectShelterState(request));
  }

  inspectClientSnapshot(input: FullSnapshotInput & { readonly requestId: string }): Promise<InspectClientSnapshotResult> {
    const request = { ...input };
    return this.enqueue(() => this.snapshot.inspectClientSnapshot(request));
  }

  inspectMissions(input: FullSnapshotInput & { readonly requestId: string }): Promise<InspectMissionsResult> {
    const request = { ...input };
    return this.enqueue(() => this.snapshot.inspectMissions(request));
  }

  inspectMissionHistory(input: FullSnapshotInput & {
    readonly requestId: string;
    readonly cursor?: string;
    readonly limit?: number;
  }): Promise<InspectMissionHistoryResult> {
    const request = { ...input };
    return this.enqueue(() => this.snapshot.inspectMissionHistory(request));
  }

  advance(elapsedMs: number): Promise<WorldClockAdvanceResult> {
    return this.enqueue(() => {
      if (!this.worker.advance) {
        throw new WorkerGatewayError("WORKER_CLOCK_UNAVAILABLE");
      }
      return this.worker.advance(elapsedMs);
    });
  }

  assignSoldierMission(input: AssignSoldierMissionInput): Promise<AssignSoldierMissionResult> {
    const request = { ...input };
    return this.enqueue(() => {
      if (!this.mission) {
        throw new WorkerGatewayError("MISSION_UNAVAILABLE");
      }
      this.cadence.stopForPlayerMutation({
        worldId: request.worldId,
        playerId: request.playerId,
        binding: request.binding,
        commandId: request.commandId,
        idempotencyKey: request.idempotencyKey,
        reason: "assign_soldier_mission",
      });
      return this.mission.assignSoldierMission(request);
    });
  }

  forceRecallSoldier(input: ForceRecallSoldierInput): Promise<ForceRecallSoldierResult> {
    const request = { ...input };
    return this.enqueue(() => {
      if (!this.mission) {
        throw new WorkerGatewayError("MISSION_UNAVAILABLE");
      }
      this.cadence.stopForPlayerMutation({
        worldId: request.worldId,
        playerId: request.playerId,
        binding: request.binding,
        commandId: request.commandId,
        idempotencyKey: request.idempotencyKey,
        reason: "force_recall_soldier",
      });
      return this.mission.forceRecallSoldier(request);
    });
  }

  /**
   * Close admission and reject queued work that has not started. The owning
   * runtime remains responsible for stopping the worker and closing storage.
   */
  close(): void {
    this.closed = true;
  }

  private enqueue<T>(operation: () => T): Promise<T> {
    if (this.closed) {
      return Promise.reject(new WorkerGatewayError("GATEWAY_CLOSED"));
    }
    if (this.worker.state !== "ready") {
      return Promise.reject(new WorkerGatewayError("WORKER_NOT_READY"));
    }

    const run = this.tail.then(() => {
      if (this.closed) {
        throw new WorkerGatewayError("GATEWAY_CLOSED");
      }
      if (this.worker.state !== "ready") {
        throw new WorkerGatewayError("WORKER_NOT_READY");
      }
      return operation();
    });
    this.tail = run.then(() => undefined, () => undefined);
    return run;
  }
}
