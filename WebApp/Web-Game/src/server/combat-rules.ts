import { PersistenceError } from "./persistence/errors";
import type { CombatRoundResolution, HunterCombatRoundResolution } from "./persistence/types";

export const G2_GATHERER_COMBAT_STATS = {
  attack: 8,
  defense: 2,
  initiative: 3,
  weaponPower: 0,
  matchupBonus: 0,
} as const;

export const G2_MONSTER_COMBAT_STATS = {
  attack: 12,
  defense: 2,
  initiative: 4,
  weaponPower: 0,
  matchupBonus: 0,
} as const;

export const G2_HUNTER_COMBAT_STATS = {
  attack: 12,
  defense: 3,
  initiative: 5,
  weaponPower: 4,
  matchupBonus: 4,
} as const;

function damage(attack: number, weaponPower: number, matchupBonus: number, defense: number): number {
  return Math.max(1, attack + weaponPower + matchupBonus - defense);
}

export function resolveMonsterGathererRound(input: {
  roundNumber: number;
  gathererHp: number;
  monsterHp: number;
}): CombatRoundResolution {
  if (!Number.isSafeInteger(input.roundNumber) || input.roundNumber <= 0
    || !Number.isSafeInteger(input.gathererHp) || input.gathererHp <= 0
    || !Number.isSafeInteger(input.monsterHp) || input.monsterHp <= 0) {
    throw new PersistenceError("INVALID_INPUT");
  }

  const gathererDamage = damage(
    G2_GATHERER_COMBAT_STATS.attack,
    G2_GATHERER_COMBAT_STATS.weaponPower,
    G2_GATHERER_COMBAT_STATS.matchupBonus,
    G2_MONSTER_COMBAT_STATS.defense,
  );
  const monsterDamage = damage(
    G2_MONSTER_COMBAT_STATS.attack,
    G2_MONSTER_COMBAT_STATS.weaponPower,
    G2_MONSTER_COMBAT_STATS.matchupBonus,
    G2_GATHERER_COMBAT_STATS.defense,
  );
  const monsterFirst = G2_MONSTER_COMBAT_STATS.initiative >= G2_GATHERER_COMBAT_STATS.initiative;
  let gathererHpAfter = input.gathererHp;
  let monsterHpAfter = input.monsterHp;
  let secondActor: "GATHERER" | "MONSTER" | null = null;
  let appliedGathererDamage = 0;
  let appliedMonsterDamage = 0;

  if (monsterFirst) {
    appliedMonsterDamage = monsterDamage;
    gathererHpAfter = Math.max(0, gathererHpAfter - monsterDamage);
    if (gathererHpAfter > 0) {
      secondActor = "GATHERER";
      appliedGathererDamage = gathererDamage;
      monsterHpAfter = Math.max(0, monsterHpAfter - gathererDamage);
    }
  } else {
    secondActor = "MONSTER";
    appliedGathererDamage = gathererDamage;
    monsterHpAfter = Math.max(0, monsterHpAfter - gathererDamage);
    if (monsterHpAfter > 0) {
      appliedMonsterDamage = monsterDamage;
      gathererHpAfter = Math.max(0, gathererHpAfter - monsterDamage);
    }
  }

  const terminalCause = gathererHpAfter === 0
    ? "GATHERER_LOST"
    : monsterHpAfter === 0
      ? "MONSTER_DEFEATED"
      : null;
  return {
    roundNumber: input.roundNumber,
    firstActor: monsterFirst ? "MONSTER" : "GATHERER",
    secondActor,
    gathererDamage: appliedGathererDamage,
    monsterDamage: appliedMonsterDamage,
    gathererHpBefore: input.gathererHp,
    gathererHpAfter,
    monsterHpBefore: input.monsterHp,
    monsterHpAfter,
    terminalCause,
  };
}

export function resolveMonsterHunterRound(input: {
  roundNumber: number;
  hunterHp: number;
  monsterHp: number;
}): HunterCombatRoundResolution {
  if (!Number.isSafeInteger(input.roundNumber) || input.roundNumber <= 0
    || !Number.isSafeInteger(input.hunterHp) || input.hunterHp <= 0
    || !Number.isSafeInteger(input.monsterHp) || input.monsterHp <= 0) {
    throw new PersistenceError("INVALID_INPUT");
  }

  const hunterDamage = damage(
    G2_HUNTER_COMBAT_STATS.attack,
    G2_HUNTER_COMBAT_STATS.weaponPower,
    G2_HUNTER_COMBAT_STATS.matchupBonus,
    G2_MONSTER_COMBAT_STATS.defense,
  );
  const monsterDamage = damage(
    G2_MONSTER_COMBAT_STATS.attack,
    G2_MONSTER_COMBAT_STATS.weaponPower,
    G2_MONSTER_COMBAT_STATS.matchupBonus,
    G2_HUNTER_COMBAT_STATS.defense,
  );
  const hunterFirst = G2_HUNTER_COMBAT_STATS.initiative >= G2_MONSTER_COMBAT_STATS.initiative;
  let hunterHpAfter = input.hunterHp;
  let monsterHpAfter = input.monsterHp;
  let secondActor: "HUNTER" | "MONSTER" | null = null;
  let appliedHunterDamage = 0;
  let appliedMonsterDamage = 0;

  if (hunterFirst) {
    appliedHunterDamage = hunterDamage;
    monsterHpAfter = Math.max(0, monsterHpAfter - hunterDamage);
    if (monsterHpAfter > 0) {
      secondActor = "MONSTER";
      appliedMonsterDamage = monsterDamage;
      hunterHpAfter = Math.max(0, hunterHpAfter - monsterDamage);
    }
  } else {
    appliedMonsterDamage = monsterDamage;
    hunterHpAfter = Math.max(0, hunterHpAfter - monsterDamage);
    if (hunterHpAfter > 0) {
      secondActor = "HUNTER";
      appliedHunterDamage = hunterDamage;
      monsterHpAfter = Math.max(0, monsterHpAfter - hunterDamage);
    }
  }

  const terminalCause = monsterHpAfter === 0 ? "MONSTER_DEFEATED" : null;
  return {
    roundNumber: input.roundNumber,
    firstActor: hunterFirst ? "HUNTER" : "MONSTER",
    secondActor,
    hunterDamage: appliedHunterDamage,
    monsterDamage: appliedMonsterDamage,
    hunterHpBefore: input.hunterHp,
    hunterHpAfter,
    monsterHpBefore: input.monsterHp,
    monsterHpAfter,
    terminalCause,
  };
}
