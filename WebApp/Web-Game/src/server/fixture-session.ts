import type { IncomingMessage } from "node:http";

import { DEFAULT_CONTRACT_VERSION } from "./persistence/types";
import { PersistenceError, PersistenceStore } from "./persistence/store";
import {
  G2_FIXTURE_ID,
  createAndPersistG2Fixture,
  loadPersistedG2Fixture,
  type WorldFixtureInstance,
} from "./world-fixture";
import type { RealtimeSessionResolver } from "./realtime-wire";
import type { ServerBoundRealtimeContext } from "./realtime-snapshot";

export const LOCAL_FIXTURE_COOKIE_NAME = "sk_local_fixture";
export const LOCAL_FIXTURE_HANDLE_A = "fixture-v1-alpha";
export const LOCAL_FIXTURE_HANDLE_B = "fixture-v1-beta";

export interface LocalFixtureBootstrapPayload {
  readonly capability: "supported";
  readonly contractVersion: string;
  readonly worldId: string;
  readonly playerId: string;
  readonly shelterId: string;
}

export interface LocalFixtureSessionContext extends ServerBoundRealtimeContext {
  readonly shelterId: string;
}

export interface LocalFixtureRequest {
  readonly headers: { readonly cookie?: string | string[] };
  readonly url?: string;
}

export type LocalFixtureResolution =
  | {
      readonly kind: "resolved";
      readonly handle: string;
      readonly context: LocalFixtureSessionContext;
      readonly issueCookie: boolean;
    }
  | {
      readonly kind: "rejected";
      readonly reason: "MISSING_SESSION" | "UNKNOWN_SESSION" | "MALFORMED_SESSION";
    };

export type LocalFixtureErrorCode =
  | "FIXTURE_STORE_NOT_READY"
  | "FIXTURE_STORE_NOT_EMPTY"
  | "FIXTURE_RECOVERY_REQUIRED"
  | "FIXTURE_SCOPE_INVALID"
  | "FIXTURE_CONTRACT_UNSUPPORTED";

export class LocalFixtureError extends Error {
  readonly code: LocalFixtureErrorCode;

  constructor(code: LocalFixtureErrorCode, options?: { cause?: unknown }) {
    super(code, options);
    this.name = "LocalFixtureError";
    this.code = code;
  }
}

interface FixtureRequestHeaders {
  readonly cookie?: string | string[];
}

function requestCookieHeader(request: { readonly headers?: FixtureRequestHeaders }): string | null {
  const cookie = request.headers?.cookie;
  if (Array.isArray(cookie)) {
    return null;
  }
  return typeof cookie === "string" ? cookie : "";
}

function parseFixtureHandle(request: { readonly headers?: FixtureRequestHeaders }):
  | { readonly kind: "absent" }
  | { readonly kind: "handle"; readonly value: string }
  | { readonly kind: "malformed" } {
  const header = requestCookieHeader(request);
  if (header === null) {
    return { kind: "malformed" };
  }
  let found: string | null = null;
  for (const segment of header.split(";")) {
    const trimmed = segment.trim();
    if (trimmed === "") {
      continue;
    }
    const separator = trimmed.indexOf("=");
    if (separator < 0) {
      if (trimmed === LOCAL_FIXTURE_COOKIE_NAME) {
        return { kind: "malformed" };
      }
      continue;
    }
    const name = trimmed.slice(0, separator).trim();
    if (name !== LOCAL_FIXTURE_COOKIE_NAME) {
      continue;
    }
    if (found !== null) {
      return { kind: "malformed" };
    }
    const value = trimmed.slice(separator + 1).trim();
    if (value === "" || /[\s;]/.test(value)) {
      return { kind: "malformed" };
    }
    found = value;
  }
  return found === null ? { kind: "absent" } : { kind: "handle", value: found };
}

function baseContext(context: LocalFixtureSessionContext): ServerBoundRealtimeContext {
  return {
    worldId: context.worldId,
    playerId: context.playerId,
    binding: context.binding,
  };
}

function assertFixtureScope(store: PersistenceStore, fixture: WorldFixtureInstance): LocalFixtureSessionContext[] {
  const players = store.listPlayers(fixture.worldId);
  const shelters = store.listShelters(fixture.worldId);
  const contexts: LocalFixtureSessionContext[] = [];
  for (const playerId of ["player-a", "player-b"] as const) {
    const player = players.find((candidate) => candidate.playerId === playerId);
    const manifest = fixture.manifest.players.find((candidate) => candidate.playerId === playerId);
    if (!player || !manifest || player.worldId !== fixture.worldId || player.binding.trim() === "") {
      throw new LocalFixtureError("FIXTURE_SCOPE_INVALID");
    }
    const shelter = shelters.find((candidate) => candidate.shelterId === manifest.shelterId && candidate.playerId === playerId);
    if (!shelter) {
      throw new LocalFixtureError("FIXTURE_SCOPE_INVALID");
    }
    contexts.push({
      worldId: fixture.worldId,
      playerId,
      binding: player.binding,
      shelterId: shelter.shelterId,
    });
  }
  if (players.length !== 2 || shelters.length !== 2) {
    throw new LocalFixtureError("FIXTURE_SCOPE_INVALID");
  }
  return contexts;
}

export class LocalFixtureSessionResolver implements RealtimeSessionResolver {
  private readonly byHandle: ReadonlyMap<string, LocalFixtureSessionContext>;

  constructor(contexts: readonly LocalFixtureSessionContext[]) {
    const playerA = contexts.find((context) => context.playerId === "player-a");
    const playerB = contexts.find((context) => context.playerId === "player-b");
    if (!playerA || !playerB || playerA.worldId !== playerB.worldId || playerA.shelterId === playerB.shelterId) {
      throw new LocalFixtureError("FIXTURE_SCOPE_INVALID");
    }
    this.byHandle = new Map([
      [LOCAL_FIXTURE_HANDLE_A, Object.freeze({ ...playerA })],
      [LOCAL_FIXTURE_HANDLE_B, Object.freeze({ ...playerB })],
    ]);
  }

  resolve(request: IncomingMessage | LocalFixtureRequest): ServerBoundRealtimeContext | null {
    const result = this.resolveExistingSession(request);
    return result.kind === "resolved" ? baseContext(result.context) : null;
  }

  resolveExistingSession(request: IncomingMessage | LocalFixtureRequest): LocalFixtureResolution {
    const parsed = parseFixtureHandle(request);
    if (parsed.kind === "malformed") {
      return { kind: "rejected", reason: "MALFORMED_SESSION" };
    }
    if (parsed.kind === "absent") {
      return { kind: "rejected", reason: "MISSING_SESSION" };
    }
    const context = this.byHandle.get(parsed.value);
    if (!context) {
      return { kind: "rejected", reason: "UNKNOWN_SESSION" };
    }
    return { kind: "resolved", handle: parsed.value, context, issueCookie: false };
  }

  resolveBootstrap(request: IncomingMessage | LocalFixtureRequest): LocalFixtureResolution {
    const parsed = parseFixtureHandle(request);
    if (parsed.kind === "malformed") {
      return { kind: "rejected", reason: "MALFORMED_SESSION" };
    }
    if (parsed.kind === "absent") {
      const context = this.byHandle.get(LOCAL_FIXTURE_HANDLE_A);
      if (!context) {
        return { kind: "rejected", reason: "UNKNOWN_SESSION" };
      }
      return { kind: "resolved", handle: LOCAL_FIXTURE_HANDLE_A, context, issueCookie: true };
    }
    const context = this.byHandle.get(parsed.value);
    if (!context) {
      return { kind: "rejected", reason: "UNKNOWN_SESSION" };
    }
    return { kind: "resolved", handle: parsed.value, context, issueCookie: false };
  }
}

export interface PreparedLocalFixture {
  readonly fixture: WorldFixtureInstance;
  readonly resolver: LocalFixtureSessionResolver;
}

export function prepareLocalFixture(store: PersistenceStore): PreparedLocalFixture {
  if (!store.isOpen) {
    throw new LocalFixtureError("FIXTURE_STORE_NOT_READY");
  }
  if (store.contractVersion !== DEFAULT_CONTRACT_VERSION) {
    throw new LocalFixtureError("FIXTURE_CONTRACT_UNSUPPORTED");
  }

  let fixture: WorldFixtureInstance;
  try {
    const worldIds = store.listWorldIds();
    if (worldIds.length === 0) {
      fixture = createAndPersistG2Fixture(store, {
        worldId: G2_FIXTURE_ID,
        playerBindings: {
          "player-a": "fixture-binding-a",
          "player-b": "fixture-binding-b",
        },
      });
    } else if (worldIds.length === 1 && worldIds[0] === G2_FIXTURE_ID) {
      fixture = loadPersistedG2Fixture(store, G2_FIXTURE_ID);
    } else {
      throw new LocalFixtureError("FIXTURE_STORE_NOT_EMPTY");
    }
  } catch (error) {
    if (error instanceof LocalFixtureError) {
      throw error;
    }
    if (error instanceof PersistenceError && (error.code === "RECOVERY_REQUIRED" || error.code === "WORLD_NOT_FOUND")) {
      throw new LocalFixtureError("FIXTURE_RECOVERY_REQUIRED", { cause: error });
    }
    throw new LocalFixtureError("FIXTURE_SCOPE_INVALID", { cause: error });
  }

  const contexts = assertFixtureScope(store, fixture);
  return { fixture, resolver: new LocalFixtureSessionResolver(contexts) };
}

export function toLocalFixtureBootstrapPayload(
  context: LocalFixtureSessionContext,
  contractVersion = DEFAULT_CONTRACT_VERSION,
): LocalFixtureBootstrapPayload {
  return {
    capability: "supported",
    contractVersion,
    worldId: context.worldId,
    playerId: context.playerId,
    shelterId: context.shelterId,
  };
}

export function stripLocalFixtureContext(context: LocalFixtureSessionContext): ServerBoundRealtimeContext {
  return baseContext(context);
}
