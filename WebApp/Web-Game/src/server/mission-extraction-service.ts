import { deterministicCargoId, PersistenceError, type PersistenceStore } from "./persistence/store";
import type { WorldClockContext } from "./world-clock";
import type { CommitMissionExtractionResult, CommitMissionTargetDepletedReturnResult } from "./persistence/types";

export const G2_CARGO_CAPACITY_SLOTS = 5;
export const G2_EXTRACTION_INTERVAL_WORLD_SECONDS = 2;
export const G2_RESOURCE_RESPAWN_INTERVAL_WORLD_SECONDS = 30;

function extractionWorkId(missionAttemptId: string, dueWorldTime: number): string {
  return `mission-extraction:${missionAttemptId}:${dueWorldTime}`;
}

function extractionEventId(missionAttemptId: string, dueWorldTime: number): string {
  return `cargo-extracted:${missionAttemptId}:${dueWorldTime}`;
}

function contestLossWorkId(missionAttemptId: string, dueWorldTime: number): string {
  return `mission-extraction-contest-loss:${missionAttemptId}:${dueWorldTime}`;
}

function contestLossEventId(missionAttemptId: string, dueWorldTime: number): string {
  return `mission-auto-returned:${missionAttemptId}:${dueWorldTime}:target-depleted`;
}

function expectedGathererTool(resourceType: string): "AXE" | "PICKAXE" | null {
  if (resourceType === "wood") {
    return "AXE";
  }
  if (resourceType === "rock") {
    return "PICKAXE";
  }
  return null;
}

export interface MissionExtractionBoundary extends Pick<WorldClockContext, "worldId" | "worldTime"> {
  elapsedMs?: number;
}

/**
 * Applies one CP-10 extraction milestone. The same phase handler owns the
 * recurring due marker and the capacity/depletion handoff; return travel and
 * shelter settlement remain separate phase handlers.
 */
export class MissionExtractionService {
  private readonly store: PersistenceStore;

  constructor(options: { store: PersistenceStore }) {
    this.store = options.store;
  }

  advanceAtBoundary(context: MissionExtractionBoundary): Array<CommitMissionExtractionResult | CommitMissionTargetDepletedReturnResult> {
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

    const dueAttempts = this.store.listDueMissionExtractionAttempts(context.worldId, context.worldTime);
    const results: Array<CommitMissionExtractionResult | CommitMissionTargetDepletedReturnResult> = [];
    for (const attempt of dueAttempts) {
      const mission = this.store.getMission(context.worldId, attempt.missionId);
      const soldier = mission
        ? this.store.listSoldiers(context.worldId).find((candidate) => candidate.soldierId === mission.soldierId)
        : undefined;
      const node = attempt.targetId
        ? this.store.listResourceNodes(context.worldId).find((candidate) => candidate.resourceNodeId === attempt.targetId)
        : undefined;
      const encounterFields = [mission?.encounterId, mission?.encounterStatus, attempt.encounterId, attempt.encounterStatus];
      if (encounterFields.some((value) => value !== null && value !== undefined)) {
        const coherentActiveEncounter = mission?.encounterId !== null
          && mission?.encounterId !== undefined
          && mission.encounterId === attempt.encounterId
          && (mission.encounterStatus === "LOCKED" || mission.encounterStatus === "RESOLVING")
          && mission.encounterStatus === attempt.encounterStatus;
        if (!coherentActiveEncounter) {
          throw new PersistenceError("RECOVERY_REQUIRED");
        }
        // Contact owns this boundary before extraction. A linked encounter
        // deliberately suppresses the due extraction until combat settles.
        continue;
      }
      if (!mission || !soldier || !node
        || mission.activeAttemptId !== attempt.missionAttemptId
        || !["ACTIVE", "active"].includes(mission.state)
        || !["ACTIVE", "active"].includes(attempt.state)
        || mission.phase !== "WORKING"
        || attempt.phase !== "WORKING"
        || mission.role !== "GATHERER"
        || attempt.role !== "GATHERER"
        || soldier.state !== "FIELD"
        || soldier.role !== "GATHERER"
        || mission.role !== attempt.role
        || mission.tool !== attempt.tool
        || soldier.tool !== attempt.tool
        || mission.targetId !== attempt.targetId
        || attempt.targetId === null
        || attempt.nextDueWorldTime === null
        || mission.nextDueWorldTime !== attempt.nextDueWorldTime
        || attempt.nextDueWorldTime > context.worldTime) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      const tool = expectedGathererTool(node.resourceType);
      if (!tool || mission.tool !== tool || attempt.tool !== tool || soldier.tool !== tool) {
        throw new PersistenceError("TOOL_INCOMPATIBLE");
      }

      const dueWorldTime = attempt.nextDueWorldTime;
      const workId = extractionWorkId(attempt.missionAttemptId, dueWorldTime);
      if (node.quantity === 0) {
        const contestWorkId = contestLossWorkId(attempt.missionAttemptId, dueWorldTime);
        const cargoTotals = this.store.listCargo(context.worldId, mission.soldierId)
          .reduce((totals, cargo) => ({
            quantity: totals.quantity + cargo.quantity,
            capacityUsed: totals.capacityUsed + cargo.capacityUsed,
          }), { quantity: 0, capacityUsed: 0 });
        // Depletion before this boundary is a normal race in the persistent
        // world. Convert it into the same durable return handoff as a node
        // emptied by an earlier ordered attempt; no cargo or coins are minted.
        results.push(this.store.commitMissionTargetDepletedReturn({
          worldId: context.worldId,
          worldTime: context.worldTime,
          dueWorldTime,
          idempotency: {
            key: contestWorkId,
            binding: `worker:${context.worldId}`,
            request: {
              kind: "mission_extraction_contest_loss",
              missionId: mission.missionId,
              missionAttemptId: attempt.missionAttemptId,
              resourceNodeId: node.resourceNodeId,
              worldTime: context.worldTime,
            },
          },
          soldierId: mission.soldierId,
          expectedSoldierRevision: soldier.revision,
          missionId: mission.missionId,
          expectedMissionRevision: mission.revision,
          missionAttemptId: attempt.missionAttemptId,
          expectedMissionAttemptRevision: attempt.revision,
          resourceNodeId: node.resourceNodeId,
          expectedResourceNodeRevision: node.revision,
          event: {
            eventId: contestLossEventId(attempt.missionAttemptId, dueWorldTime),
            eventType: "MissionAutoReturned",
            causationId: contestWorkId,
            idempotencyKey: contestWorkId,
            aggregateType: "mission",
            aggregateId: mission.missionId,
            visibilityScope: { kind: "shelter", shelterId: soldier.shelterId },
            typedPayload: {
              missionId: mission.missionId,
              missionAttemptId: attempt.missionAttemptId,
              soldierId: mission.soldierId,
              reason: "TARGET_DEPLETED",
              cargoQuantity: cargoTotals.quantity,
              cargoCapacityUsed: cargoTotals.capacityUsed,
              resourceNodeId: node.resourceNodeId,
              worldTime: context.worldTime,
            },
          },
        }));
        continue;
      }
      const cargoId = deterministicCargoId(context.worldId, attempt.missionAttemptId, node.resourceNodeId);
      const eventId = extractionEventId(attempt.missionAttemptId, dueWorldTime);
      const remainingNodeQuantity = node.quantity - 1;
      if (remainingNodeQuantity < 0) {
        throw new PersistenceError("TARGET_UNAVAILABLE");
      }
      const existingCargo = this.store.getCargo(context.worldId, cargoId);
      if (existingCargo
        && (existingCargo.soldierId !== mission.soldierId
          || existingCargo.missionAttemptId !== attempt.missionAttemptId
          || existingCargo.sourceNodeId !== node.resourceNodeId
          || existingCargo.resourceType !== node.resourceType)) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      const currentCapacityUsed = this.store.listCargo(context.worldId, mission.soldierId)
        .reduce((total, cargo) => total + cargo.capacityUsed, 0);
      const resultingCapacityUsed = currentCapacityUsed + 1;
      const capacityFull = resultingCapacityUsed >= G2_CARGO_CAPACITY_SLOTS;
      const nodeDepleted = remainingNodeQuantity === 0;
      const shouldReturn = capacityFull || nodeDepleted;
      const returnReason = capacityFull ? "CAPACITY_FULL" : nodeDepleted ? "TARGET_DEPLETED" : null;
      const nextDueWorldTime = shouldReturn ? null : dueWorldTime + G2_EXTRACTION_INTERVAL_WORLD_SECONDS;
      if (!shouldReturn && (nextDueWorldTime === null || !Number.isSafeInteger(nextDueWorldTime) || nextDueWorldTime <= context.worldTime)) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      const resourceRespawnDueWorldTime = nodeDepleted
        ? context.worldTime + G2_RESOURCE_RESPAWN_INTERVAL_WORLD_SECONDS
        : null;
      if (resourceRespawnDueWorldTime !== null && !Number.isSafeInteger(resourceRespawnDueWorldTime)) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      const cargoQuantity = (existingCargo?.quantity ?? 0) + 1;
      const cargoCapacityUsed = (existingCargo?.capacityUsed ?? 0) + 1;
      const eventPayload = {
        cargoId,
        missionId: mission.missionId,
        missionAttemptId: attempt.missionAttemptId,
        soldierId: mission.soldierId,
        sourceNodeId: node.resourceNodeId,
        resourceType: node.resourceType,
        quantity: 1,
        capacityUsed: 1,
        remainingNodeQuantity,
        worldTime: context.worldTime,
        ...(existingCargo ? { cargoQuantity, cargoCapacityUsed } : {}),
        ...(shouldReturn ? { returnReason } : {}),
      };
      const result = this.store.commitMissionExtraction({
        worldId: context.worldId,
        worldTime: context.worldTime,
        idempotency: {
          key: workId,
          binding: `worker:${context.worldId}`,
          request: {
            kind: "mission_extraction",
            missionId: mission.missionId,
            missionAttemptId: attempt.missionAttemptId,
            resourceNodeId: node.resourceNodeId,
            worldTime: context.worldTime,
          },
        },
        soldierId: mission.soldierId,
        expectedSoldierRevision: soldier.revision,
        missionId: mission.missionId,
        expectedMissionRevision: mission.revision,
        missionAttemptId: attempt.missionAttemptId,
        expectedMissionAttemptRevision: attempt.revision,
        resourceNodeId: node.resourceNodeId,
        expectedResourceNodeRevision: node.revision,
        expectedCargoRevision: existingCargo?.revision ?? null,
        nextDueWorldTime,
        returnReason,
        resourceRespawnDueWorldTime,
        event: {
          eventId,
          eventType: "CargoExtracted",
          causationId: workId,
          idempotencyKey: workId,
          aggregateType: "mission",
          aggregateId: mission.missionId,
          visibilityScope: { kind: "shelter", shelterId: soldier.shelterId },
          typedPayload: eventPayload,
        },
        ...(nodeDepleted ? {
          resourceDepletedEvent: {
            eventId: `resource-depleted:${node.resourceNodeId}:${dueWorldTime}`,
            eventType: "ResourceDepleted",
            causationId: workId,
            idempotencyKey: workId,
            aggregateType: "resource_node",
            aggregateId: node.resourceNodeId,
            visibilityScope: { kind: "world" as const },
            typedPayload: {
              missionAttemptId: attempt.missionAttemptId,
              resourceNodeId: node.resourceNodeId,
              resourceType: node.resourceType,
              respawnDueWorldTime: resourceRespawnDueWorldTime,
              worldTime: context.worldTime,
            },
          },
        } : {}),
        ...(shouldReturn ? {
          returnEvent: {
            eventId: `mission-auto-returned:${attempt.missionAttemptId}:${dueWorldTime}`,
            eventType: "MissionAutoReturned",
            causationId: workId,
            idempotencyKey: workId,
            aggregateType: "mission",
            aggregateId: mission.missionId,
            visibilityScope: { kind: "shelter" as const, shelterId: soldier.shelterId },
            typedPayload: {
              missionId: mission.missionId,
              missionAttemptId: attempt.missionAttemptId,
              soldierId: mission.soldierId,
              reason: returnReason,
              cargoQuantity,
              cargoCapacityUsed,
              resourceNodeId: node.resourceNodeId,
              worldTime: context.worldTime,
            },
          },
        } : {}),
      });
      results.push(result);
    }
    return results;
  }
}
