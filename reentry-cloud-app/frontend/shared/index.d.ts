/**
 * Types shared by the backend and the frontend.
 *
 * This package contains DECLARATIONS ONLY — no runtime code, so there is
 * nothing to build. Both sides must import from it with `import type`, which
 * TypeScript erases at compile time, so nothing is required at runtime either.
 *
 * If you ever need a runtime value here (a const, an enum, a function), this
 * package has to gain a build step. Prefer keeping values on one side and
 * sharing only their type.
 */

// ---------------------------------------------------------------- API envelope

/** A successful response. Built by ok() on the backend. */
export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

/** A failed response. Built by err() on the backend. */
export type ApiError = {
  success: false;
  error: string;
  message: string;
};

/**
 * What the wire actually carries: one shape or the other, never both.
 *
 * Because this is a union, TypeScript refuses to let you read `.data` until
 * you have checked `success` — which is the whole point. A single object type
 * claiming `data` is always present makes reading it on an error response a
 * runtime `undefined` that the compiler allows.
 */
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ---------------------------------------------------------------- domain types

/**
 * The user as the API exposes it. This is the single definition — the backend
 * returns exactly this shape and the frontend consumes exactly this shape.
 *
 * User and developer accounts intentionally expose the same minimal public
 * projection while remaining separate account types in the database.
 */
export type PublicUser = {
  id: string;
  email: string;
};

export type PublicDeveloper = {
  id: string;
  email: string;
};
