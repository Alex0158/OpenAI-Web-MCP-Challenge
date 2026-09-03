import type { ClientSnapshotActor, ClientSnapshotResourceNode } from "../server/world-projection";
import type { GridCoordinate, MissionRole } from "../server/persistence/types";

export type CanvasTileVisual = "fog" | "grass" | "blocked";

export interface CanvasResourceVisual {
  resourceType: ClientSnapshotResourceNode["resourceType"];
  depleted: boolean;
}

export interface CanvasSelectionVisualInput {
  selectedSoldierId: string;
  selectedTargetId: string;
  actors: readonly ClientSnapshotActor[];
  resourceNodes: readonly ClientSnapshotResourceNode[];
}

export interface CanvasSelectionVisual {
  soldierPosition: GridCoordinate | null;
  targetPosition: GridCoordinate | null;
}

export type CanvasActorMarker = "rune" | "crystal" | "pickaxe" | "sword" | "eye" | "body";
export type CanvasActorPalette = "friendly" | "hostile" | "neutral";

export interface CanvasActorVisual {
  marker: CanvasActorMarker;
  palette: CanvasActorPalette;
  cargo: boolean;
  defeated: boolean;
}

export interface CanvasActorVisualInput {
  actorKind: ClientSnapshotActor["kind"];
  role: MissionRole | null;
  cargoCapacityUsed: number;
  state: string;
}

export function resolveTileVisual(input: { explored: boolean; blocked: boolean }): CanvasTileVisual {
  if (input.blocked) {
    return "blocked";
  }
  return input.explored ? "grass" : "fog";
}

export function resolveResourceVisual(input: Pick<ClientSnapshotResourceNode, "resourceType" | "availability">): CanvasResourceVisual {
  return {
    resourceType: input.resourceType,
    depleted: input.availability === "DEPLETED",
  };
}

export function resolveSelectionVisual(input: CanvasSelectionVisualInput): CanvasSelectionVisual {
  const selectedSoldier = input.selectedSoldierId.trim() === ""
    ? null
    : input.actors.find((actor) => actor.kind === "soldier"
      && actor.soldierId === input.selectedSoldierId
      && actor.state?.trim().toUpperCase() === "AT_SHELTER") ?? null;
  const selectedTarget = input.selectedTargetId.trim() === ""
    ? null
    : input.resourceNodes.find((node) => node.resourceNodeId === input.selectedTargetId
      && node.availability === "AVAILABLE") ?? null;
  return {
    soldierPosition: selectedSoldier ? { ...selectedSoldier.position } : null,
    targetPosition: selectedTarget ? { ...selectedTarget.position } : null,
  };
}

export function resolveActorVisual(input: CanvasActorVisualInput): CanvasActorVisual {
  const normalizedState = input.state.trim().toUpperCase();
  const defeated = normalizedState === "DEFEATED"
    || normalizedState === "DEAD"
    || normalizedState.includes("DEAD");
  let marker: CanvasActorMarker;
  let palette: CanvasActorPalette;

  switch (input.actorKind) {
    case "player":
      marker = "rune";
      palette = "friendly";
      break;
    case "shelter":
      marker = "crystal";
      palette = "friendly";
      break;
    case "monster":
      marker = "eye";
      palette = "hostile";
      break;
    case "soldier":
      marker = input.role === "GATHERER"
        ? "pickaxe"
        : input.role === "HUNTER" ? "sword" : "body";
      palette = input.role === null ? "neutral" : "friendly";
      break;
  }

  return {
    marker,
    palette,
    cargo: input.cargoCapacityUsed > 0,
    defeated,
  };
}
