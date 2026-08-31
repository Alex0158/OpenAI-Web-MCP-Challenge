const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const MAX_OPAQUE_TOKEN_BYTES = 4 * 1_024;

export function requireExactInput(value, allowedFields, requiredFields, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw validation("receiver_input_invalid", `${label} must be an object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw validation("receiver_input_invalid", `${label} must be a plain object`);
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key === "symbol") {
      throw validation("receiver_input_invalid", `${label} cannot contain symbol properties`);
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor?.enumerable || !("value" in descriptor)) {
      throw validation(
        "receiver_input_invalid",
        `${label} must contain enumerable data properties only`,
      );
    }
  }
  const fields = Object.keys(value);
  if (fields.some((field) => !allowedFields.includes(field))) {
    throw validation("receiver_input_fields_invalid", `${label} contains an unsupported field`);
  }
  if (requiredFields.some((field) => !fields.includes(field))) {
    throw validation("receiver_input_fields_invalid", `${label} is missing a required field`);
  }
}

export function requireIdentifier(value, label) {
  if (
    typeof value !== "string" ||
    Buffer.byteLength(value, "utf8") > 160 ||
    !IDENTIFIER_PATTERN.test(value)
  ) {
    throw validation("receiver_identifier_invalid", `${label} is invalid`);
  }
  return value;
}

export function requireOpaqueToken(value, label, code) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    Buffer.byteLength(value, "utf8") > MAX_OPAQUE_TOKEN_BYTES ||
    /[^\x21-\x7e]/.test(value)
  ) {
    throw authorization(code, `${label} is invalid`);
  }
  return value;
}

export function requireTimestamp(value, label) {
  if (typeof value !== "string" || value.length > 27) {
    throw validation("receiver_timestamp_invalid", `${label} must be a canonical ISO-8601 timestamp`);
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) {
    throw validation("receiver_timestamp_invalid", `${label} must be a canonical ISO-8601 timestamp`);
  }
  return value;
}

export function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export class ReceiverValidationError extends Error {
  constructor(code, message, statusCode = 422) {
    super(message);
    this.name = "ReceiverValidationError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class ReceiverAuthorizationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ReceiverAuthorizationError";
    this.code = code;
    this.statusCode = 403;
  }
}

export class ReceiverConflictError extends Error {
  constructor(code, message, statusCode = 409) {
    super(message);
    this.name = "ReceiverConflictError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class ReceiverScopeError extends Error {
  constructor(code, message, statusCode = 422) {
    super(message);
    this.name = "ReceiverScopeError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class ReceiverNotFoundError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ReceiverNotFoundError";
    this.code = code;
    this.statusCode = 404;
  }
}

export class ReceiverInvariantError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ReceiverInvariantError";
    this.code = code;
    this.statusCode = 500;
  }
}

export function validation(code, message, statusCode) {
  return new ReceiverValidationError(code, message, statusCode);
}

export function authorization(code, message) {
  return new ReceiverAuthorizationError(code, message);
}

export function conflict(code, message, statusCode) {
  return new ReceiverConflictError(code, message, statusCode);
}

export function scope(code, message, statusCode) {
  return new ReceiverScopeError(code, message, statusCode);
}

export function notFound(code, message) {
  return new ReceiverNotFoundError(code, message);
}

export function invariant(code, message) {
  return new ReceiverInvariantError(code, message);
}
