import type { ClientSnapshot } from "../server/world-projection";

export type GathererDispatchTool = "AXE" | "PICKAXE";

export interface GathererDispatchSoldierChoice {
  readonly soldierId: string;
  readonly label: string;
  readonly disabled: boolean;
  readonly reason: string | null;
  readonly expectedRevision: number | null;
}

export interface GathererDispatchTargetChoice {
  readonly targetId: string;
  readonly resourceType: "wood" | "rock";
  readonly tool: GathererDispatchTool;
  readonly label: string;
  readonly disabled: boolean;
  readonly reason: string | null;
}

export interface GathererDispatchChoices {
  readonly soldiers: readonly GathererDispatchSoldierChoice[];
  readonly targets: readonly GathererDispatchTargetChoice[];
  readonly ready: boolean;
  readonly unavailableReason: string | null;
}

export interface GathererDispatchSelection {
  readonly soldierId: string;
  readonly targetId: string;
  readonly tool: GathererDispatchTool;
  readonly expectedSoldierRevision: number;
}

type GathererDispatchProjection = Pick<ClientSnapshot, "soldiers" | "missions" | "resourceNodes">;

function toolFor(resourceType: "wood" | "rock"): GathererDispatchTool {
  return resourceType === "wood" ? "AXE" : "PICKAXE";
}

export function buildGathererDispatchChoices(snapshot: GathererDispatchProjection | null): GathererDispatchChoices {
  if (snapshot === null) {
    return {
      soldiers: [],
      targets: [],
      ready: false,
      unavailableReason: "Dispatch unavailable until the latest authoritative snapshot is ready.",
    };
  }

  const missionBySoldier = new Map(snapshot.missions.map((mission) => [mission.soldierId, mission]));
  const soldiers = snapshot.soldiers
    .map((soldier): GathererDispatchSoldierChoice => {
      const mission = missionBySoldier.get(soldier.soldierId);
      let reason: string | null = null;
      if (!mission) {
        reason = "mission status unavailable";
      } else if (mission.nextAction !== "DISPATCH"
        || mission.phase !== "AT_SHELTER"
        || mission.soldierState !== "AT_SHELTER"
        || soldier.state !== "AT_SHELTER") {
        reason = `not ready (${mission.phase})`;
      }
      return {
        soldierId: soldier.soldierId,
        label: reason === null ? `${soldier.soldierId} — ready at shelter` : `${soldier.soldierId} — ${reason}`,
        disabled: reason !== null,
        reason,
        expectedRevision: reason === null ? soldier.revision : null,
      };
    })
    .sort((left, right) => left.soldierId.localeCompare(right.soldierId));

  const targets = snapshot.resourceNodes
    .map((node): GathererDispatchTargetChoice => {
      const reason = node.availability === "AVAILABLE" ? null : "depleted in the latest authoritative snapshot";
      const typeLabel = node.resourceType === "wood" ? "Wood" : "Rock";
      return {
        targetId: node.resourceNodeId,
        resourceType: node.resourceType,
        tool: toolFor(node.resourceType),
        label: reason === null
          ? `${typeLabel} — ${node.resourceNodeId} — available in the latest authoritative snapshot`
          : `${typeLabel} — ${node.resourceNodeId} — ${reason}`,
        disabled: reason !== null,
        reason,
      };
    })
    .sort((left, right) => left.targetId.localeCompare(right.targetId));

  const hasSoldier = soldiers.some((choice) => !choice.disabled);
  const hasTarget = targets.some((choice) => !choice.disabled);
  return {
    soldiers,
    targets,
    ready: hasSoldier && hasTarget,
    unavailableReason: !hasSoldier
      ? "No resident soldier is ready to dispatch in the latest authoritative snapshot."
      : !hasTarget
        ? "No sensed Wood or Rock target is available in the latest authoritative snapshot."
        : null,
  };
}

export function resolveGathererDispatchSelection(
  snapshot: GathererDispatchProjection | null,
  soldierId: string,
  targetId: string,
): GathererDispatchSelection | null {
  const choices = buildGathererDispatchChoices(snapshot);
  const soldier = choices.soldiers.find((choice) => choice.soldierId === soldierId && !choice.disabled);
  const target = choices.targets.find((choice) => choice.targetId === targetId && !choice.disabled);
  if (!soldier || !target || soldier.expectedRevision === null) {
    return null;
  }
  return {
    soldierId,
    targetId,
    tool: target.tool,
    expectedSoldierRevision: soldier.expectedRevision,
  };
}

export type PageMutationKind = "movement" | "dispatch";

export interface PageMutationLease {
  readonly token: number;
  readonly scope: string;
  readonly kind: PageMutationKind;
}

export interface PageMutationGate {
  readonly pending: boolean;
  readonly pendingKind: PageMutationKind | null;
  setScope(scope: string): void;
  begin(kind: PageMutationKind): PageMutationLease | null;
  release(lease: PageMutationLease): boolean;
  invalidate(): void;
}

export function createPageMutationGate(): PageMutationGate {
  let sequence = 0;
  let scope: string | null = null;
  let current: PageMutationLease | null = null;

  return {
    get pending() {
      return current !== null;
    },
    get pendingKind() {
      return current?.kind ?? null;
    },
    setScope(nextScope) {
      if (scope !== null && scope !== nextScope) {
        current = null;
      }
      scope = nextScope;
    },
    begin(kind) {
      if (scope === null || current !== null) {
        return null;
      }
      current = Object.freeze({ token: ++sequence, scope, kind });
      return current;
    },
    release(lease) {
      if (!current
        || current.token !== lease.token
        || current.scope !== lease.scope
        || current.kind !== lease.kind
        || scope !== lease.scope) {
        return false;
      }
      current = null;
      return true;
    },
    invalidate() {
      sequence += 1;
      scope = null;
      current = null;
    },
  };
}

export interface GathererDispatchAttempt {
  readonly token: number;
  readonly scope: string;
  readonly soldierId: string;
  readonly targetId: string;
  readonly tool: GathererDispatchTool;
  readonly expectedSoldierRevision: number;
}

export interface GathererDispatchAcknowledgement {
  readonly soldierId: string;
  readonly missionId: string;
  readonly missionAttemptId: string;
  readonly eventId: string;
  readonly committedRevisions: {
    readonly soldier: number;
    readonly mission: number;
    readonly missionAttempt: number;
  };
}

export type GathererDispatchRefreshFailureCode =
  | "STALE_REVISION"
  | "ROLE_LOCKED"
  | "NOT_AT_SHELTER"
  | "MISSION_ACTIVE"
  | "TARGET_UNAVAILABLE";

export interface GathererDispatchRefreshFailure {
  readonly code: GathererDispatchRefreshFailureCode;
  readonly currentSoldierRevision: number;
}

export type GathererDispatchGateOutcome =
  | { readonly kind: "ignored" }
  | { readonly kind: "request_resync" }
  | { readonly kind: "request_follow_up_resync" }
  | { readonly kind: "awaiting_command" }
  | { readonly kind: "reconciled" }
  | { readonly kind: "reconciled_advanced" }
  | { readonly kind: "reconciled_unknown" }
  | { readonly kind: "reconciled_rejection" }
  | { readonly kind: "stale" }
  | { readonly kind: "no_pending" };

export interface GathererDispatchReconciliationGate {
  readonly pending: boolean;
  setScope(scope: string): void;
  begin(input: Omit<GathererDispatchAttempt, "token" | "scope">): GathererDispatchAttempt | null;
  acknowledge(attempt: GathererDispatchAttempt, acknowledgement: GathererDispatchAcknowledgement): GathererDispatchGateOutcome;
  markUnknown(attempt: GathererDispatchAttempt): GathererDispatchGateOutcome;
  markRejectedForRefresh(
    attempt: GathererDispatchAttempt,
    failure: GathererDispatchRefreshFailure,
  ): GathererDispatchGateOutcome;
  reject(attempt: GathererDispatchAttempt): boolean;
  acceptSnapshot(scope: string, snapshot: GathererDispatchProjection): GathererDispatchGateOutcome;
  invalidate(): void;
}

interface PendingDispatch {
  readonly attempt: GathererDispatchAttempt;
  readonly mode: "submitting" | "acknowledged" | "unknown" | "refreshing_rejection";
  readonly acknowledgement: GathererDispatchAcknowledgement | null;
  readonly refreshFailure: GathererDispatchRefreshFailure | null;
  followUpUsed: boolean;
}

function validRevision(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

function validText(value: string): boolean {
  return value.trim() !== "";
}

function validRefreshFailure(failure: GathererDispatchRefreshFailure): boolean {
  const supported = failure.code === "STALE_REVISION"
    || failure.code === "ROLE_LOCKED"
    || failure.code === "NOT_AT_SHELTER"
    || failure.code === "MISSION_ACTIVE"
    || failure.code === "TARGET_UNAVAILABLE";
  return supported && validRevision(failure.currentSoldierRevision);
}

function soldierIsDispatchEligible(
  snapshot: GathererDispatchProjection,
  soldierId: string,
): boolean {
  const soldier = snapshot.soldiers.find((candidate) => candidate.soldierId === soldierId);
  const mission = snapshot.missions.find((candidate) => candidate.soldierId === soldierId);
  return soldier?.state === "AT_SHELTER"
    && mission?.nextAction === "DISPATCH"
    && mission.phase === "AT_SHELTER"
    && mission.soldierState === "AT_SHELTER";
}

function rejectionRefreshMatches(
  pending: PendingDispatch,
  snapshot: GathererDispatchProjection,
): boolean {
  const failure = pending.refreshFailure;
  if (!failure) {
    return false;
  }
  const soldier = snapshot.soldiers.find(
    (candidate) => candidate.soldierId === pending.attempt.soldierId,
  );
  if (!soldier || soldier.revision < failure.currentSoldierRevision) {
    return false;
  }
  if (failure.code === "STALE_REVISION") {
    return true;
  }
  if (failure.code === "TARGET_UNAVAILABLE") {
    const target = snapshot.resourceNodes.find(
      (candidate) => candidate.resourceNodeId === pending.attempt.targetId,
    );
    return !target || target.availability !== "AVAILABLE";
  }
  return !soldierIsDispatchEligible(snapshot, pending.attempt.soldierId);
}

export function createGathererDispatchReconciliationGate(): GathererDispatchReconciliationGate {
  let sequence = 0;
  let scope: string | null = null;
  let current: PendingDispatch | null = null;

  const matches = (attempt: GathererDispatchAttempt): boolean => Boolean(current)
    && current?.attempt.token === attempt.token
    && current.attempt.scope === attempt.scope
    && current.attempt.soldierId === attempt.soldierId
    && current.attempt.targetId === attempt.targetId
    && current.attempt.tool === attempt.tool
    && current.attempt.expectedSoldierRevision === attempt.expectedSoldierRevision
    && scope === attempt.scope;

  return {
    get pending() {
      return current !== null;
    },
    setScope(nextScope) {
      if (scope !== null && scope !== nextScope) {
        current = null;
      }
      scope = nextScope;
    },
    begin(input) {
      if (scope === null || current !== null
        || !validText(input.soldierId) || !validText(input.targetId)
        || (input.tool !== "AXE" && input.tool !== "PICKAXE")
        || !validRevision(input.expectedSoldierRevision)) {
        return null;
      }
      const attempt = Object.freeze({ token: ++sequence, scope, ...input });
      current = {
        attempt,
        mode: "submitting",
        acknowledgement: null,
        refreshFailure: null,
        followUpUsed: false,
      };
      return attempt;
    },
    acknowledge(attempt, acknowledgement) {
      const revisions = acknowledgement.committedRevisions;
      if (!matches(attempt)
        || acknowledgement.soldierId !== attempt.soldierId
        || !validText(acknowledgement.missionId)
        || !validText(acknowledgement.missionAttemptId)
        || !validText(acknowledgement.eventId)
        || !validRevision(revisions.soldier)
        || revisions.soldier <= attempt.expectedSoldierRevision
        || !validRevision(revisions.mission)
        || !validRevision(revisions.missionAttempt)) {
        return { kind: "ignored" };
      }
      current = {
        attempt,
        mode: "acknowledged",
        acknowledgement: structuredClone(acknowledgement),
        refreshFailure: null,
        followUpUsed: false,
      };
      return { kind: "request_resync" };
    },
    markUnknown(attempt) {
      if (!matches(attempt)) {
        return { kind: "ignored" };
      }
      current = {
        attempt,
        mode: "unknown",
        acknowledgement: null,
        refreshFailure: null,
        followUpUsed: false,
      };
      return { kind: "request_resync" };
    },
    markRejectedForRefresh(attempt, failure) {
      if (!matches(attempt) || !validRefreshFailure(failure)) {
        return { kind: "ignored" };
      }
      current = {
        attempt,
        mode: "refreshing_rejection",
        acknowledgement: null,
        refreshFailure: structuredClone(failure),
        followUpUsed: false,
      };
      return { kind: "request_resync" };
    },
    reject(attempt) {
      if (!matches(attempt)) {
        return false;
      }
      current = null;
      return true;
    },
    acceptSnapshot(frameScope, snapshot) {
      if (scope === null || frameScope !== scope) {
        return { kind: "ignored" };
      }
      if (!current) {
        return { kind: "no_pending" };
      }
      if (current.mode === "submitting") {
        return { kind: "awaiting_command" };
      }
      if (current.mode === "unknown") {
        current = null;
        return { kind: "reconciled_unknown" };
      }
      if (current.mode === "refreshing_rejection") {
        if (rejectionRefreshMatches(current, snapshot)) {
          current = null;
          return { kind: "reconciled_rejection" };
        }
        if (!current.followUpUsed) {
          current.followUpUsed = true;
          return { kind: "request_follow_up_resync" };
        }
        return { kind: "stale" };
      }

      const acknowledgement = current.acknowledgement;
      if (!acknowledgement) {
        return { kind: "stale" };
      }
      const soldier = snapshot.soldiers.find((candidate) => candidate.soldierId === acknowledgement.soldierId);
      const mission = snapshot.missions.find((candidate) => candidate.soldierId === acknowledgement.soldierId);
      const soldierReady = Boolean(soldier)
        && (soldier?.revision ?? -1) >= acknowledgement.committedRevisions.soldier;
      const sameAttempt = soldierReady
        && mission?.missionId === acknowledgement.missionId
        && mission.missionAttemptId === acknowledgement.missionAttemptId
        && mission.role === "GATHERER"
        && mission.tool === current.attempt.tool
        && mission.equipmentTier === 1
        && mission.targetId === current.attempt.targetId
        && mission.returnPolicy === "WHEN_FULL"
        && mission.revision >= acknowledgement.committedRevisions.mission
        && (mission.attemptRevision ?? -1) >= acknowledgement.committedRevisions.missionAttempt;
      if (sameAttempt) {
        current = null;
        return { kind: "reconciled" };
      }
      const advancedAttempt = soldierReady
        && mission?.missionId === acknowledgement.missionId
        && (mission.missionAttemptId !== acknowledgement.missionAttemptId
          || (mission.phase === "AT_SHELTER" && mission.nextAction === "DISPATCH"))
        && mission.revision > acknowledgement.committedRevisions.mission;
      if (advancedAttempt) {
        current = null;
        return { kind: "reconciled_advanced" };
      }
      if (!current.followUpUsed) {
        current.followUpUsed = true;
        return { kind: "request_follow_up_resync" };
      }
      return { kind: "stale" };
    },
    invalidate() {
      sequence += 1;
      scope = null;
      current = null;
    },
  };
}
