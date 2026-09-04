import type { ApiSuccess } from "@saas/shared";
import { apiFetch } from "./client";

export type DeveloperOrganization = {
  organization_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type DeveloperApiKey = {
  api_key_id: string;
  key_prefix: string;
  created_at: string;
  expires_at: string | null;
  revoked_at: string | null;
};

export type DeveloperApiKeyReveal = DeveloperApiKey & {
  api_key: string;
};

export type DeveloperEvent = {
  event_id: string;
  event_type: string;
  issuer_origin: string;
  workflow_id: string;
  received_at: string;
  delivery_state: string | null;
  delivery_attempt: number | null;
  acknowledged_at: string | null;
  terminal_reason: string | null;
};

const PORTAL_PATH = "/api/organizations";

export function listOrganizations(): Promise<
  ApiSuccess<{ organizations: DeveloperOrganization[] }>
> {
  return apiFetch<{ organizations: DeveloperOrganization[] }>(PORTAL_PATH);
}

export function createOrganization(
  name: string
): Promise<
  ApiSuccess<{
    organization: DeveloperOrganization;
    api_key: DeveloperApiKeyReveal;
  }>
> {
  return apiFetch(`${PORTAL_PATH}`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function listApiKeys(
  organizationId: string
): Promise<ApiSuccess<{ api_keys: DeveloperApiKey[] }>> {
  return apiFetch<{ api_keys: DeveloperApiKey[] }>(
    `${PORTAL_PATH}/${encodeURIComponent(organizationId)}/api-keys`
  );
}

export function createApiKey(
  organizationId: string
): Promise<ApiSuccess<{ api_key: DeveloperApiKeyReveal }>> {
  return apiFetch<{ api_key: DeveloperApiKeyReveal }>(
    `${PORTAL_PATH}/${encodeURIComponent(organizationId)}/api-keys`,
    { method: "POST", body: "{}" }
  );
}

export function revokeApiKey(
  organizationId: string,
  apiKeyId: string
): Promise<
  ApiSuccess<{
    api_key: DeveloperApiKey;
    duplicate: boolean;
  }>
> {
  return apiFetch(
    `${PORTAL_PATH}/${encodeURIComponent(organizationId)}/api-keys/${encodeURIComponent(apiKeyId)}/revoke`,
    { method: "POST", body: "{}" }
  );
}

export function listEventHistory(
  organizationId: string
): Promise<ApiSuccess<{ events: DeveloperEvent[] }>> {
  return apiFetch<{ events: DeveloperEvent[] }>(
    `${PORTAL_PATH}/${encodeURIComponent(organizationId)}/events`
  );
}
