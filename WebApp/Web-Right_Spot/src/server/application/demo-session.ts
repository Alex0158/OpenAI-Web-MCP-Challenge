import type { Actor, ActorRole } from "../domain/types";

export const DEMO_SESSION_COOKIE_NAME = "rightspot_demo_session";
export const DEMO_SESSION_MAX_AGE_SECONDS = 60 * 60;

const DEMO_SESSION_VALUES: Readonly<Record<ActorRole, string>> = {
  tenant: "rightspot-local-tenant-v1",
  agent: "rightspot-local-agent-v1",
};

const DEMO_ACTORS: Readonly<Record<ActorRole, Actor>> = {
  tenant: { id: "tenant-demo", role: "tenant" },
  agent: { id: "agent-demo", role: "agent" },
};

export type DemoSession = {
  actor: Actor;
  cookieValue: string;
};

export function issueDemoSession(role: ActorRole): DemoSession {
  return {
    actor: { ...DEMO_ACTORS[role] },
    cookieValue: DEMO_SESSION_VALUES[role],
  };
}

export function resolveDemoSession(cookieHeader: string | null): Actor | null {
  const value = readUniqueCookie(cookieHeader, DEMO_SESSION_COOKIE_NAME);
  if (!value) {
    return null;
  }

  for (const role of ["tenant", "agent"] as const) {
    if (value === DEMO_SESSION_VALUES[role]) {
      return { ...DEMO_ACTORS[role] };
    }
  }
  return null;
}

export function serializeDemoSessionCookie(cookieValue: string): string {
  return `${DEMO_SESSION_COOKIE_NAME}=${encodeURIComponent(cookieValue)}`
    + `; Max-Age=${DEMO_SESSION_MAX_AGE_SECONDS}; HttpOnly; SameSite=Lax; Path=/`;
}

export function serializeClearedDemoSessionCookie(): string {
  return `${DEMO_SESSION_COOKIE_NAME}=; Max-Age=0; HttpOnly; SameSite=Lax; Path=/`;
}

function readUniqueCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  const matches = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.startsWith(`${name}=`));
  if (matches.length !== 1) {
    return null;
  }

  try {
    return decodeURIComponent(matches[0]!.slice(name.length + 1));
  } catch {
    return null;
  }
}
