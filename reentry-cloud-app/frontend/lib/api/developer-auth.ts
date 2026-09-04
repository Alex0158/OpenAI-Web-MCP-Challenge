import type { ApiSuccess, PublicDeveloper } from "@saas/shared";
import { apiFetch } from "./client";

export type Developer = PublicDeveloper;

const DEVELOPER_AUTH_PATH = "/v1/auth/developers";

export function registerDeveloper(
  email: string,
  password: string
): Promise<ApiSuccess<Developer>> {
  return apiFetch<Developer>(`${DEVELOPER_AUTH_PATH}/register`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function loginDeveloper(email: string, password: string): Promise<ApiSuccess<Developer>> {
  return apiFetch<Developer>(`${DEVELOPER_AUTH_PATH}/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function fetchCurrentDeveloper(): Promise<ApiSuccess<Developer>> {
  return apiFetch<Developer>(`${DEVELOPER_AUTH_PATH}/me`);
}

export function logoutDeveloper(): Promise<ApiSuccess<null>> {
  return apiFetch<null>(`${DEVELOPER_AUTH_PATH}/logout`, { method: "POST" });
}
