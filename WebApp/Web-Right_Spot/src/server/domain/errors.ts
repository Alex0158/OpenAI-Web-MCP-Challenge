export const DOMAIN_ERROR_CODES = [
  "FORBIDDEN",
  "NOT_FOUND",
  "VALIDATION_FAILED",
  "STALE_VERSION",
  "FIXTURE_GENERATION_CONFLICT",
  "INVALID_TRANSITION",
  "SLOT_UNAVAILABLE",
  "EXPIRED",
  "COMMAND_CONFLICT",
] as const;

export type DomainErrorCode = (typeof DOMAIN_ERROR_CODES)[number];

export class DomainError extends Error {
  readonly code: DomainErrorCode;

  constructor(code: DomainErrorCode, message: string) {
    super(message);
    this.name = "DomainError";
    this.code = code;
  }

  toJSON(): { code: DomainErrorCode; message: string } {
    return { code: this.code, message: this.message };
  }
}

export function domainError(code: DomainErrorCode, message: string): DomainError {
  return new DomainError(code, message);
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}
