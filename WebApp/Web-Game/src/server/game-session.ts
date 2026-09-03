import type { IncomingMessage } from "node:http";

import { verifyToken as clerkVerifyToken } from "@clerk/backend";

import type { PersistenceStore } from "./persistence/store";
import type { RealtimeSessionResolver } from "./realtime-wire";
import type { ServerBoundRealtimeContext } from "./realtime-snapshot";

export const CLERK_SESSION_COOKIE_NAME = "__session";
const MAX_SESSION_TOKEN_BYTES = 4096;

export interface GameSessionContext extends ServerBoundRealtimeContext {
  readonly shelterId: string;
  readonly providerSubject: string;
}

export type GameSessionRejectReason =
  | "MISSING_SESSION"
  | "MALFORMED_SESSION"
  | "INVALID_SESSION"
  | "IDENTITY_NOT_ALLOWED"
  | "STORE_NOT_READY"
  | "IDENTITY_SCOPE_INVALID";

export type GameSessionResolution =
  | { readonly kind: "resolved"; readonly context: GameSessionContext }
  | { readonly kind: "rejected"; readonly reason: GameSessionRejectReason };

export interface GameSessionResolver extends RealtimeSessionResolver {
  resolveGameSession(request: IncomingMessage): Promise<GameSessionResolution>;
}

export interface GameIdentityBinding {
  readonly providerSubject: string;
  readonly playerId: string;
}

export interface ClerkTokenClaims {
  readonly sub?: unknown;
}

export type ClerkTokenVerifier = (token: string) => Promise<ClerkTokenClaims>;

export interface ClerkGameSessionResolverOptions {
  readonly store: PersistenceStore;
  readonly worldId: string;
  readonly subjects:
    | Readonly<{
        readonly playerA: string | null;
        readonly playerB: string | null;
      }>
    | readonly GameIdentityBinding[];
  readonly secretKey?: string | null;
  readonly jwtKey?: string | null;
  readonly authorizedParties?: readonly string[];
  readonly verifyToken?: ClerkTokenVerifier;
}

export class GameSessionConfigurationError extends Error {
  readonly code = "GAME_AUTH_CONFIG_INVALID" as const;

  constructor() {
    super("GAME_AUTH_CONFIG_INVALID");
    this.name = "GameSessionConfigurationError";
  }
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function subjectBindings(
  subjects: ClerkGameSessionResolverOptions["subjects"],
): readonly GameIdentityBinding[] {
  const bindings = "playerA" in subjects
    ? [
        { providerSubject: subjects.playerA, playerId: "player-a" },
        { providerSubject: subjects.playerB, playerId: "player-b" },
      ]
    : subjects.map((binding) => ({ providerSubject: binding.providerSubject, playerId: binding.playerId }));
  const normalized = bindings.map((binding) => ({
    providerSubject: typeof binding.providerSubject === "string" ? binding.providerSubject.trim() : "",
    playerId: typeof binding.playerId === "string" ? binding.playerId.trim() : "",
  }));
  if (
    normalized.length !== 2
    || normalized.some((binding) => !nonEmpty(binding.providerSubject) || !nonEmpty(binding.playerId))
    || new Set(normalized.map((binding) => binding.providerSubject)).size !== normalized.length
    || new Set(normalized.map((binding) => binding.playerId)).size !== normalized.length
  ) {
    throw new GameSessionConfigurationError();
  }
  return Object.freeze(normalized.map((binding) => Object.freeze({
    providerSubject: binding.providerSubject,
    playerId: binding.playerId,
  })));
}

function sessionCookie(request: Pick<IncomingMessage, "headers">):
  | { readonly kind: "absent" }
  | { readonly kind: "token"; readonly value: string }
  | { readonly kind: "malformed" } {
  const header = request.headers.cookie;
  if (header === undefined) {
    return { kind: "absent" };
  }
  if (Array.isArray(header)) {
    return { kind: "malformed" };
  }
  let token: string | null = null;
  for (const segment of header.split(";")) {
    const trimmed = segment.trim();
    if (trimmed === "") {
      continue;
    }
    const separator = trimmed.indexOf("=");
    if (separator <= 0) {
      continue;
    }
    const name = trimmed.slice(0, separator).trim();
    if (name !== CLERK_SESSION_COOKIE_NAME) {
      continue;
    }
    if (token !== null) {
      return { kind: "malformed" };
    }
    const value = trimmed.slice(separator + 1).trim();
    if (!nonEmpty(value) || /[\s;]/.test(value) || Buffer.byteLength(value) > MAX_SESSION_TOKEN_BYTES) {
      return { kind: "malformed" };
    }
    token = value;
  }
  return token === null ? { kind: "absent" } : { kind: "token", value: token };
}

function authorizationToken(request: Pick<IncomingMessage, "headers">):
  | { readonly kind: "absent" }
  | { readonly kind: "token"; readonly value: string }
  | { readonly kind: "malformed" } {
  const header = request.headers.authorization;
  if (header === undefined) {
    return { kind: "absent" };
  }
  if (Array.isArray(header)) {
    return { kind: "malformed" };
  }
  const match = /^Bearer\s+([^\s]+)$/i.exec(header.trim());
  if (!match || Buffer.byteLength(match[1] as string) > MAX_SESSION_TOKEN_BYTES) {
    return { kind: "malformed" };
  }
  return { kind: "token", value: match[1] as string };
}

function tokenFromRequest(request: IncomingMessage):
  | { readonly kind: "token"; readonly value: string }
  | { readonly kind: "rejected"; readonly reason: "MISSING_SESSION" | "MALFORMED_SESSION" } {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(request.url ?? "/", "http://sleepless-kingdom.local");
  } catch {
    return { kind: "rejected", reason: "MALFORMED_SESSION" };
  }
  // Credentials in a URL can leak through browser history, proxy logs, and
  // WebSocket diagnostics. The resolver accepts only a cookie or Bearer header.
  for (const key of ["token", "session", "__session"]) {
    if (parsedUrl.searchParams.has(key)) {
      return { kind: "rejected", reason: "MALFORMED_SESSION" };
    }
  }

  const cookie = sessionCookie(request);
  const authorization = authorizationToken(request);
  if (cookie.kind === "malformed" || authorization.kind === "malformed") {
    return { kind: "rejected", reason: "MALFORMED_SESSION" };
  }
  if (cookie.kind === "absent" && authorization.kind === "absent") {
    return { kind: "rejected", reason: "MISSING_SESSION" };
  }
  if (cookie.kind === "token" && authorization.kind === "token" && cookie.value !== authorization.value) {
    return { kind: "rejected", reason: "MALFORMED_SESSION" };
  }
  if (cookie.kind === "token") {
    return { kind: "token", value: cookie.value };
  }
  if (authorization.kind === "token") {
    return { kind: "token", value: authorization.value };
  }
  return { kind: "rejected", reason: "MISSING_SESSION" };
}

function defaultVerifier(options: ClerkGameSessionResolverOptions): ClerkTokenVerifier {
  if (!nonEmpty(options.secretKey) && !nonEmpty(options.jwtKey)) {
    throw new GameSessionConfigurationError();
  }
  const verifyOptions = {
    ...(options.secretKey ? { secretKey: options.secretKey } : {}),
    ...(options.jwtKey ? { jwtKey: options.jwtKey } : {}),
    ...(options.authorizedParties && options.authorizedParties.length > 0
      ? { authorizedParties: [...options.authorizedParties] }
      : {}),
  };
  return async (token) => clerkVerifyToken(token, verifyOptions);
}

function resolvedContext(
  store: PersistenceStore,
  worldId: string,
  providerSubject: string,
  playerId: string,
): GameSessionResolution {
  if (!store.isOpen) {
    return { kind: "rejected", reason: "STORE_NOT_READY" };
  }
  const world = store.getWorld(worldId);
  if (!world) {
    return { kind: "rejected", reason: "IDENTITY_SCOPE_INVALID" };
  }
  const player = store.getPlayer(worldId, playerId);
  const shelter = store.listShelters(worldId).find((candidate) => candidate.playerId === playerId);
  if (!world || !player || !shelter || shelter.worldId !== worldId || player.worldId !== worldId || player.binding.trim() === "") {
    return { kind: "rejected", reason: "IDENTITY_SCOPE_INVALID" };
  }
  return {
    kind: "resolved",
    context: Object.freeze({
      worldId,
      playerId,
      shelterId: shelter.shelterId,
      binding: player.binding,
      providerSubject,
    }),
  };
}

export function createClerkGameSessionResolver(options: ClerkGameSessionResolverOptions): GameSessionResolver {
  if (!options.store || !nonEmpty(options.worldId)) {
    throw new GameSessionConfigurationError();
  }
  const bindings = subjectBindings(options.subjects);
  const bySubject = new Map(bindings.map((binding) => [binding.providerSubject, binding.playerId]));
  const verify = options.verifyToken ?? defaultVerifier(options);

  return {
    async resolveGameSession(request): Promise<GameSessionResolution> {
      const token = tokenFromRequest(request);
      if (token.kind === "rejected") {
        return token;
      }
      let claims: ClerkTokenClaims;
      try {
        claims = await verify(token.value);
      } catch {
        return { kind: "rejected", reason: "INVALID_SESSION" };
      }
      const providerSubject = claims && typeof claims.sub === "string" ? claims.sub.trim() : "";
      if (providerSubject === "") {
        return { kind: "rejected", reason: "INVALID_SESSION" };
      }
      const playerId = bySubject.get(providerSubject);
      if (!playerId) {
        return { kind: "rejected", reason: "IDENTITY_NOT_ALLOWED" };
      }
      return resolvedContext(options.store, options.worldId, providerSubject, playerId);
    },

    async resolve(request): Promise<ServerBoundRealtimeContext | null> {
      const result = await this.resolveGameSession(request);
      return result.kind === "resolved" ? result.context : null;
    },
  };
}
