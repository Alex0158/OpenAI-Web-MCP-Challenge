import type { ClientSnapshotEvent } from "../server/world-projection";

export interface CausalEventCard {
  eventId: string;
  eventType: string;
  worldEventCursor: number;
  worldTime: number;
  aggregateType: string;
  aggregateId: string;
  aggregateLabel: string;
}

export function buildCausalEventCards(
  events: readonly ClientSnapshotEvent[],
): CausalEventCard[] {
  return events.map((event) => ({
    eventId: event.eventId,
    eventType: event.eventType,
    worldEventCursor: event.worldEventCursor,
    worldTime: event.worldTime,
    aggregateType: event.aggregateType,
    aggregateId: event.aggregateId,
    aggregateLabel: `${event.aggregateType}:${event.aggregateId}`,
  }));
}
