import {
  parseMovementIntentResultFrame,
  type MovementIntentAction,
  type MovementIntentResultFrame,
} from "../shared/movement-intent-command";
import type { MovePlayerDirection } from "../shared/move-player-command";

export interface ServerMovementIntentContext {
  contractVersion: string;
  playerRevision: number;
}

export interface ServerMovementIntentControllerOptions {
  getContext: () => ServerMovementIntentContext | null;
  send: (frame: unknown) => void;
  onStatus?: (message: string) => void;
}

interface PendingCommand {
  action: MovementIntentAction;
  commandId: string;
  direction?: MovePlayerDirection;
}

let fallbackSequence = 0;

function commandId(prefix: string): string {
  const uuid = typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `${Date.now().toString(36)}-${(++fallbackSequence).toString(36)}`;
  return `browser-${prefix}-command:${uuid}`;
}

function idempotencyKey(prefix: string): string {
  const uuid = typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `${Date.now().toString(36)}-${(++fallbackSequence).toString(36)}`;
  return `browser-${prefix}-idempotency:${uuid}`;
}

export interface ServerMovementIntentController {
  readonly pending: boolean;
  readonly activeDirection: MovePlayerDirection | null;
  readonly recoveryRequired: boolean;
  start(direction: MovePlayerDirection): boolean;
  stop(): boolean;
  handleResult(value: unknown): boolean;
  setReady(ready: boolean): void;
  connectionClosed(): void;
  reset(): void;
}

/**
 * Client lifecycle for the server-owned movement intent. It emits one start,
 * replacement, or stop frame and never schedules a browser timer. Position is
 * reconciled only by the realtime full-snapshot projection.
 */
export function createServerMovementIntentController(
  options: ServerMovementIntentControllerOptions,
): ServerMovementIntentController {
  let ready = false;
  let activeDirection: MovePlayerDirection | null = null;
  let pending: PendingCommand | null = null;
  let stopAfterPendingStart = false;
  let recoveryRequired = false;

  const emitStatus = (message: string): void => {
    options.onStatus?.(message);
  };

  const send = (action: MovementIntentAction, direction?: MovePlayerDirection): boolean => {
    const context = options.getContext();
    if (!ready || !context || pending !== null || recoveryRequired) {
      return false;
    }
    const next: PendingCommand = {
      action,
      commandId: commandId(`movement-${action}`),
      ...(direction ? { direction } : {}),
    };
    const frame = {
      kind: "movement_intent_command" as const,
      action,
      command_id: next.commandId,
      contract_version: context.contractVersion,
      expected_entity_revisions: { player: context.playerRevision },
      idempotency_key: idempotencyKey(`movement-${action}`),
      typed_arguments: action === "start" ? { direction } : {},
    };
    pending = next;
    try {
      options.send(frame);
      return true;
    } catch {
      pending = null;
      recoveryRequired = true;
      emitStatus("Movement command could not be sent. Reconnect to continue.");
      return false;
    }
  };

  return {
    get pending() {
      return pending !== null;
    },
    get activeDirection() {
      return activeDirection;
    },
    get recoveryRequired() {
      return recoveryRequired;
    },
    start(direction) {
      if (!ready || recoveryRequired || pending !== null || activeDirection === direction) {
        return false;
      }
      stopAfterPendingStart = false;
      return send("start", direction);
    },
    stop() {
      if (pending?.action === "start") {
        stopAfterPendingStart = true;
        return true;
      }
      if (pending !== null || (!activeDirection && !stopAfterPendingStart)) {
        return false;
      }
      stopAfterPendingStart = false;
      return send("stop");
    },
    handleResult(value: unknown) {
      let result: MovementIntentResultFrame;
      try {
        result = parseMovementIntentResultFrame(value);
      } catch {
        pending = null;
        activeDirection = null;
        recoveryRequired = true;
        emitStatus("Movement response was invalid. Reconnect to continue.");
        return false;
      }
      if (!pending) {
        if (result.effect === "rejected" && result.action === "start") {
          activeDirection = null;
          stopAfterPendingStart = false;
          if (result.error_code !== "MOVEMENT_BLOCKED") {
            recoveryRequired = true;
          }
          emitStatus(`Movement stopped by the server (${result.error_code ?? "RECOVERY_REQUIRED"}).`);
          return true;
        }
        return false;
      }
      if (result.command_id !== pending.commandId || result.action !== pending.action) {
        return false;
      }
      const completed = pending;
      pending = null;
      if (result.effect === "rejected") {
        activeDirection = null;
        stopAfterPendingStart = false;
        if (result.error_code !== "MOVEMENT_BLOCKED") {
          recoveryRequired = true;
        }
        emitStatus(`Movement command rejected (${result.error_code ?? "RECOVERY_REQUIRED"}).`);
        return true;
      }
      if (completed.action === "start") {
        activeDirection = completed.direction ?? null;
        emitStatus(result.replaced ? "Movement direction replaced on the authoritative server." : "Movement intent is active on the authoritative server.");
        if (stopAfterPendingStart) {
          stopAfterPendingStart = false;
          send("stop");
        }
      } else {
        activeDirection = null;
        stopAfterPendingStart = false;
        emitStatus("Movement intent stopped on the authoritative server.");
      }
      return true;
    },
    setReady(nextReady) {
      ready = nextReady;
      if (!nextReady) {
        pending = null;
        activeDirection = null;
        stopAfterPendingStart = false;
      }
    },
    connectionClosed() {
      ready = false;
      pending = null;
      activeDirection = null;
      stopAfterPendingStart = false;
      recoveryRequired = true;
    },
    reset() {
      ready = false;
      pending = null;
      activeDirection = null;
      stopAfterPendingStart = false;
      recoveryRequired = false;
    },
  };
}
