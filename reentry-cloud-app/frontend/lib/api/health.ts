/**
 * Health API - Backend health check
 * Each function returns exactly what the backend sends, unwrapped.
 */

import { apiFetch, ApiResponse } from "./client";

export type HealthStatus = {
  isOk: string;
  uptime: number;
};

export async function fetchHealthStatus(): Promise<ApiResponse<HealthStatus>> {
  return apiFetch<HealthStatus>("/health");
}
