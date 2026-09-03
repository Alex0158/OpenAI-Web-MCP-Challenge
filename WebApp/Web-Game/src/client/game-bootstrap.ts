import type { ClientSnapshot } from "../server/world-projection";

export interface GameBootstrapPayload {
  readonly capability: "supported";
  readonly contractVersion: string;
  readonly worldId: string;
  readonly playerId: string;
  readonly shelterId: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

/** Parse the server-derived scope shared by fixture and production admission. */
export function parseGameBootstrap(value: unknown): GameBootstrapPayload {
  if (!isRecord(value)
    || value.capability !== "supported"
    || !nonEmptyString(value.contractVersion)
    || !nonEmptyString(value.worldId)
    || !nonEmptyString(value.playerId)
    || !nonEmptyString(value.shelterId)) {
    throw new Error("GAME_BOOTSTRAP_INVALID");
  }
  const keys = Object.keys(value).sort();
  if (keys.join("\u0000") !== ["capability", "contractVersion", "playerId", "shelterId", "worldId"].join("\u0000")) {
    throw new Error("GAME_BOOTSTRAP_INVALID");
  }
  return {
    capability: "supported",
    contractVersion: value.contractVersion,
    worldId: value.worldId,
    playerId: value.playerId,
    shelterId: value.shelterId,
  };
}

export function snapshotMatchesBootstrapScope(
  snapshot: ClientSnapshot,
  bootstrap: GameBootstrapPayload,
): boolean {
  return snapshot.contractVersion === bootstrap.contractVersion
    && snapshot.worldId === bootstrap.worldId
    && snapshot.playerScope.playerId === bootstrap.playerId
    && snapshot.playerScope.shelterId === bootstrap.shelterId;
}

export function gameRealtimeUrl(location: Pick<Location, "protocol" | "host">): string {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${location.host}/realtime`;
}
