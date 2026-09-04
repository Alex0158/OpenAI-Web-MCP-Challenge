import type { ApiSuccess, PublicUser } from "@saas/shared";
import { apiFetch } from "./client";

export type User = PublicUser;

const USER_AUTH_PATH = "/v1/auth/users";

export function registerUser(email: string, password: string): Promise<ApiSuccess<User>> {
  return apiFetch<User>(`${USER_AUTH_PATH}/register`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function loginUser(email: string, password: string): Promise<ApiSuccess<User>> {
  return apiFetch<User>(`${USER_AUTH_PATH}/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function fetchCurrentUser(): Promise<ApiSuccess<User>> {
  return apiFetch<User>(`${USER_AUTH_PATH}/me`);
}

export function logoutUser(): Promise<ApiSuccess<null>> {
  return apiFetch<null>(`${USER_AUTH_PATH}/logout`, { method: "POST" });
}
