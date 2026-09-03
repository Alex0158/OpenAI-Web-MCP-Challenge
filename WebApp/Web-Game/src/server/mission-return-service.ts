import { PersistenceError, type PersistenceStore } from "./persistence/store";
import type {
  CommitMissionHomeArrivalResult,
  GridCoordinate,
  MissionAttemptRecord,
  MissionRoutePlan,
  MissionRoutePosition,
} from "./persistence/types";
import { deriveRoutePosition, SOLDIER_MOVE_SPEED_TILES_PER_WORLD_SECOND } from "./mission-travel-service";
import type { WorldClockContext } from "./world-clock";

export interface MissionReturnBoundary extends Pick<WorldClockContext, "worldId" | "worldTime"> {
  elapsedMs?: number;
}

export interface MissionReturnPositionQuery {
  worldId: string;
  missionAttemptId: string;
  worldTime: number;
}

function samePoint(left: GridCoordinate, right: GridCoordinate): boolean {
  return left.x === right.x && left.y === right.y;
}

export function reverseMissionRoute(attempt: MissionAttemptRecord): MissionRoutePlan {
  const route = attempt.route;
  const homeAnchor = attempt.homeAnchor;
  if (!route || !homeAnchor || !samePoint(route.source, homeAnchor)) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  if (!Number.isSafeInteger(attempt.startWorldTime) || attempt.startWorldTime < 0
    || !Number.isSafeInteger(attempt.lastTransitionWorldTime) || attempt.lastTransitionWorldTime < attempt.startWorldTime) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }

  // The outbound route is immutable. The transition timestamp is the only
  // durable cursor: for an ordinary return it is the target-arrival time; for
  // a recall it is the point at which the recall was accepted. Re-project the
  // outbound route at that timestamp and reverse only the travelled prefix.
  const outboundPosition = deriveRoutePosition(route, attempt.startWorldTime, attempt.lastTransitionWorldTime);
  if (!Number.isSafeInteger(outboundPosition.progressTiles)
    || !Number.isSafeInteger(outboundPosition.waypointIndex)) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  const sourceIndex = outboundPosition.arrived ? route.waypoints.length - 1 : outboundPosition.waypointIndex;
  const currentWaypoint = route.waypoints[sourceIndex];
  if (!currentWaypoint || outboundPosition.x !== currentWaypoint.x || outboundPosition.y !== currentWaypoint.y) {
    // A transition may only be persisted at a whole-tile boundary. A
    // fractional cursor cannot be represented by the immutable waypoint plan
    // and therefore requires recovery instead of silently teleporting.
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  const outboundPrefix = route.waypoints.slice(0, sourceIndex + 1);
  const reversed: MissionRoutePlan = {
    source: { ...currentWaypoint },
    target: { ...route.source },
    walkabilityVersion: route.walkabilityVersion,
    waypoints: outboundPrefix.slice().reverse().map((point) => ({ ...point })),
    estimatedTravelWorldSeconds: Math.ceil((outboundPrefix.length - 1) / SOLDIER_MOVE_SPEED_TILES_PER_WORLD_SECOND),
    status: "PLANNED",
  };
  // deriveRoutePosition owns the route shape and adjacent-step invariant. A
  // zero-time projection validates the reversed plan without persisting it.
  deriveRoutePosition(reversed, 0, 0);
  if (!samePoint(reversed.target, homeAnchor)) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  return reversed;
}

function validateBoundary(context: MissionReturnBoundary): void {
  if (typeof context.worldId !== "string" || context.worldId.trim() === ""
    || !Number.isSafeInteger(context.worldTime) || context.worldTime < 0) {
    throw new PersistenceError("INVALID_INPUT");
  }
}

function validatePositionQuery(query: MissionReturnPositionQuery): void {
  if (typeof query.worldId !== "string" || query.worldId.trim() === ""
    || typeof query.missionAttemptId !== "string" || query.missionAttemptId.trim() === ""
    || !Number.isSafeInteger(query.worldTime) || query.worldTime < 0) {
    throw new PersistenceError("INVALID_INPUT");
  }
}

function dueWorldTime(attempt: MissionAttemptRecord): number {
  if (!Number.isSafeInteger(attempt.lastTransitionWorldTime) || attempt.lastTransitionWorldTime < 0
    || !attempt.route) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  // The persisted route remains the immutable outbound plan. A recall may
  // start its return at an intermediate waypoint, so the due boundary is
  // derived from the same reverse prefix used for position projection.
  const returnRoute = reverseMissionRoute(attempt);
  const due = attempt.lastTransitionWorldTime + returnRoute.estimatedTravelWorldSeconds;
  if (!Number.isSafeInteger(due)) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  return due;
}

function activeReturningAttempt(
  store: PersistenceStore,
  worldId: string,
  attempt: MissionAttemptRecord,
): {
  attempt: MissionAttemptRecord;
  mission: NonNullable<ReturnType<PersistenceStore["getMission"]>>;
  soldier: ReturnType<PersistenceStore["listSoldiers"]>[number];
} {
  const mission = store.getMission(worldId, attempt.missionId);
  const soldier = mission
    ? store.listSoldiers(worldId).find((candidate) => candidate.soldierId === mission.soldierId)
    : undefined;
  if (!mission || !soldier
    || mission.activeAttemptId !== attempt.missionAttemptId
    || !["ACTIVE", "active"].includes(mission.state)
    || !["ACTIVE", "active"].includes(attempt.state)
    || mission.phase !== "RETURNING"
    || attempt.phase !== "RETURNING"
    || (mission.role !== "GATHERER" && mission.role !== "HUNTER")
    || attempt.role !== mission.role
    || soldier.state !== "FIELD"
    || soldier.role !== mission.role
    || mission.tool !== attempt.tool
    || attempt.tool !== soldier.tool
    || attempt.targetId === null
    || mission.targetId !== attempt.targetId
    || mission.nextDueWorldTime !== null
    || attempt.nextDueWorldTime !== null) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }
  return { attempt, mission, soldier };
}

function homeArrivalWorkId(missionAttemptId: string, returnDueWorldTime: number): string {
  return `mission-return-home:${missionAttemptId}:${returnDueWorldTime}`;
}

function homeArrivalEventId(missionAttemptId: string, returnDueWorldTime: number): string {
  return `mission-home-reached:${missionAttemptId}:${returnDueWorldTime}`;
}

/**
 * Advances only the CP-10 return movement and home-crossing boundary. The
 * reversed route is a projection of the immutable outbound plan; persistence
 * owns the final phase transition and event exactly once.
 */
export class MissionReturnService {
  private readonly store: PersistenceStore;

  constructor(options: { store: PersistenceStore }) {
    this.store = options.store;
  }

  positionAt(query: MissionReturnPositionQuery): MissionRoutePosition {
    validatePositionQuery(query);
    const world = this.store.getWorld(query.worldId);
    if (!world) {
      throw new PersistenceError("WORLD_NOT_FOUND");
    }
    if (query.worldTime < world.worldTime) {
      throw new PersistenceError("WORLD_TIME_REGRESSION");
    }
    if (query.worldTime > world.worldTime + 1) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
    const attempt = this.store.getMissionAttempt(query.worldId, query.missionAttemptId);
    if (!attempt) {
      throw new PersistenceError("ENTITY_NOT_FOUND");
    }
    const active = activeReturningAttempt(this.store, query.worldId, attempt);
    const startWorldTime = active.attempt.lastTransitionWorldTime;
    if (query.worldTime < startWorldTime) {
      throw new PersistenceError("WORLD_TIME_REGRESSION");
    }
    return deriveRoutePosition(reverseMissionRoute(active.attempt), startWorldTime, query.worldTime);
  }

  advanceAtBoundary(context: MissionReturnBoundary): CommitMissionHomeArrivalResult[] {
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

    const candidates = this.store.listMissionAttempts(context.worldId)
      .filter((attempt) => attempt.phase === "RETURNING" && ["ACTIVE", "active"].includes(attempt.state))
      .map((attempt) => ({ attempt, due: dueWorldTime(attempt) }))
      .sort((left, right) => left.due - right.due || left.attempt.missionAttemptId.localeCompare(right.attempt.missionAttemptId));
    const results: CommitMissionHomeArrivalResult[] = [];
    for (const candidate of candidates) {
      // Re-read the linked entities before every commit. A previous ordered
      // attempt or another worker may have changed this one since discovery.
      const attempt = this.store.getMissionAttempt(context.worldId, candidate.attempt.missionAttemptId);
      if (!attempt) {
        throw new PersistenceError("ENTITY_NOT_FOUND");
      }
      const active = activeReturningAttempt(this.store, context.worldId, attempt);
      const route = reverseMissionRoute(active.attempt);
      const returnStartWorldTime = active.attempt.lastTransitionWorldTime;
      const returnDueWorldTime = dueWorldTime(active.attempt);
      if (returnDueWorldTime !== candidate.due) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      if (returnDueWorldTime > context.worldTime) {
        continue;
      }
      const arrivalPosition = deriveRoutePosition(route, returnStartWorldTime, context.worldTime);
      if (!arrivalPosition.arrived) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }

      const workId = homeArrivalWorkId(active.attempt.missionAttemptId, returnDueWorldTime);
      const eventId = homeArrivalEventId(active.attempt.missionAttemptId, returnDueWorldTime);
      const transition = this.store.commitMissionHomeArrival({
        worldId: context.worldId,
        worldTime: context.worldTime,
        returnDueWorldTime,
        idempotency: {
          key: workId,
          binding: `worker:${context.worldId}`,
          request: {
            kind: "mission_home_arrival",
            missionId: active.mission.missionId,
            missionAttemptId: active.attempt.missionAttemptId,
            returnDueWorldTime,
            worldTime: context.worldTime,
          },
        },
        soldierId: active.soldier.soldierId,
        expectedSoldierRevision: active.soldier.revision,
        missionId: active.mission.missionId,
        expectedMissionRevision: active.mission.revision,
        missionAttemptId: active.attempt.missionAttemptId,
        expectedMissionAttemptRevision: active.attempt.revision,
        event: {
          eventId,
          eventType: "MissionHomeReached",
          causationId: workId,
          idempotencyKey: workId,
          aggregateType: "mission",
          aggregateId: active.mission.missionId,
          visibilityScope: { kind: "shelter", shelterId: active.soldier.shelterId },
          typedPayload: {
            missionId: active.mission.missionId,
            missionAttemptId: active.attempt.missionAttemptId,
            soldierId: active.soldier.soldierId,
            ...(active.mission.role === "HUNTER" ? { role: active.mission.role, tool: active.mission.tool } : {}),
            homeAnchor: active.attempt.homeAnchor,
            returnDueWorldTime,
            previousPhase: "RETURNING",
            phase: "DEPOSITING",
            arrivalPosition,
            worldTime: context.worldTime,
          },
        },
      });
      results.push(transition);
    }
    return results;
  }
}
