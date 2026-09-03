import { createHash } from "node:crypto";

import { PersistenceError } from "./persistence/errors";
import { canonicalJson } from "./persistence/json";
import type {
  CreateMonsterInput,
  CreatePlayerInput,
  CreateResourceNodeInput,
  CreateShelterInput,
  CreateSoldierInput,
  CreateWorldFixtureInput,
  CreateWorldFixtureResult,
  WorldRecord,
  WorldSnapshotRecord,
} from "./persistence/types";

export const G2_FIXTURE_ID = "sleepless-mvp-01";
export const G2_FIXTURE_SEED = "sleepless-mvp-01";
export const G2_FIXTURE_GENERATION_VERSION = "g2-fixture-1";
export const G2_MAP_WIDTH = 128;
export const G2_MAP_HEIGHT = 128;
export const G2_CAMERA_WIDTH = 32;
export const G2_CAMERA_HEIGHT = 20;
export const G2_PROTECTED_START_RADIUS_TILES = 12;
export const G2_PROTECTED_START_DURATION_WORLD_SECONDS = 120;
export const G2_PLAYER_FOG_REVEAL_RADIUS_TILES = 4;

export interface Coordinate {
  x: number;
  y: number;
}

export interface FixturePlayerManifest {
  playerId: "player-a" | "player-b";
  shelterId: "shelter-a" | "shelter-b";
  soldierIds: string[];
}

export interface FixtureShelterManifest {
  shelterId: "shelter-a" | "shelter-b";
  playerId: "player-a" | "player-b";
  position: Coordinate;
}

export interface FixtureSoldierManifest {
  soldierId: string;
  shelterId: "shelter-a" | "shelter-b";
  lifecycle: "AT_SHELTER";
  role: null;
  tool: null;
  revision: 0;
}

export interface FixtureResourceNodeManifest {
  resourceNodeId: "node-wood-a" | "node-rock-a" | "node-wood-b" | "node-rock-b";
  ownerShelterId: "shelter-a" | "shelter-b";
  resourceType: "wood" | "rock";
  position: Coordinate;
  quantity: 20;
}

export interface FixtureMonsterManifest {
  monsterId: "monster-seeded-01";
  position: Coordinate;
  state: "PATROL";
  patrolRoute: Coordinate[];
}

export interface WorldFixtureManifest {
  fixtureId: typeof G2_FIXTURE_ID;
  worldSeed: typeof G2_FIXTURE_SEED;
  generationVersion: typeof G2_FIXTURE_GENERATION_VERSION;
  dimensions: { width: typeof G2_MAP_WIDTH; height: typeof G2_MAP_HEIGHT };
  cameraTarget: { width: typeof G2_CAMERA_WIDTH; height: typeof G2_CAMERA_HEIGHT };
  protectedStart: {
    radiusTiles: typeof G2_PROTECTED_START_RADIUS_TILES;
    durationWorldSeconds: typeof G2_PROTECTED_START_DURATION_WORLD_SECONDS;
  };
  walkability: { kind: "open-grid"; blockedCells: Coordinate[] };
  players: FixturePlayerManifest[];
  shelters: FixtureShelterManifest[];
  soldiers: FixtureSoldierManifest[];
  resourceNodes: FixtureResourceNodeManifest[];
  monster: FixtureMonsterManifest;
  mapFingerprint: string;
}

export interface WorldFixtureInstance {
  worldId: string;
  manifest: WorldFixtureManifest;
  world: WorldRecord;
  snapshot: WorldSnapshotRecord;
}

export interface FixturePlayerBindings {
  "player-a"?: string;
  "player-b"?: string;
}

export interface CreateG2FixtureOptions {
  worldId: string;
  worldTime?: number;
  playerBindings?: FixturePlayerBindings;
}

export interface WorldFixtureStore {
  createWorldFixture(input: CreateWorldFixtureInput): CreateWorldFixtureResult;
}

export interface PersistedWorldFixtureStore extends WorldFixtureStore {
  getWorld(worldId: string): WorldRecord | null;
  recoverWorld(worldId: string): { world: WorldRecord; snapshot: WorldSnapshotRecord | null };
}

function coordinate(x: number, y: number): Coordinate {
  return { x, y };
}

function coordinateKey(value: Coordinate): string {
  return `${value.x},${value.y}`;
}

function failFixture(): never {
  throw new PersistenceError("INVALID_INPUT");
}

function isCoordinate(value: unknown): value is Coordinate {
  if (!value || typeof value !== "object") {
    return false;
  }
  const point = value as Partial<Coordinate>;
  return Number.isInteger(point.x) && Number.isInteger(point.y);
}

function fingerprintPayload(manifest: Omit<WorldFixtureManifest, "mapFingerprint">): string {
  return canonicalJson(manifest);
}

function fingerprintFor(manifest: Omit<WorldFixtureManifest, "mapFingerprint">): string {
  return createHash("sha256").update(fingerprintPayload(manifest)).digest("hex");
}

function inBounds(point: Coordinate): boolean {
  return point.x >= 0 && point.x < G2_MAP_WIDTH && point.y >= 0 && point.y < G2_MAP_HEIGHT;
}

function exploredCellsAround(position: Coordinate): Coordinate[] {
  const cells: Coordinate[] = [];
  const radius = G2_PLAYER_FOG_REVEAL_RADIUS_TILES;
  for (let y = position.y - radius; y <= position.y + radius; y += 1) {
    for (let x = position.x - radius; x <= position.x + radius; x += 1) {
      const cell = coordinate(x, y);
      if (inBounds(cell) && Math.hypot(x - position.x, y - position.y) <= radius) {
        cells.push(cell);
      }
    }
  }
  return cells.sort((left, right) => left.y - right.y || left.x - right.x);
}

function assertManifestShape(manifest: WorldFixtureManifest): void {
  if (manifest.fixtureId !== G2_FIXTURE_ID || manifest.worldSeed !== G2_FIXTURE_SEED || manifest.generationVersion !== G2_FIXTURE_GENERATION_VERSION) {
    failFixture();
  }
  if (manifest.dimensions.width !== G2_MAP_WIDTH || manifest.dimensions.height !== G2_MAP_HEIGHT || manifest.cameraTarget.width !== G2_CAMERA_WIDTH || manifest.cameraTarget.height !== G2_CAMERA_HEIGHT) {
    failFixture();
  }
  if (manifest.protectedStart.radiusTiles !== G2_PROTECTED_START_RADIUS_TILES || manifest.protectedStart.durationWorldSeconds !== G2_PROTECTED_START_DURATION_WORLD_SECONDS) {
    failFixture();
  }
  if (manifest.walkability.kind !== "open-grid" || manifest.walkability.blockedCells.length !== 0) {
    failFixture();
  }
  if (manifest.players.length !== 2 || manifest.shelters.length !== 2 || manifest.soldiers.length !== 10 || manifest.resourceNodes.length !== 4) {
    failFixture();
  }
  if (manifest.monster.monsterId !== "monster-seeded-01" || manifest.monster.state !== "PATROL") {
    failFixture();
  }

  const shelters = new Map(manifest.shelters.map((shelter) => [shelter.shelterId, shelter]));
  const players = new Map(manifest.players.map((player) => [player.playerId, player]));
  const initialPositions = [
    ...manifest.shelters.map((shelter) => shelter.position),
    ...manifest.resourceNodes.map((node) => node.position),
    manifest.monster.position,
  ];
  if (initialPositions.some((point) => !isCoordinate(point) || !inBounds(point)) || new Set(initialPositions.map(coordinateKey)).size !== initialPositions.length) {
    failFixture();
  }
  if (Math.hypot(112 - 16, 64 - 64) < 80 || Math.abs(112 - 16) <= manifest.cameraTarget.width) {
    failFixture();
  }

  const expectedPlayers = new Set(["player-a", "player-b"]);
  const expectedShelters = new Set(["shelter-a", "shelter-b"]);
  if (new Set(manifest.players.map((player) => player.playerId)).size !== 2 || !manifest.players.every((player) => expectedPlayers.has(player.playerId) && expectedShelters.has(player.shelterId) && players.get(player.playerId) === player)) {
    failFixture();
  }
  if (!manifest.shelters.every((shelter) => expectedShelters.has(shelter.shelterId) && expectedPlayers.has(shelter.playerId) && players.get(shelter.playerId)?.shelterId === shelter.shelterId)) {
    failFixture();
  }

  for (const node of manifest.resourceNodes) {
    const shelter = shelters.get(node.ownerShelterId);
    if (!shelter || (node.resourceType !== "wood" && node.resourceType !== "rock") || node.quantity !== 20) {
      failFixture();
    }
    const distance = Math.hypot(node.position.x - shelter.position.x, node.position.y - shelter.position.y);
    if (distance < 14 || distance > 20 || distance <= G2_PROTECTED_START_RADIUS_TILES) {
      failFixture();
    }
  }
  if (!manifest.soldiers.every((soldier) => expectedShelters.has(soldier.shelterId) && soldier.lifecycle === "AT_SHELTER" && soldier.role === null && soldier.tool === null && soldier.revision === 0)) {
    failFixture();
  }
  for (const player of manifest.players) {
    if (player.soldierIds.length !== 5 || new Set(player.soldierIds).size !== 5 || !player.soldierIds.every((soldierId) => manifest.soldiers.some((soldier) => soldier.soldierId === soldierId && soldier.shelterId === player.shelterId))) {
      failFixture();
    }
  }
  if (!isCoordinate(manifest.monster.position) || !manifest.monster.patrolRoute.every((point) => isCoordinate(point) && inBounds(point)) || !manifest.monster.patrolRoute.some((point) => coordinateKey(point) === "34,64")) {
    failFixture();
  }
  const withoutFingerprint = { ...manifest } as Omit<WorldFixtureManifest, "mapFingerprint">;
  delete (withoutFingerprint as Partial<WorldFixtureManifest>).mapFingerprint;
  if (!/^[a-f0-9]{64}$/.test(manifest.mapFingerprint) || fingerprintFor(withoutFingerprint) !== manifest.mapFingerprint) {
    failFixture();
  }
}

export function createG2FixtureManifest(seed = G2_FIXTURE_SEED, generationVersion = G2_FIXTURE_GENERATION_VERSION): WorldFixtureManifest {
  if (seed !== G2_FIXTURE_SEED || generationVersion !== G2_FIXTURE_GENERATION_VERSION) {
    throw new PersistenceError("INVALID_INPUT");
  }

  const soldiers = Array.from({ length: 5 }, (_, index) => `soldier-a-${String(index + 1).padStart(2, "0")}`)
    .concat(Array.from({ length: 5 }, (_, index) => `soldier-b-${String(index + 1).padStart(2, "0")}`));
  const manifestWithoutFingerprint: Omit<WorldFixtureManifest, "mapFingerprint"> = {
    fixtureId: G2_FIXTURE_ID,
    worldSeed: G2_FIXTURE_SEED,
    generationVersion: G2_FIXTURE_GENERATION_VERSION,
    dimensions: { width: G2_MAP_WIDTH, height: G2_MAP_HEIGHT },
    cameraTarget: { width: G2_CAMERA_WIDTH, height: G2_CAMERA_HEIGHT },
    protectedStart: { radiusTiles: G2_PROTECTED_START_RADIUS_TILES, durationWorldSeconds: G2_PROTECTED_START_DURATION_WORLD_SECONDS },
    walkability: { kind: "open-grid", blockedCells: [] },
    players: [
      { playerId: "player-a", shelterId: "shelter-a", soldierIds: soldiers.slice(0, 5) },
      { playerId: "player-b", shelterId: "shelter-b", soldierIds: soldiers.slice(5) },
    ],
    shelters: [
      { shelterId: "shelter-a", playerId: "player-a", position: coordinate(16, 64) },
      { shelterId: "shelter-b", playerId: "player-b", position: coordinate(112, 64) },
    ],
    soldiers: soldiers.map((soldierId, index) => ({
      soldierId,
      shelterId: index < 5 ? "shelter-a" : "shelter-b",
      lifecycle: "AT_SHELTER",
      role: null,
      tool: null,
      revision: 0,
    })),
    resourceNodes: [
      { resourceNodeId: "node-wood-a", ownerShelterId: "shelter-a", resourceType: "wood", position: coordinate(30, 64), quantity: 20 },
      { resourceNodeId: "node-rock-a", ownerShelterId: "shelter-a", resourceType: "rock", position: coordinate(34, 64), quantity: 20 },
      { resourceNodeId: "node-wood-b", ownerShelterId: "shelter-b", resourceType: "wood", position: coordinate(98, 64), quantity: 20 },
      { resourceNodeId: "node-rock-b", ownerShelterId: "shelter-b", resourceType: "rock", position: coordinate(94, 64), quantity: 20 },
    ],
    monster: {
      monsterId: "monster-seeded-01",
      position: coordinate(48, 64),
      state: "PATROL",
      patrolRoute: [coordinate(48, 64), coordinate(48, 72), coordinate(40, 72), coordinate(40, 64), coordinate(34, 64), coordinate(40, 64)],
    },
  };
  const manifest: WorldFixtureManifest = { ...manifestWithoutFingerprint, mapFingerprint: fingerprintFor(manifestWithoutFingerprint) };
  validateG2FixtureManifest(manifest);
  return manifest;
}

export function validateG2FixtureManifest(manifest: WorldFixtureManifest): void {
  assertManifestShape(manifest);
}

function entityRevisions(manifest: WorldFixtureManifest): Record<string, number> {
  const revisions: Record<string, number> = {
    world: 0,
    ...Object.fromEntries(manifest.players.map((player) => [`player:${player.playerId}`, 0])),
    ...Object.fromEntries(manifest.shelters.map((shelter) => [`shelter:${shelter.shelterId}`, 0])),
    ...Object.fromEntries(manifest.soldiers.map((soldier) => [`soldier:${soldier.soldierId}`, 0])),
    ...Object.fromEntries(manifest.resourceNodes.map((node) => [`resource_node:${node.resourceNodeId}`, 0])),
    [`monster:${manifest.monster.monsterId}`]: 0,
  };
  return revisions;
}

export function createAndPersistG2Fixture(store: WorldFixtureStore, options: CreateG2FixtureOptions): WorldFixtureInstance {
  if (options.worldId.trim() === "") {
    throw new PersistenceError("INVALID_INPUT");
  }
  const worldTime = options.worldTime ?? 0;
  if (!Number.isSafeInteger(worldTime) || worldTime < 0) {
    throw new PersistenceError("INVALID_INPUT");
  }
  const manifest = createG2FixtureManifest();
  const shelterPositions = new Map(manifest.shelters.map((shelter) => [shelter.shelterId, shelter.position]));
  const players: CreatePlayerInput[] = manifest.players.map((player) => ({
    worldId: options.worldId,
    playerId: player.playerId,
    binding: options.playerBindings?.[player.playerId] ?? `${player.playerId}-binding`,
    position: shelterPositions.get(player.shelterId),
    exploredCells: exploredCellsAround(shelterPositions.get(player.shelterId) as Coordinate),
  }));
  if (players.some((player) => player.binding.trim() === "")) {
    throw new PersistenceError("INVALID_INPUT");
  }
  const shelters: CreateShelterInput[] = manifest.shelters.map((shelter) => ({
    worldId: options.worldId,
    shelterId: shelter.shelterId,
    playerId: shelter.playerId,
  }));
  const soldiers: CreateSoldierInput[] = manifest.soldiers.map((soldier) => ({
    worldId: options.worldId,
    soldierId: soldier.soldierId,
    shelterId: soldier.shelterId,
    state: "AT_SHELTER",
    role: soldier.role,
    tool: soldier.tool,
  }));
  const resourceNodes: CreateResourceNodeInput[] = manifest.resourceNodes.map((node) => ({
    worldId: options.worldId,
    resourceNodeId: node.resourceNodeId,
    resourceType: node.resourceType,
    quantity: node.quantity,
  }));
  const monsters: CreateMonsterInput[] = [{ worldId: options.worldId, monsterId: manifest.monster.monsterId, state: "PATROL" }];
  const input: CreateWorldFixtureInput = {
    world: {
      worldId: options.worldId,
      worldTime,
      worldSeed: manifest.worldSeed,
      generationVersion: manifest.generationVersion,
      mapFingerprint: manifest.mapFingerprint,
    },
    players,
    shelters,
    soldiers,
    resourceNodes,
    monsters,
    snapshot: {
      worldId: options.worldId,
      worldSnapshotId: `world-snapshot-${options.worldId}`,
      worldTime,
      lastWorldEventCursor: 0,
      entityRevisions: entityRevisions(manifest),
      state: { fixture: manifest },
    },
  };
  const persisted = store.createWorldFixture(input);
  return { worldId: options.worldId, manifest, world: persisted.world, snapshot: persisted.snapshot };
}

export function loadPersistedG2Fixture(store: PersistedWorldFixtureStore, worldId: string): WorldFixtureInstance {
  if (worldId.trim() === "") {
    throw new PersistenceError("INVALID_INPUT");
  }
  const world = store.getWorld(worldId);
  if (!world) {
    throw new PersistenceError("WORLD_NOT_FOUND");
  }
  const recovered = store.recoverWorld(worldId);
  if (!recovered.snapshot || recovered.snapshot.worldId !== worldId || recovered.snapshot.state === null || typeof recovered.snapshot.state !== "object") {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  const fixture = (recovered.snapshot.state as { fixture?: unknown }).fixture;
  try {
    validateG2FixtureManifest(fixture as WorldFixtureManifest);
  } catch (error) {
    throw new PersistenceError("RECOVERY_REQUIRED", { cause: error });
  }
  const manifest = fixture as WorldFixtureManifest;
  if (world.worldSeed !== manifest.worldSeed || world.generationVersion !== manifest.generationVersion || world.mapFingerprint !== manifest.mapFingerprint) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  return { worldId, manifest, world, snapshot: recovered.snapshot };
}
