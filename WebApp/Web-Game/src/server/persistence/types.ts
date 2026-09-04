import type { PersistenceErrorCode } from "./errors";

export const CURRENT_SCHEMA_VERSION = 9;
export const CURRENT_MIGRATION_ID = "cp14-001";
export const CURRENT_EVENT_VERSION = 1;
export const CURRENT_SNAPSHOT_VERSION = 1;
export const DEFAULT_CONTRACT_VERSION = "SK-MVP-0.2";

export type EntityType =
  | "world"
  | "player"
  | "shelter"
  | "soldier"
  | "mission"
  | "mission_attempt"
  | "cargo"
  | "resource_node"
  | "monster"
  | "encounter";

export type SignalStatus = "pending" | "in_flight" | "acknowledged" | "terminally_rejected";
export type DeliveryStatus = SignalStatus;
export type SignalSeverity = "info" | "warning" | "critical";

export type MissionPhase = "AT_SHELTER" | "TRAVELLING" | "WORKING" | "RETURNING" | "DEPOSITING" | "WAITING_REVIEW" | "TERMINAL";
export type MissionRole = "GATHERER" | "HUNTER" | "SIEGE" | "GUARD";
export type MissionTool = "AXE" | "PICKAXE" | "SWORD" | "HAMMER" | "SIEGE_KIT";
export type MissionReturnPolicy = "WHEN_FULL" | "ON_TARGET_DEPLETED" | "ON_RECALL";
export type EncounterState = "LOCKED" | "RESOLVING" | "RESOLVED";
export type EncounterTerminalCause = "GATHERER_LOST" | "MONSTER_DEFEATED";
export type ReissueReviewReason = "NO_SAFE_REISSUE_ROUTE" | "REPEATED_MONSTER_DEATH";
export type ReissueOutcome = "REISSUED" | "WAITING_REVIEW";

export interface MissionRoutePlan {
  source: GridCoordinate;
  target: GridCoordinate;
  walkabilityVersion: string;
  waypoints: GridCoordinate[];
  estimatedTravelWorldSeconds: number;
  status: "PLANNED";
}

export interface MissionRecord {
  worldId: string;
  missionId: string;
  soldierId: string;
  state: string;
  phase: MissionPhase;
  role: MissionRole | null;
  tool: MissionTool | null;
  targetId: string | null;
  returnPolicy: MissionReturnPolicy | null;
  activeAttemptId: string | null;
  encounterId: string | null;
  encounterStatus: EncounterState | null;
  nextDueWorldTime: number | null;
  monsterReissueBudget: 0 | 1;
  dangerCell: GridCoordinate | null;
  waitingReviewReason: ReissueReviewReason | null;
  revision: number;
}

export interface MissionAttemptRecord {
  worldId: string;
  missionAttemptId: string;
  missionId: string;
  state: string;
  phase: MissionPhase;
  role: MissionRole | null;
  tool: MissionTool | null;
  equipmentTier: number;
  targetId: string | null;
  route: MissionRoutePlan | null;
  homeAnchor: GridCoordinate | null;
  returnPolicy: MissionReturnPolicy | null;
  encounterId: string | null;
  encounterStatus: EncounterState | null;
  terminalCause: EncounterTerminalCause | null;
  startWorldTime: number;
  lastTransitionWorldTime: number;
  nextDueWorldTime: number | null;
  revision: number;
}

export interface MissionRoutePosition {
  x: number;
  y: number;
  waypointIndex: number;
  progressTiles: number;
  arrived: boolean;
}

export interface MissionArrivalResult {
  duplicate?: boolean;
  effect: "mission_arrived";
  contractVersion: string;
  worldId: string;
  soldierId: string;
  missionId: string;
  missionAttemptId: string;
  eventId: string;
  phase: "WORKING";
  missionRevision: number;
  missionAttemptRevision: number;
  arrivalPosition: MissionRoutePosition;
  worldTime: number;
}

export interface CargoRecord {
  worldId: string;
  cargoId: string;
  soldierId: string;
  missionAttemptId: string | null;
  sourceNodeId: string | null;
  resourceType: string;
  quantity: number;
  acquiredWorldTime: number | null;
  capacityUsed: number;
  revision: number;
}

export interface PersistenceStoreOptions {
  dbPath: string;
  contractVersion?: string;
  schemaVersion?: number;
}

export interface SchemaMetadata {
  schemaVersion: number;
  contractVersion: string;
  supportedEventVersion: number;
  supportedSnapshotVersion: number;
  migrationId: string;
}

export interface WorldRecord {
  worldId: string;
  worldTime: number;
  inProgressWorldTime: number | null;
  serverTimeAnchorMs: number | null;
  worldEventCursor: number;
  worldSeed: string | null;
  generationVersion: string | null;
  mapFingerprint: string | null;
  revision: number;
}

export interface GridCoordinate {
  x: number;
  y: number;
}

export interface CreateWorldInput {
  worldId: string;
  worldTime: number;
  worldSeed?: string | null;
  generationVersion?: string | null;
  mapFingerprint?: string | null;
  revision?: number;
}

export interface CreateSoldierInput {
  worldId: string;
  soldierId: string;
  shelterId: string;
  state?: string;
  role?: string | null;
  tool?: string | null;
  revision?: number;
}

export interface SoldierRecord extends CreateSoldierInput {
  state: string;
  role: string | null;
  tool: string | null;
  revision: number;
}

export interface CreateResourceNodeInput {
  worldId: string;
  resourceNodeId: string;
  resourceType: string;
  quantity: number;
  revision?: number;
}

export interface ResourceNodeRecord extends CreateResourceNodeInput {
  nextDueWorldTime: number | null;
  revision: number;
}

export interface CreateMonsterInput {
  worldId: string;
  monsterId: string;
  state?: string;
  revision?: number;
}

export interface MonsterRecord extends CreateMonsterInput {
  state: string;
  revision: number;
}

export interface EncounterRecord {
  worldId: string;
  encounterId: string;
  state: EncounterState;
  missionId: string;
  missionAttemptId: string;
  soldierId: string;
  monsterId: string;
  soldierHp: number;
  monsterHp: number;
  roundNumber: number;
  contactWorldTime: number;
  engagementPosition: GridCoordinate;
  nextDueWorldTime: number | null;
  terminalCause: EncounterTerminalCause | null;
  revision: number;
}

export interface CreateWorldFixtureInput {
  world: CreateWorldInput;
  players: CreatePlayerInput[];
  shelters: CreateShelterInput[];
  soldiers: CreateSoldierInput[];
  resourceNodes: CreateResourceNodeInput[];
  monsters: CreateMonsterInput[];
  snapshot: SnapshotInput;
}

export interface CreateWorldFixtureResult {
  world: WorldRecord;
  snapshot: WorldSnapshotRecord;
}

export interface PlayerRecord {
  worldId: string;
  playerId: string;
  binding: string;
  revision: number;
  position: GridCoordinate;
  exploredCells: GridCoordinate[];
}

export interface ShelterRecord {
  worldId: string;
  shelterId: string;
  playerId: string;
  revision: number;
  coins: number;
}

export interface CreatePlayerInput {
  worldId: string;
  playerId: string;
  binding: string;
  revision?: number;
  position?: GridCoordinate;
  exploredCells?: GridCoordinate[];
}

export interface CreateShelterInput {
  worldId: string;
  shelterId: string;
  playerId: string;
  revision?: number;
  coins?: number;
}

export interface StateMutationInput {
  entityType: EntityType;
  entityId: string;
  expectedRevision: number;
  patch: Record<string, string | number | boolean | null>;
}

export interface VisibilityScope {
  kind: "world" | "player" | "shelter";
  playerId?: string;
  shelterId?: string;
}

export interface DomainEventInput {
  eventId: string;
  eventVersion?: number;
  eventType: string;
  causationId?: string | null;
  idempotencyKey?: string | null;
  aggregateType: string;
  aggregateId: string;
  aggregateRevision?: number | null;
  visibilityScope: VisibilityScope;
  typedPayload: unknown;
  affectedEntityRevisions?: Record<string, number>;
}

export interface PersistedDomainEvent extends DomainEventInput {
  eventVersion: number;
  contractVersion: string;
  worldId: string;
  worldTime: number;
  worldEventCursor: number;
  affectedEntityRevisions: Record<string, number>;
}

export interface IdempotencyInput {
  key: string;
  binding: string;
  request: unknown;
}

export interface IdempotencyRecord {
  worldId: string;
  key: string;
  binding: string;
  requestFingerprint: string;
  contractVersion: string;
  outcome: "committed" | "rejected";
  result: unknown;
  eventIds: string[];
}

export interface SignalEligibilityInput {
  shelterId: string;
  opaqueBinding: string;
  grantId: string;
  boundedAction: string;
  severity?: SignalSeverity;
  cooldownWorldSeconds?: number;
}

export interface SignalSlotRecord {
  worldId: string;
  shelterId: string;
  opaqueBinding: string;
  signalId: string;
  grantId: string;
  boundedAction: string;
  status: SignalStatus;
  cursorStart: number;
  cursorEnd: number;
  eligibleEventCount: number;
  eventTypes: string[];
  severity: SignalSeverity;
  latestEventId: string;
  latestEventType: string;
  latestWorldTime: number;
  deferredCursorStart: number | null;
  deferredCursorEnd: number | null;
  deferredEligibleEventCount: number;
  deferredEventTypes: string[];
  deferredSeverity: SignalSeverity;
  deferredLatestEventId: string | null;
  deferredLatestEventType: string | null;
  deferredLatestWorldTime: number | null;
  cooldownUntilWorldTime: number;
  leaseId: string | null;
  leaseExpiresAtWallMs: number | null;
  attemptCount: number;
  lastErrorCode: PersistenceErrorCode | null;
}

export interface OutboxDeliveryRecord {
  deliveryId: string;
  worldId: string;
  shelterId: string;
  opaqueBinding: string;
  signalId: string;
  status: DeliveryStatus;
  attemptCount: number;
  leaseId: string | null;
  leaseExpiresAtWallMs: number | null;
  lastOutcome: string | null;
}

export interface ReentryEventContext {
  worldId: string;
  signalId: string;
  opaqueBinding: string;
  eventSequence: number;
  occurredAt: string;
  stateVersion: number;
}

export interface ReentryEventContextInput {
  worldId: string;
  signalId: string;
  opaqueBinding: string;
  occurredAt: string;
  stateVersion: number;
}

export interface CommitTransitionInput {
  worldId: string;
  worldTime: number;
  idempotency: IdempotencyInput;
  stateMutations: StateMutationInput[];
  events: DomainEventInput[];
  signalEligibility?: SignalEligibilityInput;
  injectFailureAt?: "after_state" | "after_events" | "after_signal" | "before_commit";
}

export interface CommitTransitionResult {
  duplicate?: boolean;
  eventIds: string[];
  worldEventCursorStart: number | null;
  worldEventCursorEnd: number | null;
  entityRevisions: Record<string, number>;
  signalId: string | null;
}

export interface CommitMissionDispatchInput {
  worldId: string;
  worldTime: number;
  commandId: string;
  idempotency: IdempotencyInput;
  soldierId: string;
  expectedSoldierRevision: number;
  missionId: string;
  missionAttemptId: string;
  role: MissionRole;
  tool: MissionTool;
  equipmentTier: number;
  targetId: string;
  route: MissionRoutePlan;
  homeAnchor: GridCoordinate;
  returnPolicy: MissionReturnPolicy;
  event: DomainEventInput;
}

export interface CommitMissionDispatchResult {
  duplicate?: boolean;
  effect: "mission_dispatched";
  contractVersion: string;
  worldId: string;
  soldierId: string;
  missionId: string;
  missionAttemptId: string;
  eventId: string;
  role: MissionRole;
  tool: MissionTool;
  equipmentTier: number;
  targetId: string;
  phase: MissionPhase;
  soldierState: "FIELD";
  soldierRevision: number;
  missionRevision: number;
  missionAttemptRevision: number;
  route: MissionRoutePlan;
  homeAnchor: GridCoordinate;
  returnPolicy: MissionReturnPolicy;
}

export interface CommitMissionExtractionInput {
  worldId: string;
  worldTime: number;
  idempotency: IdempotencyInput;
  soldierId: string;
  expectedSoldierRevision: number;
  missionId: string;
  expectedMissionRevision: number;
  missionAttemptId: string;
  expectedMissionAttemptRevision: number;
  resourceNodeId: string;
  expectedResourceNodeRevision: number;
  expectedCargoRevision?: number | null;
  nextDueWorldTime: number | null;
  returnReason: "CAPACITY_FULL" | "TARGET_DEPLETED" | null;
  resourceRespawnDueWorldTime: number | null;
  event: DomainEventInput;
  returnEvent?: DomainEventInput;
  resourceDepletedEvent?: DomainEventInput;
  injectFailureAt?: "after_state" | "after_cargo" | "after_events" | "before_commit";
}

export interface CommitMissionExtractionResult {
  duplicate?: boolean;
  effect: "cargo_extracted";
  contractVersion: string;
  worldId: string;
  soldierId: string;
  missionId: string;
  missionAttemptId: string;
  resourceNodeId: string;
  eventId: string;
  cargo: CargoRecord;
  quantity: 1;
  capacityUsed: 1;
  remainingNodeQuantity: number;
  missionRevision: number;
  missionAttemptRevision: number;
  resourceNodeRevision: number;
  cargoRevision: number;
  phase: "WORKING" | "RETURNING";
  nextDueWorldTime: number | null;
  returned: boolean;
  returnReason: "CAPACITY_FULL" | "TARGET_DEPLETED" | null;
  resourceNodeDepleted: boolean;
  resourceRespawnDueWorldTime: number | null;
  eventIds: string[];
  returnEventId: string | null;
  resourceDepletedEventId: string | null;
  worldTime: number;
}

export interface CommitMissionTargetDepletedReturnInput {
  worldId: string;
  worldTime: number;
  dueWorldTime: number;
  idempotency: IdempotencyInput;
  soldierId: string;
  expectedSoldierRevision: number;
  missionId: string;
  expectedMissionRevision: number;
  missionAttemptId: string;
  expectedMissionAttemptRevision: number;
  resourceNodeId: string;
  expectedResourceNodeRevision: number;
  event: DomainEventInput;
  injectFailureAt?: "after_state" | "after_events" | "before_commit";
}

export interface CommitMissionTargetDepletedReturnResult {
  duplicate?: boolean;
  effect: "mission_auto_returned";
  contractVersion: string;
  worldId: string;
  soldierId: string;
  missionId: string;
  missionAttemptId: string;
  resourceNodeId: string;
  eventId: string;
  eventIds: string[];
  cargoQuantity: number;
  cargoCapacityUsed: number;
  missionRevision: number;
  missionAttemptRevision: number;
  soldierRevision: number;
  resourceNodeRevision: number;
  phase: "RETURNING";
  nextDueWorldTime: null;
  returnReason: "TARGET_DEPLETED";
  worldTime: number;
}

export interface CommitMissionHomeArrivalInput {
  worldId: string;
  worldTime: number;
  returnDueWorldTime: number;
  idempotency: IdempotencyInput;
  soldierId: string;
  expectedSoldierRevision: number;
  missionId: string;
  expectedMissionRevision: number;
  missionAttemptId: string;
  expectedMissionAttemptRevision: number;
  event: DomainEventInput;
  injectFailureAt?: "after_state" | "after_events" | "before_commit";
}

export interface CommitMissionHomeArrivalResult {
  duplicate?: boolean;
  effect: "mission_home_reached";
  contractVersion: string;
  worldId: string;
  soldierId: string;
  missionId: string;
  missionAttemptId: string;
  eventId: string;
  eventIds: string[];
  missionRevision: number;
  missionAttemptRevision: number;
  soldierRevision: number;
  phase: "DEPOSITING";
  returnDueWorldTime: number;
  homeAnchor: GridCoordinate;
  arrivalPosition: MissionRoutePosition;
  worldTime: number;
}

export interface CommitMissionRecallInput {
  worldId: string;
  worldTime: number;
  commandId: string;
  idempotency: IdempotencyInput;
  soldierId: string;
  expectedSoldierRevision: number;
  missionId: string;
  expectedMissionRevision: number;
  missionAttemptId: string;
  expectedMissionAttemptRevision: number;
  role: "GATHERER" | "HUNTER";
  tool: MissionTool;
  previousPhase: "TRAVELLING" | "WORKING";
  recallPosition: MissionRoutePosition;
  homeAnchor: GridCoordinate;
  returnTravelWorldSeconds: number;
  returnPolicy: MissionReturnPolicy;
  event: DomainEventInput;
  injectFailureAt?: "after_state" | "after_events" | "before_commit";
}

export interface CommitMissionRecallResult {
  duplicate?: boolean;
  effect: "mission_recalled";
  contractVersion: string;
  worldId: string;
  soldierId: string;
  missionId: string;
  missionAttemptId: string;
  eventId: string;
  eventIds: string[];
  role: "GATHERER" | "HUNTER";
  tool: MissionTool;
  previousPhase: "TRAVELLING" | "WORKING";
  phase: "RETURNING";
  returnPolicy: MissionReturnPolicy;
  recallPosition: MissionRoutePosition;
  homeAnchor: GridCoordinate;
  returnTravelWorldSeconds: number;
  soldierRevision: number;
  missionRevision: number;
  missionAttemptRevision: number;
  worldTime: number;
}

export interface CommitMissionDepositInput {
  worldId: string;
  worldTime: number;
  homeCrossingWorldTime: number;
  idempotency: IdempotencyInput;
  soldierId: string;
  expectedSoldierRevision: number;
  missionId: string;
  expectedMissionRevision: number;
  missionAttemptId: string;
  expectedMissionAttemptRevision: number;
  shelterId: string;
  expectedShelterRevision: number;
  expectedCargo: CargoRecord[];
  cargoDepositedEvent: DomainEventInput;
  coinsCreditedEvent?: DomainEventInput;
  injectFailureAt?: "after_cargo" | "after_state" | "after_events" | "before_commit";
}

export interface CommitMissionDepositResult {
  duplicate?: boolean;
  effect: "mission_deposited";
  contractVersion: string;
  worldId: string;
  soldierId: string;
  missionId: string;
  missionAttemptId: string;
  shelterId: string;
  cargoEventId: string;
  coinsCreditedEventId: string | null;
  eventIds: string[];
  cargoQuantity: number;
  cargoCapacityUsed: number;
  coinDelta: number;
  previousCoins: number;
  newCoins: number;
  missionRevision: number;
  missionAttemptRevision: number;
  soldierRevision: number;
  shelterRevision: number;
  phase: "AT_SHELTER";
  homeCrossingWorldTime: number;
  worldTime: number;
}

export interface CommitMonsterContactInput {
  worldId: string;
  worldTime: number;
  idempotency: IdempotencyInput;
  encounterId: string;
  missionId: string;
  expectedMissionRevision: number;
  missionAttemptId: string;
  expectedMissionAttemptRevision: number;
  soldierId: string;
  expectedSoldierRevision: number;
  monsterId: string;
  expectedMonsterRevision: number;
  engagementPosition: GridCoordinate;
  events: DomainEventInput[];
  injectFailureAt?: "after_state" | "after_events" | "before_commit";
}

export interface CommitMonsterContactResult {
  duplicate?: boolean;
  effect: "encounter_locked";
  contractVersion: string;
  worldId: string;
  encounterId: string;
  missionId: string;
  missionAttemptId: string;
  soldierId: string;
  monsterId: string;
  eventIds: string[];
  encounter: EncounterRecord;
  worldTime: number;
}

export interface CombatRoundResolution {
  roundNumber: number;
  firstActor: "GATHERER" | "MONSTER";
  secondActor: "GATHERER" | "MONSTER" | null;
  gathererDamage: number;
  monsterDamage: number;
  gathererHpBefore: number;
  gathererHpAfter: number;
  monsterHpBefore: number;
  monsterHpAfter: number;
  terminalCause: EncounterTerminalCause | null;
}

export interface HunterCombatRoundResolution {
  roundNumber: number;
  firstActor: "HUNTER" | "MONSTER";
  secondActor: "HUNTER" | "MONSTER" | null;
  hunterDamage: number;
  monsterDamage: number;
  hunterHpBefore: number;
  hunterHpAfter: number;
  monsterHpBefore: number;
  monsterHpAfter: number;
  terminalCause: "MONSTER_DEFEATED" | null;
}

export type MonsterCombatRoundResolution = CombatRoundResolution | HunterCombatRoundResolution;

export interface CommitMonsterCombatRoundInput {
  worldId: string;
  worldTime: number;
  idempotency: IdempotencyInput;
  encounterId: string;
  expectedEncounterRevision: number;
  missionId: string;
  expectedMissionRevision: number;
  missionAttemptId: string;
  expectedMissionAttemptRevision: number;
  soldierId: string;
  expectedSoldierRevision: number;
  monsterId: string;
  expectedMonsterRevision: number;
  resolution: MonsterCombatRoundResolution;
  events: DomainEventInput[];
  /** Optional server-owned grant used to atomically enqueue an eligible signal. */
  signalEligibility?: SignalEligibilityInput;
  reissue?: MonsterReissuePlan;
  injectFailureAt?: "after_cargo" | "after_state" | "after_events" | "after_signal" | "before_commit";
}

export interface MonsterReissuePlan {
  outcome: ReissueOutcome;
  dangerCell: GridCoordinate;
  reason: ReissueReviewReason | null;
  newMissionAttemptId: string | null;
  route: MissionRoutePlan | null;
}

export interface MonsterReissueResult {
  outcome: ReissueOutcome;
  dangerCell: GridCoordinate;
  reason: ReissueReviewReason | null;
  previousMissionAttemptId: string;
  newMissionAttemptId: string | null;
  budgetBefore: 0 | 1;
  budgetAfter: 0;
  route: MissionRoutePlan | null;
}

export interface CommitMonsterCombatRoundResult {
  duplicate?: boolean;
  effect: "combat_round_resolved";
  contractVersion: string;
  worldId: string;
  encounterId: string;
  missionId: string;
  missionAttemptId: string;
  soldierId: string;
  monsterId: string;
  eventIds: string[];
  round: MonsterCombatRoundResolution;
  encounter: EncounterRecord;
  cargoLostQuantity: number;
  cargoLostCapacityUsed: number;
  reissue: MonsterReissueResult | null;
  worldTime: number;
}

export interface SnapshotInput {
  worldId: string;
  worldSnapshotId: string;
  snapshotVersion?: number;
  contractVersion?: string;
  worldTime: number;
  lastWorldEventCursor: number;
  entityRevisions: Record<string, number>;
  state: unknown;
}

export interface WorldSnapshotRecord extends SnapshotInput {
  snapshotVersion: number;
  contractVersion: string;
  stateHash: string;
}

export interface RecoveryResult {
  world: WorldRecord;
  snapshot: WorldSnapshotRecord | null;
  events: PersistedDomainEvent[];
}

export interface DeliveryClaimInput {
  worldId: string;
  signalId: string;
  leaseId: string;
  nowWallTimeMs: number;
  leaseDurationMs: number;
}

export interface DeliveryAckInput {
  worldId: string;
  signalId: string;
  leaseId: string;
  nowWallTimeMs: number;
  deliveryBoundary?: "transport_accepted" | "receiver_queue_accepted";
}

export interface DeliveryResult {
  signalId: string;
  status: DeliveryStatus;
  eventId: string | null;
  duplicate?: boolean;
}
