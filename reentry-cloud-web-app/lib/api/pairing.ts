import { getBackendUrl } from "./client";

export type PairingSession = {
  type: "webmcp.connector_account_pairing";
  protocol_version: "0.1";
  pairing_id: string;
  pairing_code: string;
  expires_at: string;
};

export type ConnectorSummary = {
  connector_id: string;
  pairing_id: string;
  device_name: string;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
};

export type ConnectorList = {
  type: "webmcp.connector_account_connectors";
  protocol_version: "0.1";
  connectors: ConnectorSummary[];
};

function isPairingSession(value: unknown): value is PairingSession {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    candidate.type === "webmcp.connector_account_pairing" &&
    candidate.protocol_version === "0.1" &&
    typeof candidate.pairing_id === "string" &&
    /^[A-F0-9]{8}$/.test(String(candidate.pairing_code)) &&
    typeof candidate.expires_at === "string" &&
    Number.isFinite(Date.parse(candidate.expires_at))
  );
}

function isConnectorList(value: unknown): value is ConnectorList {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  if (
    candidate.type !== "webmcp.connector_account_connectors" ||
    candidate.protocol_version !== "0.1" ||
    !Array.isArray(candidate.connectors)
  ) {
    return false;
  }

  return candidate.connectors.every((connector) => {
    if (!connector || typeof connector !== "object") return false;

    const item = connector as Record<string, unknown>;
    return (
      typeof item.connector_id === "string" &&
      typeof item.pairing_id === "string" &&
      typeof item.device_name === "string" &&
      typeof item.created_at === "string" &&
      Number.isFinite(Date.parse(item.created_at)) &&
      typeof item.expires_at === "string" &&
      Number.isFinite(Date.parse(item.expires_at)) &&
      (item.revoked_at === null ||
        (typeof item.revoked_at === "string" && Number.isFinite(Date.parse(item.revoked_at))))
    );
  });
}

function readErrorCode(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;

  const error = (value as Record<string, unknown>).error;
  if (!error || typeof error !== "object") return null;

  const code = (error as Record<string, unknown>).code;
  return typeof code === "string" ? code : null;
}

/**
 * The v0.1 protocol returns its canonical pairing envelope directly rather
 * than the legacy `{ success, data }` application envelope used by auth.
 */
export async function createPairingSession(): Promise<PairingSession> {
  const response = await fetch(`${getBackendUrl()}/v0.1/account/pairing-sessions`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: "{}",
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const code = readErrorCode(payload);
    if (response.status === 401 || code === "session_required") {
      throw new Error("Sign in to pair a Mac.");
    }
    throw new Error("Unable to create a pairing code. Please try again.");
  }

  if (!isPairingSession(payload)) {
    throw new Error("The pairing service returned an invalid response.");
  }

  return payload;
}

export async function listConnectors(): Promise<ConnectorList> {
  const response = await fetch(`${getBackendUrl()}/v0.1/account/connectors`, {
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const code = readErrorCode(payload);
    if (response.status === 401 || code === "session_required") {
      throw new Error("Sign in to view paired Macs.");
    }
    throw new Error("Unable to load paired Macs. Please try again.");
  }

  if (!isConnectorList(payload)) {
    throw new Error("The pairing service returned an invalid device list.");
  }

  return payload;
}
