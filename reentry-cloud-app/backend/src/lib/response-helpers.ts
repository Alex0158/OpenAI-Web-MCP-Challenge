import type { ApiSuccess, ApiError } from "@saas/shared";

/**
 * Standardized API response bodies.
 *
 * These build the body only — the route sets the status:
 *   res.status(409).json(err("CONFLICT", "..."))
 *
 * The return types come from the shared package, so a change to the envelope
 * becomes a compile error on both sides at once instead of a silent mismatch.
 */

export function ok<T>(data: T, message?: string): ApiSuccess<T> {
  return { success: true, data, ...(message ? { message } : {}) };
}

export function err(error: string, message: string): ApiError {
  return { success: false, error, message };
}
