import { PersistenceError, type PersistenceStore } from "./persistence/store";
import type { CargoRecord, CommitMissionDepositResult, DomainEventInput, MissionAttemptRecord } from "./persistence/types";
import type { WorldClockContext } from "./world-clock";

const WOOD_COIN_VALUE = 1;
const ROCK_COIN_VALUE = 3;

export interface MissionDepositBoundary extends Pick<WorldClockContext, "worldId" | "worldTime"> {
  elapsedMs?: number;
}

function validateBoundary(context: MissionDepositBoundary): void {
  if (typeof context.worldId !== "string" || context.worldId.trim() === ""
    || !Number.isSafeInteger(context.worldTime) || context.worldTime < 0) {
    throw new PersistenceError("INVALID_INPUT");
  }
}

function depositWorkId(missionAttemptId: string, homeCrossingWorldTime: number): string {
  return `mission-deposit:${missionAttemptId}:${homeCrossingWorldTime}`;
}

function cargoEventId(missionAttemptId: string, homeCrossingWorldTime: number): string {
  return `mission-cargo-deposited:${missionAttemptId}:${homeCrossingWorldTime}`;
}

function coinsEventId(shelterId: string, missionAttemptId: string, homeCrossingWorldTime: number): string {
  return `shelter-coins-credited:${shelterId}:${missionAttemptId}:${homeCrossingWorldTime}`;
}

function coinValue(cargo: CargoRecord): number {
  if (cargo.resourceType === "wood") {
    return cargo.quantity * WOOD_COIN_VALUE;
  }
  if (cargo.resourceType === "rock") {
    return cargo.quantity * ROCK_COIN_VALUE;
  }
  throw new PersistenceError("RECOVERY_REQUIRED");
}

function sumCargo(cargo: CargoRecord[], selector: (item: CargoRecord) => number): number {
  let total = 0;
  for (const item of cargo) {
    const value = selector(item);
    if (!Number.isSafeInteger(value) || value < 0 || value > Number.MAX_SAFE_INTEGER - total) {
      throw new PersistenceError("RECOVERY_REQUIRED");
    }
    total += value;
  }
  return total;
}

function eventBase(
  event: DomainEventInput | undefined,
  expected: { eventId: string; eventType: string; aggregateType: string; aggregateId: string; workId: string; shelterId: string },
): void {
  const visibility = event?.visibilityScope;
  if (!event || event.eventId !== expected.eventId || event.eventType !== expected.eventType
    || event.aggregateType !== expected.aggregateType || event.aggregateId !== expected.aggregateId
    || event.causationId !== expected.workId || event.idempotencyKey !== expected.workId
    || !visibility || visibility.kind !== "shelter" || visibility.shelterId !== expected.shelterId) {
    throw new PersistenceError("INVALID_INPUT");
  }
}

function activeDepositingAttempt(attempt: MissionAttemptRecord, worldTime: number): boolean {
  return ["ACTIVE", "active"].includes(attempt.state)
    && attempt.phase === "DEPOSITING"
    && attempt.lastTransitionWorldTime <= worldTime;
}

/**
 * Worker-owned CP-10 deposit phase. It only settles durable DEPOSITING
 * attempts; no browser command or automatic target selection is involved.
 */
export class MissionDepositService {
  private readonly store: PersistenceStore;

  constructor(options: { store: PersistenceStore }) {
    this.store = options.store;
  }

  advanceAtBoundary(context: MissionDepositBoundary): CommitMissionDepositResult[] {
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
      .filter((attempt) => activeDepositingAttempt(attempt, context.worldTime))
      .sort((left, right) => left.lastTransitionWorldTime - right.lastTransitionWorldTime
        || left.missionAttemptId.localeCompare(right.missionAttemptId));
    const results: CommitMissionDepositResult[] = [];

    for (const candidate of candidates) {
      const attempt = this.store.getMissionAttempt(context.worldId, candidate.missionAttemptId);
      const mission = attempt ? this.store.getMission(context.worldId, attempt.missionId) : null;
      const soldier = mission
        ? this.store.listSoldiers(context.worldId).find((item) => item.soldierId === mission.soldierId)
        : undefined;
      if (!attempt || !mission || !soldier
        || !activeDepositingAttempt(attempt, context.worldTime)
        || !Number.isSafeInteger(attempt.lastTransitionWorldTime)
        || attempt.lastTransitionWorldTime < 0
        || mission.activeAttemptId !== attempt.missionAttemptId
        || !["ACTIVE", "active"].includes(mission.state)
        || mission.phase !== "DEPOSITING"
        || (mission.role !== "GATHERER" && mission.role !== "HUNTER")
        || attempt.role !== mission.role
        || soldier.state !== "FIELD"
        || soldier.role !== mission.role
        || mission.tool !== attempt.tool
        || attempt.tool !== soldier.tool
        || mission.targetId === null
        || mission.targetId !== attempt.targetId
        || mission.nextDueWorldTime !== null
        || attempt.nextDueWorldTime !== null
        || soldier.shelterId.trim() === "") {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      const shelter = this.store.getShelter(context.worldId, soldier.shelterId);
      if (!shelter) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }

      const homeCrossingWorldTime = attempt.lastTransitionWorldTime;
      const workId = depositWorkId(attempt.missionAttemptId, homeCrossingWorldTime);
      const cargo = this.store.listCargo(context.worldId, soldier.soldierId, attempt.missionAttemptId);
      if (mission.role === "HUNTER" && cargo.length > 0) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      const cargoQuantity = sumCargo(cargo, (item) => item.quantity);
      const cargoCapacityUsed = sumCargo(cargo, (item) => item.capacityUsed);
      const coinDelta = sumCargo(cargo, coinValue);
      if (shelter.coins < 0 || !Number.isSafeInteger(shelter.coins)
        || coinDelta > Number.MAX_SAFE_INTEGER - shelter.coins) {
        throw new PersistenceError("RECOVERY_REQUIRED");
      }
      const previousCoins = shelter.coins;
      const newCoins = previousCoins + coinDelta;
      const eventId = cargoEventId(attempt.missionAttemptId, homeCrossingWorldTime);
      const items = cargo.map((item) => ({
        cargoId: item.cargoId,
        sourceNodeId: item.sourceNodeId,
        resourceType: item.resourceType,
        quantity: item.quantity,
        capacityUsed: item.capacityUsed,
        acquiredWorldTime: item.acquiredWorldTime,
      }));
      const cargoDepositedEvent: DomainEventInput = {
        eventId,
        eventType: "CargoDeposited",
        causationId: workId,
        idempotencyKey: workId,
        aggregateType: "mission",
        aggregateId: mission.missionId,
        visibilityScope: { kind: "shelter", shelterId: shelter.shelterId },
        typedPayload: {
          missionId: mission.missionId,
          missionAttemptId: attempt.missionAttemptId,
          soldierId: soldier.soldierId,
          ...(mission.role === "HUNTER" ? { role: mission.role, tool: mission.tool, settlementReason: "HUNTER_VICTORY" } : {}),
          shelterId: shelter.shelterId,
          items,
          totalQuantity: cargoQuantity,
          totalCapacityUsed: cargoCapacityUsed,
          coinDelta,
          previousPhase: "DEPOSITING",
          phase: "AT_SHELTER",
          homeCrossingWorldTime,
          worldTime: context.worldTime,
        },
      };
      let coinsCreditedEvent: DomainEventInput | undefined;
      if (coinDelta > 0) {
        coinsCreditedEvent = {
          eventId: coinsEventId(shelter.shelterId, attempt.missionAttemptId, homeCrossingWorldTime),
          eventType: "CoinsCredited",
          causationId: workId,
          idempotencyKey: workId,
          aggregateType: "shelter",
          aggregateId: shelter.shelterId,
          visibilityScope: { kind: "shelter", shelterId: shelter.shelterId },
          typedPayload: {
            shelterId: shelter.shelterId,
            missionId: mission.missionId,
            missionAttemptId: attempt.missionAttemptId,
            soldierId: soldier.soldierId,
            cargoEventId: eventId,
            coinDelta,
            previousCoins,
            newCoins,
            worldTime: context.worldTime,
          },
        };
      }
      eventBase(cargoDepositedEvent, {
        eventId,
        eventType: "CargoDeposited",
        aggregateType: "mission",
        aggregateId: mission.missionId,
        workId,
        shelterId: shelter.shelterId,
      });
      if (coinsCreditedEvent) {
        eventBase(coinsCreditedEvent, {
          eventId: coinsCreditedEvent.eventId,
          eventType: "CoinsCredited",
          aggregateType: "shelter",
          aggregateId: shelter.shelterId,
          workId,
          shelterId: shelter.shelterId,
        });
      }

      results.push(this.store.commitMissionDeposit({
        worldId: context.worldId,
        worldTime: context.worldTime,
        homeCrossingWorldTime,
        idempotency: {
          key: workId,
          binding: `worker:${context.worldId}`,
          request: {
            kind: "mission_deposit",
            missionId: mission.missionId,
            missionAttemptId: attempt.missionAttemptId,
            soldierId: soldier.soldierId,
            homeCrossingWorldTime,
          },
        },
        soldierId: soldier.soldierId,
        expectedSoldierRevision: soldier.revision,
        missionId: mission.missionId,
        expectedMissionRevision: mission.revision,
        missionAttemptId: attempt.missionAttemptId,
        expectedMissionAttemptRevision: attempt.revision,
        shelterId: shelter.shelterId,
        expectedShelterRevision: shelter.revision,
        expectedCargo: cargo,
        cargoDepositedEvent,
        ...(coinsCreditedEvent ? { coinsCreditedEvent } : {}),
      }));
    }
    return results;
  }
}
