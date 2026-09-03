import { createHash } from "node:crypto";

import {
  classifyPersistenceError,
  PersistenceError,
  type PersistenceErrorCode,
} from "./persistence/errors";
import { PersistenceStore } from "./persistence/store";
import { WORLD_CLOCK_STEP_MS, type WorldClockReconciliationContext } from "./world-clock";
import {
  PlayerMovementService,
  type PlayerMoveDirection,
} from "./world-projection";

const PLAYER_MOVE_SPEED_TILES_PER_WORLD_SECOND = 4.0;
const TILES_PER_MILLISECOND = PLAYER_MOVE_SPEED_TILES_PER_WORLD_SECOND / 1000;
const ACCUMULATOR_PRECISION = 1_000_000_000;

export interface SetMovementIntentInput {
  worldId: string;
  playerId: string;
  binding: string;
  direction: PlayerMoveDirection;
  expectedRevision: number;
  idempotencyKey: string;
}

export interface StopMovementIntentInput {
  worldId: string;
  playerId: string;
  binding: string;
  expectedRevision: number;
  idempotencyKey: string;
}

export interface SessionSetMovementIntentInput extends SetMovementIntentInput {
  commandId: string;
  ownerId: string;
}

export interface SessionStopMovementIntentInput extends StopMovementIntentInput {
  commandId: string;
  ownerId: string;
}

export interface MovementIntentMutationInput {
  worldId: string;
  playerId: string;
  binding: string;
  commandId: string;
  idempotencyKey: string;
  reason: "move_player" | "assign_soldier_mission" | "force_recall_soldier";
}

export type MovementIntentOwnerStatus = "owned" | "no_active" | "not_owner" | "duplicate";

export interface MovementIntentResult {
  contractVersion: string;
  worldId: string;
  playerId: string;
  effect: "intent_set" | "intent_stopped";
  intentId?: string;
  duplicate?: boolean;
  commandId?: string;
  currentRevision?: number;
  ownerStatus?: MovementIntentOwnerStatus;
  replaced?: boolean;
}

export interface MovementCadenceFailure {
  playerId: string;
  code: PersistenceErrorCode;
  ownerId?: string;
  commandId?: string;
  currentRevision?: number;
}

export type MovementCadenceFailureListener = (failure: MovementCadenceFailure) => void;

export interface MovementCadenceStepResult {
  worldId: string;
  elapsedMs: number;
  committedMoves: number;
  activeIntentCount: number;
  failures: MovementCadenceFailure[];
}

interface MovementIntent {
  worldId: string;
  playerId: string;
  binding: string;
  direction: PlayerMoveDirection;
  intentId: string;
  expectedRevision: number;
  accumulatorTiles: number;
  crossingSequence: number;
  ownerId: string | null;
  commandId: string | null;
}

const DIRECTIONS = new Set<PlayerMoveDirection>(["up", "down", "left", "right"]);

function assertCommandInput(input: SetMovementIntentInput | StopMovementIntentInput, direction?: PlayerMoveDirection): void {
  if (input.worldId.trim() === "" || input.playerId.trim() === "" || input.binding.trim() === "" || input.idempotencyKey.trim() === "") {
    throw new PersistenceError("INVALID_INPUT");
  }
  if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 0) {
    throw new PersistenceError("INVALID_INPUT");
  }
  if (direction !== undefined && !DIRECTIONS.has(direction)) {
    throw new PersistenceError("INVALID_INPUT");
  }
}

function assertSessionInput(input: { commandId: string; ownerId: string; idempotencyKey?: string }): void {
  if (input.commandId.trim() === "" || input.ownerId.trim() === ""
    || (input.idempotencyKey !== undefined && input.commandId === input.idempotencyKey)) {
    throw new PersistenceError("INVALID_INPUT");
  }
}

function intentKey(worldId: string, playerId: string): string {
  return `${worldId}\u0000${playerId}`;
}

function intentIdFor(worldId: string, playerId: string, idempotencyKey: string): string {
  const digest = createHash("sha256")
    .update(`${worldId}\u0000${playerId}\u0000${idempotencyKey}`)
    .digest("hex")
    .slice(0, 24);
  return `movement-intent-${digest}`;
}

function crossingIdempotencyKey(intent: MovementIntent): string {
  return `movement-crossing-idempotency:${intent.intentId}:${intent.crossingSequence + 1}`;
}

function crossingCommandId(intent: MovementIntent): string {
  return `movement-crossing-command:${intent.intentId}:${intent.crossingSequence + 1}`;
}

function roundAccumulator(value: number): number {
  return Math.round(value * ACCUMULATOR_PRECISION) / ACCUMULATOR_PRECISION;
}

export class PlayerMovementCadenceService {
  private readonly store: PersistenceStore;
  private readonly movement: PlayerMovementService;
  private readonly intents = new Map<string, MovementIntent>();
  private readonly latestStepResults = new Map<string, MovementCadenceStepResult>();
  private readonly closedOwners = new Set<string>();
  private readonly failureListeners = new Set<MovementCadenceFailureListener>();

  constructor(options: { store: PersistenceStore; movement: PlayerMovementService }) {
    this.store = options.store;
    this.movement = options.movement;
  }

  setIntent(input: SetMovementIntentInput): MovementIntentResult {
    return this.setIntentInternal(input, null, undefined);
  }

  stopIntent(input: StopMovementIntentInput): MovementIntentResult {
    return this.stopIntentInternal(input, null, undefined, false);
  }

  setIntentForSession(input: SessionSetMovementIntentInput): MovementIntentResult {
    assertCommandInput(input, input.direction);
    assertSessionInput(input);
    if (this.closedOwners.has(input.ownerId)) {
      throw new PersistenceError("MOVEMENT_INTENT_SESSION_CLOSED");
    }
    return this.setIntentInternal(input, input.ownerId, input.commandId);
  }

  stopIntentForSession(input: SessionStopMovementIntentInput): MovementIntentResult {
    assertCommandInput(input);
    assertSessionInput(input);
    if (this.closedOwners.has(input.ownerId)) {
      throw new PersistenceError("MOVEMENT_INTENT_SESSION_CLOSED");
    }
    return this.stopIntentInternal(input, input.ownerId, input.commandId, true);
  }

  /** Revoke a realtime owner synchronously before its connection is drained. */
  revokeIntentOwner(ownerId: string): void {
    if (typeof ownerId !== "string" || ownerId.trim() === "") {
      return;
    }
    this.closedOwners.add(ownerId);
    for (const [key, intent] of this.intents) {
      if (intent.ownerId === ownerId) {
        this.intents.delete(key);
        this.latestStepResults.delete(intent.worldId);
      }
    }
  }

  clearAllIntents(): void {
    this.intents.clear();
    this.latestStepResults.clear();
  }

  onFailure(listener: MovementCadenceFailureListener): void {
    if (typeof listener !== "function") {
      throw new TypeError("MOVEMENT_INTENT_FAILURE_LISTENER_INVALID");
    }
    this.failureListeners.add(listener);
  }

  /** Safety-stop an active realtime intent before a competing mutation. */
  stopForPlayerMutation(input: MovementIntentMutationInput): void {
    if (input.worldId.trim() === "" || input.playerId.trim() === "" || input.binding.trim() === ""
      || input.commandId.trim() === "" || input.idempotencyKey.trim() === "") {
      throw new PersistenceError("INVALID_INPUT");
    }
    const safetyKey = `movement-intent-safety-stop:${input.idempotencyKey}`;
    if (this.store.idempotency(input.worldId, safetyKey)) {
      return;
    }
    const world = this.store.getWorld(input.worldId);
    if (!world) {
      throw new PersistenceError("WORLD_NOT_FOUND");
    }
    this.authorize(input);
    this.store.commitTransition({
      worldId: input.worldId,
      worldTime: world.worldTime,
      idempotency: {
        key: safetyKey,
        binding: input.binding,
        request: {
          kind: "stop_movement_intent_for_mutation",
          playerId: input.playerId,
          commandId: input.commandId,
          reason: input.reason,
        },
      },
      stateMutations: [],
      events: [],
    });
    if (this.intents.delete(intentKey(input.worldId, input.playerId))) {
      this.latestStepResults.delete(input.worldId);
    }
  }

  hasActiveIntent(worldId: string, playerId: string): boolean {
    return this.intents.has(intentKey(worldId, playerId));
  }

  lastStepResult(worldId: string): MovementCadenceStepResult | null {
    const result = this.latestStepResults.get(worldId);
    return result
      ? { ...result, failures: result.failures.map((failure) => ({ ...failure })) }
      : null;
  }

  reconcile = (context: WorldClockReconciliationContext): MovementCadenceStepResult => {
    if (context.elapsedMs !== WORLD_CLOCK_STEP_MS) {
      throw new PersistenceError("INVALID_INPUT");
    }

    const active = [...this.intents.values()]
      .filter((intent) => intent.worldId === context.worldId)
      .sort((left, right) => left.worldId.localeCompare(right.worldId) || left.playerId.localeCompare(right.playerId));
    let committedMoves = 0;
    const failures: MovementCadenceFailure[] = [];

    for (const intent of active) {
      intent.accumulatorTiles = roundAccumulator(intent.accumulatorTiles + context.elapsedMs * TILES_PER_MILLISECOND);
      while (intent.accumulatorTiles >= 1) {
        const idempotencyKey = crossingIdempotencyKey(intent);
        try {
          const result = this.movement.move({
            worldId: intent.worldId,
            playerId: intent.playerId,
            binding: intent.binding,
            commandId: crossingCommandId(intent),
            direction: intent.direction,
            expectedRevision: intent.expectedRevision,
            idempotencyKey,
          });
          intent.expectedRevision = result.revision;
          intent.crossingSequence += 1;
          intent.accumulatorTiles = roundAccumulator(intent.accumulatorTiles - 1);
          committedMoves += 1;
        } catch (error) {
          const typed = classifyPersistenceError(error, "RECOVERY_REQUIRED");
          const failure: MovementCadenceFailure = {
            playerId: intent.playerId,
            code: typed.code,
            ...(intent.ownerId ? { ownerId: intent.ownerId } : {}),
            ...(intent.commandId ? { commandId: intent.commandId } : {}),
            ...(intent.ownerId
              ? { currentRevision: this.store.getPlayer(intent.worldId, intent.playerId)?.revision }
              : {}),
          };
          failures.push(failure);
          for (const listener of this.failureListeners) {
            try {
              listener({ ...failure });
            } catch {
              // Failure observers are transport-side notifications and never
              // alter the authoritative cadence result.
            }
          }
          this.intents.delete(intentKey(intent.worldId, intent.playerId));
          break;
        }
      }
    }

    const activeIntentCount = [...this.intents.values()].filter((intent) => intent.worldId === context.worldId).length;
    const result = {
      worldId: context.worldId,
      elapsedMs: context.elapsedMs,
      committedMoves,
      activeIntentCount,
      failures,
    };
    // Keep a terminal cadence failure observable until a new intent is accepted. Without this,
    // the remaining no-intent steps in one large worker advance would erase the typed boundary
    // outcome before a caller can inspect it.
    const previous = this.latestStepResults.get(context.worldId);
    if (failures.length > 0 || activeIntentCount > 0 || !previous) {
      this.latestStepResults.set(context.worldId, result);
    }
    return result;
  };

  private authorize(input: SetMovementIntentInput | StopMovementIntentInput | MovementIntentMutationInput) {
    const world = this.store.getWorld(input.worldId);
    if (!world) {
      throw new PersistenceError("WORLD_NOT_FOUND");
    }
    const player = this.store.getPlayer(input.worldId, input.playerId);
    if (!player) {
      throw new PersistenceError("ENTITY_NOT_FOUND");
    }
    if (player.binding !== input.binding) {
      throw new PersistenceError("OWNERSHIP_DENIED");
    }
    return player;
  }

  private setIntentInternal(
    input: SetMovementIntentInput,
    ownerId: string | null,
    commandId: string | undefined,
  ): MovementIntentResult {
    assertCommandInput(input, input.direction);
    const player = this.authorize(input);
    const existingRecord = this.store.idempotency(input.worldId, input.idempotencyKey);
    const active = this.intents.get(intentKey(input.worldId, input.playerId));
    const request = {
      kind: "set_movement_intent",
      playerId: input.playerId,
      direction: input.direction,
      expectedRevision: input.expectedRevision,
      ...(commandId ? { commandId } : {}),
      ...(ownerId ? { ownerId } : {}),
    };
    if (!existingRecord && player.revision !== input.expectedRevision) {
      if (ownerId && active?.ownerId === ownerId) {
        this.intents.delete(intentKey(input.worldId, input.playerId));
        this.latestStepResults.delete(input.worldId);
      }
      const rejection = new PersistenceError("STALE_REVISION");
      try {
        this.store.recordRejectedIdempotency(input.worldId, {
          key: input.idempotencyKey,
          binding: input.binding,
          request,
        }, rejection);
      } catch (error) {
        throw classifyPersistenceError(error, "STORE_OPEN_FAILED");
      }
      throw rejection;
    }
    const duplicate = this.commitCommand(input, request, player.revision, true);
    const intentId = intentIdFor(input.worldId, input.playerId, input.idempotencyKey);
    const replaced = Boolean(active && (!duplicate || active.direction !== input.direction));
    if (!duplicate) {
      this.intents.set(intentKey(input.worldId, input.playerId), {
        worldId: input.worldId,
        playerId: input.playerId,
        binding: input.binding,
        direction: input.direction,
        intentId,
        expectedRevision: input.expectedRevision,
        accumulatorTiles: 0,
        crossingSequence: 0,
        ownerId,
        commandId: commandId ?? null,
      });
      this.latestStepResults.delete(input.worldId);
    }
    return {
      contractVersion: this.store.contractVersion,
      worldId: input.worldId,
      playerId: input.playerId,
      effect: "intent_set",
      intentId,
      ...(duplicate ? { duplicate: true } : {}),
      ...(commandId ? { commandId } : {}),
      currentRevision: player.revision,
      ownerStatus: duplicate ? "duplicate" : "owned",
      ...(replaced ? { replaced: true } : {}),
    };
  }

  private stopIntentInternal(
    input: StopMovementIntentInput,
    ownerId: string | null,
    commandId: string | undefined,
    ignoreExpectedRevision: boolean,
  ): MovementIntentResult {
    assertCommandInput(input);
    const player = this.authorize(input);
    const active = this.intents.get(intentKey(input.worldId, input.playerId));
    const request = {
      kind: "stop_movement_intent",
      playerId: input.playerId,
      expectedRevision: input.expectedRevision,
      ...(commandId ? { commandId } : {}),
      ...(ownerId ? { ownerId } : {}),
    };
    const duplicate = this.commitCommand(input, request, player.revision, ignoreExpectedRevision);
    let ownerStatus: MovementIntentOwnerStatus = "no_active";
    if (duplicate) {
      ownerStatus = "duplicate";
    } else if (active && (ownerId === null || active.ownerId === ownerId)) {
      this.intents.delete(intentKey(input.worldId, input.playerId));
      this.latestStepResults.delete(input.worldId);
      ownerStatus = "owned";
    } else if (active && ownerId !== null) {
      ownerStatus = "not_owner";
    }
    return {
      contractVersion: this.store.contractVersion,
      worldId: input.worldId,
      playerId: input.playerId,
      effect: "intent_stopped",
      ...(duplicate ? { duplicate: true } : {}),
      ...(commandId ? { commandId } : {}),
      currentRevision: player.revision,
      ownerStatus,
    };
  }

  private commitCommand(
    input: SetMovementIntentInput | StopMovementIntentInput,
    request: Record<string, unknown>,
    currentRevision: number,
    ignoreExpectedRevision = false,
  ): boolean {
    const existing = this.store.idempotency(input.worldId, input.idempotencyKey);
    if (!existing && !ignoreExpectedRevision && currentRevision !== input.expectedRevision) {
      throw new PersistenceError("STALE_REVISION");
    }
    const world = this.store.getWorld(input.worldId);
    if (!world) {
      throw new PersistenceError("WORLD_NOT_FOUND");
    }
    const transition = this.store.commitTransition({
      worldId: input.worldId,
      worldTime: world.worldTime,
      idempotency: {
        key: input.idempotencyKey,
        binding: input.binding,
        request,
      },
      stateMutations: [],
      events: [],
    });
    return transition.duplicate === true;
  }
}
