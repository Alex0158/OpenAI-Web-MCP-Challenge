import { createHash } from "node:crypto";

import { resolveMonsterGathererRound, resolveMonsterHunterRound } from "./combat-rules";
import { planOpenGridRouteAvoiding } from "./mission-service";
import { PersistenceError, type PersistenceStore } from "./persistence/store";
import type {
  CommitMonsterCombatRoundResult,
  CommitMonsterContactResult,
  DomainEventInput,
  EncounterRecord,
  GridCoordinate,
  HunterCombatRoundResolution,
  CombatRoundResolution,
  MissionRole,
  MissionTool,
  MissionRecord,
  MissionAttemptRecord,
  MonsterReissuePlan,
  SignalEligibilityInput,
} from "./persistence/types";
import type { WorldClockContext } from "./world-clock";
import { loadPersistedG2Fixture } from "./world-fixture";

export const G2_MONSTER_PATROL_SPEED_TILES_PER_WORLD_SECOND = 2;
export const G2_ENCOUNTER_CONTACT_RADIUS_TILES = 1;
export const G2_MONSTER_INITIAL_HP = 80;
export const G2_GATHERER_INITIAL_HP = 100;

export interface MonsterCombatSignalEligibilityContext {
  worldId: string;
  shelterId: string;
  soldierId: string;
}

/**
 * Server-owned, side-effect-free policy seam. A provider may return a grant
 * for an already authorized shelter, or undefined to keep the event
 * history-only. It must not reserve or consume a grant outside the combat
 * transaction because the provider is evaluated before persistence begins.
 */
export type MonsterCombatSignalEligibilityProvider = (
  context: MonsterCombatSignalEligibilityContext,
) => SignalEligibilityInput | undefined;

function samePoint(left: GridCoordinate, right: GridCoordinate): boolean {
  return left.x === right.x && left.y === right.y;
}

function validPoint(point: unknown): point is GridCoordinate {
  if (!point || typeof point !== "object" || Array.isArray(point)) {
    return false;
  }
  const candidate = point as { x?: unknown; y?: unknown };
  return Number.isSafeInteger(candidate.x) && Number.isSafeInteger(candidate.y);
}

function patrolPosition(route: readonly GridCoordinate[], worldTime: number, speed: number): GridCoordinate {
  if (!Number.isSafeInteger(worldTime) || worldTime < 0 || route.length < 2 || !route.every(validPoint)
    || !Number.isFinite(speed) || speed <= 0) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  const segments = route.map((from, index) => {
    const to = route[(index + 1) % route.length] as GridCoordinate;
    const length = Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
    if (length <= 0) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
    return { from, to, length };
  });
  const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0);
  if (!Number.isSafeInteger(totalLength) || totalLength <= 0) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  let remaining = (worldTime * speed) % totalLength;
  for (const segment of segments) {
    if (remaining <= segment.length) {
      const fraction = remaining / segment.length;
      return {
        x: segment.from.x + (segment.to.x - segment.from.x) * fraction,
        y: segment.from.y + (segment.to.y - segment.from.y) * fraction,
      };
    }
    remaining -= segment.length;
  }
  return { ...(route[0] as GridCoordinate) };
}

function distance(left: GridCoordinate, right: GridCoordinate): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function encounterIdFor(worldId: string, missionAttemptId: string, monsterId: string): string {
  const digest = createHash("sha256").update(`${worldId}\u0000${missionAttemptId}\u0000${monsterId}`).digest("hex").slice(0, 24);
  return `encounter-${digest}`;
}

function contactKey(attemptId: string, worldTime: number): string {
  return `monster-contact:${attemptId}:${worldTime}`;
}

function combatKey(encounterId: string, roundNumber: number): string {
  return `monster-combat:${encounterId}:round:${roundNumber}`;
}

function reissueAttemptIdFor(missionAttemptId: string): string {
  const digest = createHash("sha256").update(`${missionAttemptId}\u0000monster-reissue:1`).digest("hex").slice(0, 24);
  return `mission-attempt-reissue-${digest}`;
}

function gathererReissuePlan(options: {
  mission: MissionRecord;
  attempt: MissionAttemptRecord;
  dangerCell: GridCoordinate;
  fixture: ReturnType<typeof loadPersistedG2Fixture>;
}): MonsterReissuePlan {
  if (options.mission.monsterReissueBudget === 0) {
    return {
      outcome: "WAITING_REVIEW",
      dangerCell: { ...options.dangerCell },
      reason: "REPEATED_MONSTER_DEATH",
      newMissionAttemptId: null,
      route: null,
    };
  }
  if (!options.attempt.homeAnchor || !options.attempt.route) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  const route = planOpenGridRouteAvoiding(
    options.attempt.homeAnchor,
    options.attempt.route.target,
    options.fixture.manifest.mapFingerprint,
    {
      width: options.fixture.manifest.dimensions.width,
      height: options.fixture.manifest.dimensions.height,
      blockedCells: options.fixture.manifest.walkability.blockedCells,
      dangerCell: options.dangerCell,
    },
  );
  if (!route) {
    return {
      outcome: "WAITING_REVIEW",
      dangerCell: { ...options.dangerCell },
      reason: "NO_SAFE_REISSUE_ROUTE",
      newMissionAttemptId: null,
      route: null,
    };
  }
  return {
    outcome: "REISSUED",
    dangerCell: { ...options.dangerCell },
    reason: null,
    newMissionAttemptId: reissueAttemptIdFor(options.attempt.missionAttemptId),
    route,
  };
}

function validateBoundary(context: Pick<WorldClockContext, "worldId" | "worldTime">): void {
  if (typeof context.worldId !== "string" || context.worldId.trim() === ""
    || !Number.isSafeInteger(context.worldTime) || context.worldTime < 0) {
    throw new PersistenceError("INVALID_INPUT");
  }
}

function visibility(shelterId: string): { kind: "shelter"; shelterId: string } {
  return { kind: "shelter", shelterId };
}

function contactEvents(options: {
  encounterId: string;
  missionId: string;
  missionAttemptId: string;
  soldierId: string;
  monsterId: string;
  shelterId: string;
  engagementPosition: GridCoordinate;
  worldTime: number;
  key: string;
  role: MissionRole;
  tool: MissionTool;
}): DomainEventInput[] {
  const base = {
    encounterId: options.encounterId,
    missionId: options.missionId,
    missionAttemptId: options.missionAttemptId,
    soldierId: options.soldierId,
    monsterId: options.monsterId,
  };
  const roleFields = options.role === "HUNTER" ? { role: options.role, tool: options.tool } : {};
  return [
    {
      eventId: `encounter-observed:${options.encounterId}`,
      eventType: "ActorObserved",
      causationId: options.key,
      idempotencyKey: options.key,
      aggregateType: "encounter",
      aggregateId: options.encounterId,
      visibilityScope: visibility(options.shelterId),
      typedPayload: {
        ...base,
        ...roleFields,
        observerType: "MONSTER",
        engagementPosition: options.engagementPosition,
        contactRadiusTiles: G2_ENCOUNTER_CONTACT_RADIUS_TILES,
        worldTime: options.worldTime,
      },
    },
    {
      eventId: `encounter-locked:${options.encounterId}`,
      eventType: "EncounterLocked",
      causationId: options.key,
      idempotencyKey: options.key,
      aggregateType: "encounter",
      aggregateId: options.encounterId,
      visibilityScope: visibility(options.shelterId),
      typedPayload: {
        ...base,
        ...roleFields,
        state: "LOCKED",
        soldierHp: G2_GATHERER_INITIAL_HP,
        monsterHp: G2_MONSTER_INITIAL_HP,
        roundNumber: 0,
        nextDueWorldTime: options.worldTime,
        engagementPosition: options.engagementPosition,
        worldTime: options.worldTime,
      },
    },
  ];
}

function combatEvents(options: {
  encounter: EncounterRecord;
  missionId: string;
  missionAttemptId: string;
  soldierId: string;
  monsterId: string;
  targetId: string;
  shelterId: string;
  key: string;
  worldTime: number;
  role: MissionRole;
  tool: MissionTool;
  resolution: CombatRoundResolution | HunterCombatRoundResolution;
  cargo: ReturnType<PersistenceStore["listCargo"]>;
  reissue?: MonsterReissuePlan;
}): DomainEventInput[] {
  const { encounter, resolution } = options;
  const base = {
    encounterId: encounter.encounterId,
    missionId: options.missionId,
    missionAttemptId: options.missionAttemptId,
    soldierId: options.soldierId,
    monsterId: options.monsterId,
  };
  const roleFields = options.role === "HUNTER" ? { role: options.role, tool: options.tool } : {};
  const events: DomainEventInput[] = [
    {
      eventId: `combat-round:${encounter.encounterId}:${resolution.roundNumber}`,
      eventType: "BattleRoundResolved",
      causationId: options.key,
      idempotencyKey: options.key,
      aggregateType: "encounter",
      aggregateId: encounter.encounterId,
      visibilityScope: visibility(options.shelterId),
      typedPayload: { ...base, ...roleFields, round: resolution, worldTime: options.worldTime },
    },
  ];
  if (options.role === "HUNTER" && resolution.terminalCause === "MONSTER_DEFEATED") {
    events.push(
      {
        eventId: `encounter-resolved:${encounter.encounterId}`,
        eventType: "EncounterResolved",
        causationId: options.key,
        idempotencyKey: options.key,
        aggregateType: "encounter",
        aggregateId: encounter.encounterId,
        visibilityScope: visibility(options.shelterId),
        typedPayload: { ...base, ...roleFields, state: "RESOLVED", terminalCause: "MONSTER_DEFEATED", worldTime: options.worldTime },
      },
      {
        eventId: `monster-defeated:${encounter.encounterId}`,
        eventType: "MonsterDefeated",
        causationId: options.key,
        idempotencyKey: options.key,
        aggregateType: "monster",
        aggregateId: options.monsterId,
        visibilityScope: visibility(options.shelterId),
        typedPayload: { ...base, ...roleFields, state: "DEAD", reason: "HUNTER_VICTORY", worldTime: options.worldTime },
      },
    );
  } else if (resolution.terminalCause === "GATHERER_LOST") {
    const items = options.cargo.map((item) => ({
      cargoId: item.cargoId,
      sourceNodeId: item.sourceNodeId,
      resourceType: item.resourceType,
      quantity: item.quantity,
      capacityUsed: item.capacityUsed,
      acquiredWorldTime: item.acquiredWorldTime,
    }));
    const totalQuantity = options.cargo.reduce((total, item) => total + item.quantity, 0);
    const totalCapacityUsed = options.cargo.reduce((total, item) => total + item.capacityUsed, 0);
    events.push(
      {
        eventId: `encounter-resolved:${encounter.encounterId}`,
        eventType: "EncounterResolved",
        causationId: options.key,
        idempotencyKey: options.key,
        aggregateType: "encounter",
        aggregateId: encounter.encounterId,
        visibilityScope: visibility(options.shelterId),
        typedPayload: { ...base, state: "RESOLVED", terminalCause: "GATHERER_LOST", worldTime: options.worldTime },
      },
      {
        eventId: `cargo-lost-to-monster:${encounter.encounterId}`,
        eventType: "CargoLostToMonster",
        causationId: options.key,
        idempotencyKey: options.key,
        aggregateType: "mission",
        aggregateId: options.missionId,
        visibilityScope: visibility(options.shelterId),
        typedPayload: { ...base, items, totalQuantity, totalCapacityUsed, reason: "MONSTER_KILLED_SOLDIER", worldTime: options.worldTime },
      },
      {
        eventId: `soldier-died:${encounter.encounterId}`,
        eventType: "SoldierDied",
        causationId: options.key,
        idempotencyKey: options.key,
        aggregateType: "soldier",
        aggregateId: options.soldierId,
        visibilityScope: visibility(options.shelterId),
        typedPayload: { ...base, cause: "MONSTER", cargoQuantityLost: totalQuantity, worldTime: options.worldTime },
      },
      {
        eventId: `soldier-respawned:${encounter.encounterId}`,
        eventType: "SoldierRespawned",
        causationId: options.key,
        idempotencyKey: options.key,
        aggregateType: "soldier",
        aggregateId: options.soldierId,
        visibilityScope: visibility(options.shelterId),
        typedPayload: { ...base, shelterId: options.shelterId, cause: "MONSTER", worldTime: options.worldTime },
      },
    );
    if (options.reissue) {
      events.push({
        eventId: `mission-reissued:${options.missionAttemptId}`,
        eventType: "MissionReissued",
        causationId: options.key,
        idempotencyKey: options.key,
        aggregateType: "mission",
        aggregateId: options.missionId,
        visibilityScope: visibility(options.shelterId),
        typedPayload: {
          missionId: options.missionId,
          missionAttemptId: options.missionAttemptId,
          soldierId: options.soldierId,
          role: options.role,
          tool: options.tool,
          targetId: options.targetId,
          previousAttemptId: options.missionAttemptId,
          newAttemptId: options.reissue.newMissionAttemptId,
          budgetBefore: options.reissue.outcome === "REISSUED" || options.reissue.reason === "NO_SAFE_REISSUE_ROUTE" ? 1 : 0,
          budgetAfter: 0,
          dangerCell: options.reissue.dangerCell,
          route: options.reissue.route,
          outcome: options.reissue.outcome,
          reason: options.reissue.reason,
          worldTime: options.worldTime,
        },
      });
    }
  }
  return events;
}

export class MonsterCombatService {
  private readonly store: PersistenceStore;
  private readonly signalEligibilityProvider?: MonsterCombatSignalEligibilityProvider;

  constructor(options: {
    store: PersistenceStore;
    signalEligibilityProvider?: MonsterCombatSignalEligibilityProvider;
  }) {
    this.store = options.store;
    this.signalEligibilityProvider = options.signalEligibilityProvider;
  }

  advanceContactAtBoundary(
    context: Pick<WorldClockContext, "worldId" | "worldTime">,
    options: { injectFailureAt?: "after_state" | "after_events" | "before_commit" } = {},
  ): CommitMonsterContactResult[] {
    validateBoundary(context);
    const world = this.store.getWorld(context.worldId);
    if (!world) {
      throw new PersistenceError("WORLD_NOT_FOUND");
    }
    if (context.worldTime < world.worldTime) {
      throw new PersistenceError("WORLD_TIME_REGRESSION");
    }
    if (context.worldTime > world.worldTime + 1) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
    const fixture = loadPersistedG2Fixture(this.store, context.worldId);
    const monsterManifest = fixture.manifest.monster;
    const monster = this.store.listMonsters(context.worldId).find((candidate) => candidate.monsterId === monsterManifest.monsterId);
    if (!monster || monster.state.toUpperCase() !== "PATROL") {
      return [];
    }
    const monsterPosition = patrolPosition(monsterManifest.patrolRoute, context.worldTime, G2_MONSTER_PATROL_SPEED_TILES_PER_WORLD_SECOND);
    const activeAttempts = this.store.listMissionAttempts(context.worldId)
      .filter((attempt) => ["ACTIVE", "active"].includes(attempt.state)
        && attempt.phase === "WORKING"
        && (attempt.role === "GATHERER" || attempt.role === "HUNTER"));
    const activeMonsterEncounter = (): boolean => this.store.listEncounters(context.worldId)
      .some((encounter) => encounter.monsterId === monster.monsterId
        && (encounter.state === "LOCKED" || encounter.state === "RESOLVING"));
    const results: CommitMonsterContactResult[] = [];
    for (const attempt of activeAttempts) {
      const mission = this.store.getMission(context.worldId, attempt.missionId);
      const soldier = mission
        ? this.store.listSoldiers(context.worldId).find((candidate) => candidate.soldierId === mission.soldierId)
        : undefined;
      if (!mission || !soldier || !attempt.route || attempt.targetId === null
        || (attempt.role === "HUNTER" && attempt.targetId !== monster.monsterId)) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      if ((attempt.role !== "GATHERER" && attempt.role !== "HUNTER") || attempt.tool === null) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      const linkedFields = [attempt.encounterId, attempt.encounterStatus, mission.encounterId, mission.encounterStatus];
      if (linkedFields.some((value) => value !== null)) {
        const linkedEncounterId = mission.encounterId;
        const coherent = linkedEncounterId !== null
          && linkedEncounterId === attempt.encounterId
          && (mission.encounterStatus === "LOCKED" || mission.encounterStatus === "RESOLVING")
          && mission.encounterStatus === attempt.encounterStatus;
        if (!coherent || linkedEncounterId === null || !this.store.getEncounter(context.worldId, linkedEncounterId)) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        continue;
      }
      const soldierPosition = attempt.route.target;
      if (distance(monsterPosition, soldierPosition) > G2_ENCOUNTER_CONTACT_RADIUS_TILES) {
        continue;
      }
      // Resolve multiple same-cell candidates in durable mission order. Once
      // the monster is claimed, later candidates wait for a future encounter
      // boundary rather than failing the whole world tick.
      if (activeMonsterEncounter()) {
        continue;
      }
      const encounterId = encounterIdFor(context.worldId, attempt.missionAttemptId, monster.monsterId);
      const key = contactKey(attempt.missionAttemptId, context.worldTime);
      results.push(this.store.commitMonsterContact({
        worldId: context.worldId,
        worldTime: context.worldTime,
        idempotency: {
          key,
          binding: `worker:${context.worldId}`,
          request: {
            kind: "monster_contact",
            encounterId,
            missionId: mission.missionId,
            missionAttemptId: attempt.missionAttemptId,
            soldierId: soldier.soldierId,
            monsterId: monster.monsterId,
            worldTime: context.worldTime,
          },
        },
        encounterId,
        missionId: mission.missionId,
        expectedMissionRevision: mission.revision,
        missionAttemptId: attempt.missionAttemptId,
        expectedMissionAttemptRevision: attempt.revision,
        soldierId: soldier.soldierId,
        expectedSoldierRevision: soldier.revision,
        monsterId: monster.monsterId,
        expectedMonsterRevision: monster.revision,
        engagementPosition: monsterPosition,
        events: contactEvents({
          encounterId,
          missionId: mission.missionId,
          missionAttemptId: attempt.missionAttemptId,
          soldierId: soldier.soldierId,
          monsterId: monster.monsterId,
          shelterId: soldier.shelterId,
          engagementPosition: monsterPosition,
          worldTime: context.worldTime,
          key,
          role: attempt.role,
          tool: attempt.tool,
        }),
        injectFailureAt: options.injectFailureAt,
      }));
    }
    return results;
  }

  advanceCombatAtBoundary(
    context: Pick<WorldClockContext, "worldId" | "worldTime">,
    options: { injectFailureAt?: "after_cargo" | "after_state" | "after_events" | "after_signal" | "before_commit" } = {},
  ): CommitMonsterCombatRoundResult[] {
    validateBoundary(context);
    const world = this.store.getWorld(context.worldId);
    if (!world) {
      throw new PersistenceError("WORLD_NOT_FOUND");
    }
    if (context.worldTime < world.worldTime) {
      throw new PersistenceError("WORLD_TIME_REGRESSION");
    }
    if (context.worldTime > world.worldTime + 1) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
    const fixture = loadPersistedG2Fixture(this.store, context.worldId);
    const candidates = this.store.listEncounters(context.worldId)
      .filter((encounter) => (encounter.state === "LOCKED" || encounter.state === "RESOLVING")
        && encounter.nextDueWorldTime !== null && encounter.nextDueWorldTime <= context.worldTime)
      .sort((left, right) => (left.nextDueWorldTime as number) - (right.nextDueWorldTime as number) || left.encounterId.localeCompare(right.encounterId));
    const results: CommitMonsterCombatRoundResult[] = [];
    for (const candidate of candidates) {
      const encounter = this.store.getEncounter(context.worldId, candidate.encounterId);
      if (!encounter || encounter.state === "RESOLVED" || encounter.nextDueWorldTime === null || encounter.nextDueWorldTime > context.worldTime) {
        continue;
      }
      const mission = this.store.getMission(context.worldId, encounter.missionId);
      const attempt = this.store.getMissionAttempt(context.worldId, encounter.missionAttemptId);
      const soldier = this.store.listSoldiers(context.worldId).find((item) => item.soldierId === encounter.soldierId);
      const monster = this.store.listMonsters(context.worldId).find((item) => item.monsterId === encounter.monsterId);
      if (!mission || !attempt || !soldier || !monster
        || mission.encounterId !== encounter.encounterId || mission.encounterStatus !== encounter.state
        || attempt.encounterId !== encounter.encounterId || attempt.encounterStatus !== encounter.state
        || mission.activeAttemptId !== attempt.missionAttemptId || mission.soldierId !== soldier.soldierId
        || soldier.state !== "FIELD"
        || (mission.role !== "GATHERER" && mission.role !== "HUNTER")
        || attempt.role !== mission.role
        || soldier.role !== mission.role
        || monster.state.toUpperCase() !== "PATROL") {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      if (mission.role !== "GATHERER" && mission.role !== "HUNTER") {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      if (mission.tool === null || attempt.tool !== mission.tool || soldier.tool !== mission.tool) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      const targetId = attempt.targetId;
      if (targetId === null) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      const role = mission.role;
      const tool = mission.tool;
      const resolution = mission.role === "HUNTER"
        ? resolveMonsterHunterRound({
          roundNumber: encounter.roundNumber + 1,
          hunterHp: encounter.soldierHp,
          monsterHp: encounter.monsterHp,
        })
        : resolveMonsterGathererRound({
          roundNumber: encounter.roundNumber + 1,
          gathererHp: encounter.soldierHp,
          monsterHp: encounter.monsterHp,
        });
      const key = combatKey(encounter.encounterId, resolution.roundNumber);
      const cargo = mission.role === "GATHERER" && resolution.terminalCause === "GATHERER_LOST"
        ? this.store.listCargo(context.worldId, soldier.soldierId)
        : [];
      const reissue = mission.role === "GATHERER" && resolution.terminalCause === "GATHERER_LOST"
        ? gathererReissuePlan({
          mission,
          attempt,
          dangerCell: {
            x: Math.round(encounter.engagementPosition.x),
            y: Math.round(encounter.engagementPosition.y),
          },
          fixture,
        })
        : undefined;
      const signalEligibility = mission.role === "GATHERER" && resolution.terminalCause === "GATHERER_LOST"
        ? this.signalEligibilityProvider?.({
          worldId: context.worldId,
          shelterId: soldier.shelterId,
          soldierId: soldier.soldierId,
        })
        : undefined;
      if (signalEligibility && signalEligibility.shelterId !== soldier.shelterId) {
        throw new PersistenceError("OWNERSHIP_DENIED");
      }
      results.push(this.store.commitMonsterCombatRound({
        worldId: context.worldId,
        worldTime: context.worldTime,
        idempotency: {
          key,
          binding: `worker:${context.worldId}`,
          request: {
            kind: "monster_combat_round",
            encounterId: encounter.encounterId,
            missionId: encounter.missionId,
            missionAttemptId: encounter.missionAttemptId,
            soldierId: encounter.soldierId,
            monsterId: encounter.monsterId,
            roundNumber: resolution.roundNumber,
            worldTime: context.worldTime,
          },
        },
        encounterId: encounter.encounterId,
        expectedEncounterRevision: encounter.revision,
        missionId: encounter.missionId,
        expectedMissionRevision: mission.revision,
        missionAttemptId: encounter.missionAttemptId,
        expectedMissionAttemptRevision: attempt.revision,
        soldierId: encounter.soldierId,
        expectedSoldierRevision: soldier.revision,
        monsterId: encounter.monsterId,
        expectedMonsterRevision: monster.revision,
        resolution,
        reissue,
        signalEligibility,
        events: combatEvents({
          encounter,
          missionId: encounter.missionId,
          missionAttemptId: encounter.missionAttemptId,
          soldierId: encounter.soldierId,
          monsterId: encounter.monsterId,
          targetId,
          shelterId: soldier.shelterId,
          key,
          worldTime: context.worldTime,
          role,
          tool,
          resolution,
          cargo,
          reissue,
        }),
        injectFailureAt: options.injectFailureAt,
      }));
    }
    return results;
  }
}

export { patrolPosition, resolveMonsterGathererRound, resolveMonsterHunterRound };
