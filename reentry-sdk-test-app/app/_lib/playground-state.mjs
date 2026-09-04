const PLAYGROUND_STATE_STORE = Symbol.for("reentry.sdk.integration.test.playground-state");

export function getPlaygroundState(scenarioId) {
  const state = stateStore();
  state.set(scenarioId, state.get(scenarioId) ?? { status: "waiting", eventId: "" });
  return { ...state.get(scenarioId) };
}

export function markPlaygroundEventQueued(scenarioId, eventId) {
  const state = stateStore();
  const next = { status: "queued", eventId };
  state.set(scenarioId, next);
  return { ...next };
}

function stateStore() {
  globalThis[PLAYGROUND_STATE_STORE] ??= new Map();
  return globalThis[PLAYGROUND_STATE_STORE];
}
