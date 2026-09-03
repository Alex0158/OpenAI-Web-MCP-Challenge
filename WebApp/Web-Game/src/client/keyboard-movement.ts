import type { MovePlayerDirection } from "../shared/move-player-command";

export interface MapKeyInput {
  readonly key: string;
  readonly repeat: boolean;
  readonly isComposing: boolean;
  readonly defaultPrevented: boolean;
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly pageFocused: boolean;
  readonly pageVisible: boolean;
  readonly movementSurfaceFocused: boolean;
  readonly connectionReady: boolean;
  readonly snapshotReady: boolean;
  readonly commandPending: boolean;
}

const KEY_DIRECTIONS: Readonly<Record<string, MovePlayerDirection>> = {
  w: "up",
  arrowup: "up",
  a: "left",
  arrowleft: "left",
  s: "down",
  arrowdown: "down",
  d: "right",
  arrowright: "right",
};

export function directionForMapKeyName(key: string): MovePlayerDirection | null {
  return KEY_DIRECTIONS[key.toLowerCase()] ?? null;
}

export interface MapKeyDefaultSuppressionInput {
  readonly key: string;
  readonly isComposing: boolean;
  readonly defaultPrevented: boolean;
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly pageFocused: boolean;
  readonly pageVisible: boolean;
  readonly movementSurfaceFocused: boolean;
}

/**
 * Prevents a recognized movement key from scrolling the page even when command
 * admission is temporarily blocked. This is a browser-default concern only;
 * it does not make the key eligible to submit a movement command.
 */
export function shouldSuppressMapKeyDefault(input: MapKeyDefaultSuppressionInput): boolean {
  return directionForMapKeyName(input.key) !== null
    && !input.isComposing
    && !input.defaultPrevented
    && !input.altKey
    && !input.ctrlKey
    && !input.metaKey
    && input.pageFocused
    && input.pageVisible
    && input.movementSurfaceFocused;
}

export function shouldBlockHeldMovement(input: {
  readonly recoveryRequired: boolean;
  readonly pageMutationPending: boolean;
  readonly movementPending: boolean;
}): boolean {
  return input.recoveryRequired || (input.pageMutationPending && !input.movementPending);
}

export function directionForMapKey(input: MapKeyInput): MovePlayerDirection | null {
  if (input.repeat || input.isComposing || input.defaultPrevented
    || input.altKey || input.ctrlKey || input.metaKey
    || !input.pageFocused || !input.pageVisible || !input.movementSurfaceFocused
    || !input.connectionReady || !input.snapshotReady || input.commandPending) {
    return null;
  }
  return directionForMapKeyName(input.key);
}

export function shouldSuppressDirectionButtonKey(input: {
  readonly key: string;
  readonly repeat: boolean;
}): boolean {
  return input.repeat && (input.key === "Enter" || input.key === " ");
}

export interface HeldMovementScheduler {
  setTimeout(callback: () => void, delayMs: number): unknown;
  clearTimeout(handle: unknown): void;
}

export interface HeldMovementControllerState {
  readonly available: boolean;
  readonly pending: boolean;
  readonly blocked: boolean;
}

export interface HeldMovementController {
  readonly activeDirection: MovePlayerDirection | null;
  setState(state: HeldMovementControllerState): void;
  start(direction: MovePlayerDirection): boolean;
  stop(): void;
  release(): void;
}

export interface HeldMovementControllerOptions {
  readonly submit: (direction: MovePlayerDirection) => boolean;
  readonly repeatDelayMs?: number;
  readonly scheduler?: HeldMovementScheduler;
}

const DEFAULT_HELD_MOVEMENT_DELAY_MS = 180;

const defaultHeldMovementScheduler: HeldMovementScheduler = {
  setTimeout(callback, delayMs) {
    return setTimeout(callback, delayMs);
  },
  clearTimeout(handle) {
    clearTimeout(handle as ReturnType<typeof setTimeout>);
  },
};

/**
 * Keeps a held input as a bounded sequence of existing discrete commands.
 * The caller must update `pending` after every command and authoritative settle;
 * this controller never predicts a position or owns a gameplay clock.
 */
export function createHeldMovementController(options: HeldMovementControllerOptions): HeldMovementController {
  const scheduler = options.scheduler ?? defaultHeldMovementScheduler;
  const repeatDelayMs = Number.isSafeInteger(options.repeatDelayMs)
    ? Math.max(DEFAULT_HELD_MOVEMENT_DELAY_MS, options.repeatDelayMs as number)
    : DEFAULT_HELD_MOVEMENT_DELAY_MS;

  let currentState: HeldMovementControllerState = {
    available: false,
    pending: false,
    blocked: false,
  };
  let active: MovePlayerDirection | null = null;
  let timer: unknown = null;
  let awaitingSettle = false;

  const clearTimer = () => {
    if (timer !== null) {
      scheduler.clearTimeout(timer);
      timer = null;
    }
  };

  const schedule = () => {
    if (active === null
      || !currentState.available
      || currentState.pending
      || currentState.blocked
      || awaitingSettle
      || timer !== null) {
      return;
    }
    timer = scheduler.setTimeout(() => {
      timer = null;
      if (active === null
        || !currentState.available
        || currentState.pending
        || currentState.blocked
        || awaitingSettle) {
        return;
      }
      const direction = active;
      if (!options.submit(direction)) {
        active = null;
        awaitingSettle = false;
        return;
      }
      awaitingSettle = true;
    }, repeatDelayMs);
  };

  const stop = () => {
    clearTimer();
    active = null;
    awaitingSettle = false;
  };

  return {
    get activeDirection() {
      return active;
    },
    setState(nextState) {
      const wasPending = currentState.pending;
      currentState = nextState;
      if (!currentState.available || currentState.blocked) {
        stop();
        return;
      }
      if (currentState.pending) {
        clearTimer();
        return;
      }
      if (wasPending) {
        awaitingSettle = false;
      }
      schedule();
    },
    start(direction) {
      if (!currentState.available || currentState.blocked) {
        return false;
      }
      if (active === direction) {
        return false;
      }
      clearTimer();
      active = direction;
      if (currentState.pending || awaitingSettle) {
        return true;
      }
      if (!options.submit(direction)) {
        active = null;
        return false;
      }
      awaitingSettle = true;
      return true;
    },
    stop,
    release: stop,
  };
}

export interface MovementAttempt {
  readonly token: number;
  readonly scope: string;
  readonly expectedRevision: number;
}

export type MovementGateOutcome =
  | { readonly kind: "ignored" }
  | { readonly kind: "request_resync" }
  | { readonly kind: "request_follow_up_resync" }
  | { readonly kind: "awaiting_command" }
  | { readonly kind: "reconciled" }
  | { readonly kind: "reconciled_unknown" }
  | { readonly kind: "stale" }
  | { readonly kind: "no_pending" };

export interface MovementReconciliationGate {
  readonly pending: boolean;
  readonly recoveryRequired: boolean;
  setScope(scope: string): void;
  begin(expectedRevision: number): MovementAttempt | null;
  acknowledge(attempt: MovementAttempt, requiredRevision: number): MovementGateOutcome;
  markUnknown(attempt: MovementAttempt): MovementGateOutcome;
  reject(attempt: MovementAttempt): boolean;
  acceptSnapshot(revision: number): MovementGateOutcome;
  invalidate(): void;
}

interface PendingMovement {
  attempt: MovementAttempt;
  requiredRevision: number | null;
  mode: "submitting" | "acknowledged" | "unknown";
  followUpUsed: boolean;
}

export function createMovementReconciliationGate(): MovementReconciliationGate {
  let sequence = 0;
  let scope: string | null = null;
  let current: PendingMovement | null = null;

  const matches = (attempt: MovementAttempt): boolean => Boolean(current)
    && current?.attempt.token === attempt.token
    && current.attempt.scope === attempt.scope
    && scope === attempt.scope;

  return {
    get pending() {
      return current !== null;
    },
    get recoveryRequired() {
      return current?.mode === "unknown";
    },
    setScope(nextScope) {
      if (scope !== null && scope !== nextScope) {
        current = null;
      }
      scope = nextScope;
    },
    begin(expectedRevision) {
      if (scope === null || current !== null || !Number.isSafeInteger(expectedRevision) || expectedRevision < 0) {
        return null;
      }
      const attempt = Object.freeze({ token: ++sequence, scope, expectedRevision });
      current = { attempt, requiredRevision: null, mode: "submitting", followUpUsed: false };
      return attempt;
    },
    acknowledge(attempt, requiredRevision) {
      if (!matches(attempt) || !Number.isSafeInteger(requiredRevision) || requiredRevision <= attempt.expectedRevision) {
        return { kind: "ignored" };
      }
      current = { attempt, requiredRevision, mode: "acknowledged", followUpUsed: false };
      return { kind: "request_resync" };
    },
    markUnknown(attempt) {
      if (!matches(attempt)) {
        return { kind: "ignored" };
      }
      current = { attempt, requiredRevision: null, mode: "unknown", followUpUsed: false };
      return { kind: "request_resync" };
    },
    reject(attempt) {
      if (!matches(attempt)) {
        return false;
      }
      current = null;
      return true;
    },
    acceptSnapshot(revision) {
      if (!current || !Number.isSafeInteger(revision) || revision < 0) {
        return { kind: "no_pending" };
      }
      if (current.mode === "submitting") {
        return { kind: "awaiting_command" };
      }
      if (current.mode === "unknown") {
        current = null;
        return { kind: "reconciled_unknown" };
      }
      if (current.requiredRevision !== null && revision >= current.requiredRevision) {
        current = null;
        return { kind: "reconciled" };
      }
      if (!current.followUpUsed) {
        current.followUpUsed = true;
        return { kind: "request_follow_up_resync" };
      }
      return { kind: "stale" };
    },
    invalidate() {
      sequence += 1;
      scope = null;
      current = null;
    },
  };
}
