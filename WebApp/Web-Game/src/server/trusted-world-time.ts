import { PersistenceError } from "./persistence/errors";
import { MAX_RECOVERY_WORLD_SECONDS } from "./world-clock";

export interface TrustedRecoveryTargetInput {
  completedWorldTime: number;
  serverTimeAnchorMs: number | null;
  nowServerTimeMs: number;
  maxRecoveryWorldSeconds?: number;
}

export interface TrustedRecoveryTarget {
  targetWorldTime: number;
  serverTimeAnchorMs: number;
  elapsedMs: number;
  recoveredWorldSeconds: number;
}

function assertWorldTime(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
}

function assertServerTime(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
}

/**
 * Convert one trusted server-time observation into the bounded integer target
 * accepted by WorldClock. This function never accepts client or browser time.
 */
export function deriveTrustedRecoveryTarget(input: TrustedRecoveryTargetInput): TrustedRecoveryTarget {
  assertWorldTime(input.completedWorldTime);
  assertServerTime(input.nowServerTimeMs);
  const maxRecoveryWorldSeconds = input.maxRecoveryWorldSeconds ?? MAX_RECOVERY_WORLD_SECONDS;
  if (!Number.isSafeInteger(maxRecoveryWorldSeconds) || maxRecoveryWorldSeconds <= 0) {
    throw new PersistenceError("INVALID_INPUT");
  }

  if (input.serverTimeAnchorMs === null) {
    return {
      targetWorldTime: input.completedWorldTime,
      serverTimeAnchorMs: input.nowServerTimeMs,
      elapsedMs: 0,
      recoveredWorldSeconds: 0,
    };
  }

  assertServerTime(input.serverTimeAnchorMs);
  if (input.nowServerTimeMs < input.serverTimeAnchorMs) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }

  const elapsedMs = input.nowServerTimeMs - input.serverTimeAnchorMs;
  const recoveredWorldSeconds = Math.floor(elapsedMs / 1000);
  if (recoveredWorldSeconds > maxRecoveryWorldSeconds) {
    throw new PersistenceError("RECOVERY_LIMIT_EXCEEDED");
  }
  const targetWorldTime = input.completedWorldTime + recoveredWorldSeconds;
  if (!Number.isSafeInteger(targetWorldTime)) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }

  return {
    targetWorldTime,
    serverTimeAnchorMs: input.nowServerTimeMs,
    elapsedMs,
    recoveredWorldSeconds,
  };
}
