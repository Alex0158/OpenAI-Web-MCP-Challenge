"use client";

export type SessionRole = "tenant" | "agent";

export type SessionActor = {
  id: string;
  role: SessionRole;
};

export class SessionApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "SessionApiError";
    this.status = status;
    this.code = code;
  }
}

const SESSION_ENDPOINT = "/api/session";

export async function readSession(): Promise<SessionActor | null> {
  const response = await fetch(SESSION_ENDPOINT, {
    method: "GET",
    cache: "no-store",
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  const payload = await readPayload(response);

  if (response.status === 401) {
    return null;
  }
  if (!response.ok) {
    throw toApiError(response, payload);
  }

  return parseActor(response.status, payload);
}

export async function createSession(role: SessionRole): Promise<SessionActor> {
  if (role !== "tenant" && role !== "agent") {
    throw new SessionApiError(400, "VALIDATION_FAILED", "Choose one of the available demo roles");
  }

  const response = await fetch(SESSION_ENDPOINT, {
    method: "POST",
    cache: "no-store",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role }),
  });
  const payload = await readPayload(response);

  if (!response.ok) {
    throw toApiError(response, payload);
  }

  return parseActor(response.status, payload);
}

export async function deleteSession(): Promise<void> {
  const response = await fetch(SESSION_ENDPOINT, {
    method: "DELETE",
    cache: "no-store",
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  const payload = await readPayload(response);

  if (!response.ok) {
    throw toApiError(response, payload);
  }
  if (!isRecord(payload) || payload.ok !== true) {
    throw new SessionApiError(response.status, "INVALID_RESPONSE", "Session service returned an invalid response");
  }
}

async function readPayload(response: Response): Promise<unknown> {
  try {
    return await response.json() as unknown;
  } catch {
    throw new SessionApiError(response.status, "INVALID_RESPONSE", "Session service returned invalid data");
  }
}

function parseActor(status: number, payload: unknown): SessionActor {
  if (!isRecord(payload) || !isRecord(payload.actor)) {
    throw new SessionApiError(status, "INVALID_RESPONSE", "Session service returned an invalid actor");
  }

  const actor = payload.actor;
  if (
    typeof actor.id !== "string"
    || actor.id.length === 0
    || (actor.role !== "tenant" && actor.role !== "agent")
  ) {
    throw new SessionApiError(status, "INVALID_RESPONSE", "Session service returned an invalid actor");
  }

  return { id: actor.id, role: actor.role };
}

function toApiError(response: Response, payload: unknown): SessionApiError {
  if (isRecord(payload) && isRecord(payload.error)) {
    const error = payload.error;
    if (typeof error.code === "string" && typeof error.message === "string") {
      return new SessionApiError(response.status, error.code, error.message);
    }
  }

  return new SessionApiError(response.status, `HTTP_${response.status}`, "The demo session request failed");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
