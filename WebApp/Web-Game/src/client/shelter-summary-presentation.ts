import type { ClientSnapshot, ClientSnapshotResourceNode } from "../server/world-projection";
import type { VisualIconId } from "./visual-icons";

export type ShelterSummaryKind = "coins" | "wood" | "rock";

export interface ShelterSummaryCard {
  kind: ShelterSummaryKind;
  label: string;
  value: string;
  detail: string;
  icon: VisualIconId;
}

export interface ShelterSummaryInput {
  shelter: ClientSnapshot["shelter"] | null;
  /** Null means the current projection is not ready to expose resource counts. */
  resourceNodes: readonly ClientSnapshotResourceNode[] | null;
}

const WAITING_DETAIL = "Waiting for an authoritative snapshot";

function resourceDetail(nodes: readonly ClientSnapshotResourceNode[], resourceType: "wood" | "rock"): string {
  const visibleNodes = nodes.filter((node) => node.resourceType === resourceType);
  const available = visibleNodes.filter((node) => node.availability === "AVAILABLE").length;
  const depleted = visibleNodes.filter((node) => node.availability === "DEPLETED").length;
  return `${available} available · ${depleted} depleted · in sensing range`;
}

function resourceCard(
  resourceType: "wood" | "rock",
  resourceNodes: readonly ClientSnapshotResourceNode[] | null,
): ShelterSummaryCard {
  const label = resourceType === "wood" ? "Wood" : "Rock";
  const icon = resourceType === "wood" ? "icon_wood" : "icon_rock";
  return {
    kind: resourceType,
    label,
    value: resourceNodes === null
      ? "—"
      : String(resourceNodes.filter((node) => node.resourceType === resourceType).length),
    detail: resourceNodes === null ? WAITING_DETAIL : resourceDetail(resourceNodes, resourceType),
    icon,
  };
}

export function buildShelterSummaryCards(input: ShelterSummaryInput): ShelterSummaryCard[] {
  return [
    {
      kind: "coins",
      label: "Coins",
      value: input.shelter === null ? "—" : String(input.shelter.coins),
      detail: input.shelter === null ? WAITING_DETAIL : "Banked shelter currency",
      icon: "icon_coin",
    },
    resourceCard("wood", input.resourceNodes),
    resourceCard("rock", input.resourceNodes),
  ];
}
