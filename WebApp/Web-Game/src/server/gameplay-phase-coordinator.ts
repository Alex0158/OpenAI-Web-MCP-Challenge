import type { WorldClockContext, WorldClockPhase, WorldClockPhaseHandler } from "./world-clock";
import { MissionDepositService } from "./mission-deposit-service";
import { MissionExtractionService } from "./mission-extraction-service";
import { MissionReturnService } from "./mission-return-service";
import { MissionTravelService } from "./mission-travel-service";
import { MonsterCombatService } from "./monster-combat-service";

export interface GameplayPhaseCoordinatorOptions {
  travel: MissionTravelService;
  returning: MissionReturnService;
  deposit: MissionDepositService;
  extraction: MissionExtractionService;
  combat: MonsterCombatService;
  onPhase?: (context: WorldClockContext) => void;
}

/**
 * The single worker-owned composition point for the implemented G2 boundary
 * phases. It deliberately leaves settlement and timers explicit no-ops until
 * their own durable reducers exist.
 */
export class GameplayPhaseCoordinator {
  private readonly travel: MissionTravelService;
  private readonly returning: MissionReturnService;
  private readonly deposit: MissionDepositService;
  private readonly extraction: MissionExtractionService;
  private readonly combat: MonsterCombatService;
  private readonly onPhase?: (context: WorldClockContext) => void;

  constructor(options: GameplayPhaseCoordinatorOptions) {
    this.travel = options.travel;
    this.returning = options.returning;
    this.deposit = options.deposit;
    this.extraction = options.extraction;
    this.combat = options.combat;
    this.onPhase = options.onPhase;
  }

  phaseHandlers(): Partial<Record<WorldClockPhase, WorldClockPhaseHandler>> {
    return {
      movement: (context) => this.run(context, () => {
        this.travel.advanceAtBoundary(context);
        this.returning.advanceAtBoundary(context);
      }),
      deposit: (context) => this.run(context, () => {
        this.deposit.advanceAtBoundary(context);
      }),
      contact: (context) => this.run(context, () => {
        this.combat.advanceContactAtBoundary(context);
      }),
      extraction: (context) => this.run(context, () => {
        this.extraction.advanceAtBoundary(context);
      }),
      combat: (context) => this.run(context, () => {
        this.combat.advanceCombatAtBoundary(context);
      }),
      settlement: (context) => this.run(context, () => undefined),
      timers: (context) => this.run(context, () => undefined),
    };
  }

  private run(context: WorldClockContext, operation: () => void): void {
    this.onPhase?.(context);
    operation();
  }
}
