export interface ConnectionAttemptGate {
  begin(): number | null;
  complete(attempt: number | null): void;
  isCurrent(attempt: number | null): boolean;
  invalidate(): void;
}

/**
 * Keeps asynchronous callbacks from an older page connection from mutating
 * the state owned by a newer reconnect attempt.
 */
export function createConnectionAttemptGate(): ConnectionAttemptGate {
  let currentAttempt = 0;
  let pending = false;

  return {
    begin() {
      if (pending) {
        return null;
      }
      currentAttempt += 1;
      pending = true;
      return currentAttempt;
    },
    complete(attempt: number | null) {
      if (attempt === currentAttempt) {
        pending = false;
      }
    },
    isCurrent(attempt: number | null) {
      return attempt !== null && attempt === currentAttempt;
    },
    invalidate() {
      currentAttempt += 1;
      pending = false;
    },
  };
}
