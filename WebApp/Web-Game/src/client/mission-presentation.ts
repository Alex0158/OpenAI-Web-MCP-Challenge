import type { ClientSnapshotMission } from "../server/world-projection";

export type MissionCardIcon = "icon_pickaxe" | "icon_sword" | null;
export type MissionCargoRisk = "EXPOSED" | "SECURE";

export interface MissionStatusCard {
  soldierId: string;
  phase: ClientSnapshotMission["phase"];
  phaseLabel: string;
  role: ClientSnapshotMission["role"];
  roleLabel: string;
  tool: ClientSnapshotMission["tool"];
  toolLabel: string;
  toolIcon: MissionCardIcon;
  targetId: string | null;
  targetLabel: string;
  cargoLabel: string;
  cargoRisk: MissionCargoRisk;
  cargoRiskLabel: string;
  nextAction: ClientSnapshotMission["nextAction"];
  nextActionLabel: string;
  context: string | null;
}

function formatEnumLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function iconForTool(tool: ClientSnapshotMission["tool"]): MissionCardIcon {
  if (tool === "AXE" || tool === "PICKAXE") {
    return "icon_pickaxe";
  }
  if (tool === "SWORD") {
    return "icon_sword";
  }
  return null;
}

function contextForMission(mission: ClientSnapshotMission): string | null {
  const context: string[] = [];
  if (mission.encounter?.terminalCause) {
    context.push(`Cause: ${formatEnumLabel(mission.encounter.terminalCause)}`);
  }
  if (mission.reissue.waitingReviewReason) {
    context.push(`Review: ${formatEnumLabel(mission.reissue.waitingReviewReason)}`);
  }
  return context.length > 0 ? context.join(" · ") : null;
}

export function buildMissionStatusCards(
  missions: readonly ClientSnapshotMission[],
): MissionStatusCard[] {
  return missions.map((mission) => {
    const cargoRisk: MissionCargoRisk = mission.cargo.capacityUsed > 0 ? "EXPOSED" : "SECURE";
    return {
      soldierId: mission.soldierId,
      phase: mission.phase,
      phaseLabel: formatEnumLabel(mission.phase),
      role: mission.role,
      roleLabel: mission.role === null ? "Unassigned" : formatEnumLabel(mission.role),
      tool: mission.tool,
      toolLabel: mission.tool === null ? "None" : formatEnumLabel(mission.tool),
      toolIcon: iconForTool(mission.tool),
      targetId: mission.targetId,
      targetLabel: mission.targetId ?? "None",
      cargoLabel: `${mission.cargo.quantity}/${mission.cargo.capacity}`,
      cargoRisk,
      cargoRiskLabel: cargoRisk === "EXPOSED" ? "Cargo exposed" : "No exposed cargo",
      nextAction: mission.nextAction,
      nextActionLabel: formatEnumLabel(mission.nextAction),
      context: contextForMission(mission),
    };
  });
}
