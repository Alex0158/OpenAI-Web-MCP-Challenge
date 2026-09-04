import type { ApiResponse, ApiSuccess } from "@saas/shared";

const DEFAULT_BACKEND_URL = "http://localhost:4000";

export function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? DEFAULT_BACKEND_URL;
}

export function getSseUrl(path: string): string {
  return `${getBackendUrl()}${path}`;
}

export type { ApiResponse, ApiSuccess, ApiError } from "@saas/shared";

/**
 * Small fetch wrapper for the backend envelope. Sessions are single JWT
 * cookies, so a 401 is returned to the caller instead of triggering a refresh
 * flow or keeping a second token table.
 */
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiSuccess<T>> {
  const headers = new Headers(options?.headers);
  if (options?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${getBackendUrl()}${endpoint}`, {
    credentials: "include",
    ...options,
    headers,
  });

  let json: ApiResponse<T> | null = null;
  try {
    json = (await response.json()) as ApiResponse<T>;
  } catch {
    // Keep the status-based error below for non-JSON responses.
  }

  if (!response.ok) {
    const message =
      json && !json.success ? json.message || json.error : `Request failed: ${response.status}`;
    throw new Error(message);
  }

  if (!json) {
    throw new Error("Backend returned an empty response.");
  }

  if (!json.success) {
    throw new Error(json.message || json.error);
  }

  return json;
}
