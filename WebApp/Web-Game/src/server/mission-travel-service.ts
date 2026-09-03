import { PersistenceError, type PersistenceStore } from "./persistence/store";
import { G2_EXTRACTION_INTERVAL_WORLD_SECONDS } from "./mission-extraction-service";
import type { WorldClockContext } from "./world-clock";
import type {
  GridCoordinate,
  MissionArrivalResult,
  MissionRoutePlan,
  MissionRoutePosition,
} from "./persistence/types";

export const SOLDIER_MOVE_SPEED_TILES_PER_WORLD_SECOND = 3;

function samePoint(left: GridCoordinate, right: GridCoordinate): boolean {
  return left.x === right.x && left.y === right.y;
}

function validPoint(point: unknown): point is GridCoordinate {
  if (!point || typeof point !== "object" || Array.isArray(point)) {
    return false;
  }
  const value = point as { x?: unknown; y?: unknown };
  return Number.isSafeInteger(value.x) && Number.isSafeInteger(value.y);
}

function assertRoute(route: MissionRoutePlan): void {
  if (!route || !validPoint(route.source) || !validPoint(route.target)
    || !Array.isArray(route.waypoints) || route.waypoints.length === 0
    || !Number.isSafeInteger(route.estimatedTravelWorldSeconds)
    || route.estimatedTravelWorldSeconds < 0
    || route.status !== "PLANNED") {
    throw new PersistenceError("INVALID_INPUT");
  }
  const first = route.waypoints[0];
  const last = route.waypoints.at(-1);
  if (!validPoint(first) || !validPoint(last)
    || !samePoint(first, route.source) || !samePoint(last, route.target)) {
    throw new PersistenceError("INVALID_INPUT");
  }
  for (let index = 1; index < route.waypoints.length; index += 1) {
    const previous = route.waypoints[index - 1];
    const current = route.waypoints[index];
    if (!validPoint(previous) || !validPoint(current)
      || Math.abs(current.x - previous.x) + Math.abs(current.y - previous.y) !== 1) {
      throw new PersistenceError("INVALID_INPUT");
    }
  }
}

/**
 * Derive a route position from durable world inputs. The result is a projection
 * only; no client coordinate is accepted as authority.
 */
export function deriveRoutePosition(
  route: MissionRoutePlan,
  startWorldTime: number,
  worldTime: number,
  speedTilesPerWorldSecond = SOLDIER_MOVE_SPEED_TILES_PER_WORLD_SECOND,
): MissionRoutePosition {
  assertRoute(route);
  if (!Number.isSafeInteger(startWorldTime) || startWorldTime < 0
    || !Number.isSafeInteger(worldTime) || worldTime < 0
    || worldTime < startWorldTime
    || !Number.isFinite(speedTilesPerWorldSecond) || speedTilesPerWorldSecond <= 0) {
    throw new PersistenceError(worldTime < startWorldTime ? "WORLD_TIME_REGRESSION" : "INVALID_INPUT");
  }

  const finalIndex = route.waypoints.length - 1;
  const totalTiles = finalIndex;
  const elapsedWorldSeconds = worldTime - startWorldTime;
  const progressTiles = Math.min(totalTiles, elapsedWorldSeconds * speedTilesPerWorldSecond);
  const waypointIndex = Math.min(finalIndex, Math.floor(progressTiles));
  if (waypointIndex >= finalIndex) {
    const target = route.waypoints[finalIndex] as GridCoordinate;
    return {
      x: target.x,
      y: target.y,
      waypointIndex: finalIndex,
      progressTiles: totalTiles,
      arrived: true,
    };
  }

  const from = route.waypoints[waypointIndex] as GridCoordinate;
  const to = route.waypoints[waypointIndex + 1] as GridCoordinate;
  const fraction = progressTiles - waypointIndex;
  return {
    x: from.x + (to.x - from.x) * fraction,
    y: from.y + (to.y - from.y) * fraction,
    waypointIndex,
    progressTiles,
    arrived: false,
  };
}

function arrivalWorkId(missionAttemptId: string, dueWorldTime: number): string {
  return `mission-arrival:${missionAttemptId}:${dueWorldTime}`;
}

function arrivalEventId(missionAttemptId: string, dueWorldTime: number): string {
  return `mission-working:${missionAttemptId}:${dueWorldTime}`;
}

export interface MissionTravelBoundary extends Pick<WorldClockContext, "worldId" | "worldTime"> {
  elapsedMs?: number;
}

/**
 * Applies only the CP-09 route-to-arrival milestone. Extraction, encounter,
 * return, and settlement remain separate phase handlers.
 */
export class MissionTravelService {
  private readonly store: PersistenceStore;

  constructor(options: { store: PersistenceStore }) {
    this.store = options.store;
  }

  advanceAtBoundary(context: MissionTravelBoundary): MissionArrivalResult[] {
    if (context.worldId.trim() === "" || !Number.isSafeInteger(context.worldTime) || context.worldTime < 0) {
      throw new PersistenceError("INVALID_INPUT");
    }

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

    const soldiers = this.store.listSoldiers(context.worldId);
    const dueAttempts = this.store.listDueMissionAttempts(context.worldId, context.worldTime);
    const results: MissionArrivalResult[] = [];
    for (const attempt of dueAttempts) {
      const mission = this.store.getMission(context.worldId, attempt.missionId);
      const soldier = mission
        ? soldiers.find((candidate) => candidate.soldierId === mission.soldierId)
        : undefined;
      if (!mission || !soldier || mission.activeAttemptId !== attempt.missionAttemptId
        || !["ACTIVE", "active"].includes(mission.state)
        || (mission.role !== "GATHERER" && mission.role !== "HUNTER") || attempt.role !== mission.role
        || mission.phase !== "TRAVELLING" || attempt.phase !== "TRAVELLING"
        || mission.nextDueWorldTime !== attempt.nextDueWorldTime
        || mission.role !== attempt.role || mission.tool !== attempt.tool
        || mission.targetId !== attempt.targetId
        || soldier.state !== "FIELD" || soldier.role !== attempt.role || soldier.tool !== attempt.tool
        || attempt.nextDueWorldTime === null || attempt.route === null) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      const expectedDueWorldTime = attempt.startWorldTime + attempt.route.estimatedTravelWorldSeconds;
      if (!Number.isSafeInteger(expectedDueWorldTime) || expectedDueWorldTime !== attempt.nextDueWorldTime) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      const arrivalPosition = deriveRoutePosition(attempt.route, attempt.startWorldTime, context.worldTime);
      if (!arrivalPosition.arrived) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }

      const workId = arrivalWorkId(attempt.missionAttemptId, attempt.nextDueWorldTime);
      const eventId = arrivalEventId(attempt.missionAttemptId, attempt.nextDueWorldTime);
      const nextExtractionDueWorldTime = mission.role === "GATHERER"
        ? context.worldTime + G2_EXTRACTION_INTERVAL_WORLD_SECONDS
        : null;
      if (nextExtractionDueWorldTime !== null && !Number.isSafeInteger(nextExtractionDueWorldTime)) {
        throw new PersistenceError("INVALID_INPUT");
      }
      const transition = this.store.commitTransition({
        worldId: context.worldId,
        worldTime: context.worldTime,
        idempotency: {
          key: workId,
          binding: `worker:${context.worldId}`,
          request: {
            kind: "mission_arrival",
            missionId: mission.missionId,
            missionAttemptId: attempt.missionAttemptId,
            worldTime: context.worldTime,
          },
        },
        stateMutations: [
          {
            entityType: "mission",
            entityId: mission.missionId,
            expectedRevision: mission.revision,
            patch: { phase: "WORKING", next_due_world_time: nextExtractionDueWorldTime },
          },
          {
            entityType: "mission_attempt",
            entityId: attempt.missionAttemptId,
            expectedRevision: attempt.revision,
            patch: { phase: "WORKING", last_transition_world_time: context.worldTime, next_due_world_time: nextExtractionDueWorldTime },
          },
        ],
        events: [
          {
            eventId,
            eventType: "MissionWorking",
            causationId: workId,
            idempotencyKey: workId,
            aggregateType: "mission",
            aggregateId: mission.missionId,
            visibilityScope: { kind: "shelter", shelterId: soldier.shelterId },
            typedPayload: {
              missionId: mission.missionId,
              missionAttemptId: attempt.missionAttemptId,
              soldierId: mission.soldierId,
              ...(mission.role === "HUNTER" ? { role: mission.role, tool: mission.tool } : {}),
              targetId: attempt.targetId,
              route: attempt.route,
              arrivalPosition,
              previousPhase: "TRAVELLING",
              phase: "WORKING",
              nextExtractionDueWorldTime,
              worldTime: context.worldTime,
            },
          },
        ],
      });
      const eventIdResult = transition.eventIds[0];
      const missionRevision = transition.entityRevisions[`mission:${mission.missionId}`];
      const missionAttemptRevision = transition.entityRevisions[`mission_attempt:${attempt.missionAttemptId}`];
      if (!eventIdResult || missionRevision === undefined || missionAttemptRevision === undefined) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      results.push({
        duplicate: transition.duplicate,
        effect: "mission_arrived",
        contractVersion: this.store.contractVersion,
        worldId: context.worldId,
        soldierId: mission.soldierId,
        missionId: mission.missionId,
        missionAttemptId: attempt.missionAttemptId,
        eventId: eventIdResult,
        phase: "WORKING",
        missionRevision,
        missionAttemptRevision,
        arrivalPosition,
        worldTime: context.worldTime,
      });
    }
    return results;
  }
}
