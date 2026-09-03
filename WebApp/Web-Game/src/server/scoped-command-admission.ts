export interface ScopedCommandAdmissionToken {
  readonly scope: string;
  readonly token: number;
}

export interface ScopedCommandAdmission {
  begin(scope: string): ScopedCommandAdmissionToken | null;
  complete(token: ScopedCommandAdmissionToken): void;
}

export function createScopedCommandAdmission(): ScopedCommandAdmission {
  let sequence = 0;
  const active = new Map<string, number>();
  return {
    begin(scope) {
      if (scope.trim() === "" || active.has(scope)) {
        return null;
      }
      const token = ++sequence;
      active.set(scope, token);
      return Object.freeze({ scope, token });
    },
    complete(candidate) {
      if (active.get(candidate.scope) === candidate.token) {
        active.delete(candidate.scope);
      }
    },
  };
}
