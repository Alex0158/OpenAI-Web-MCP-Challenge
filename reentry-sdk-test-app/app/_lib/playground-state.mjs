const PLAYGROUND_STATE_STORE = Symbol.for("reentry.sdk.integration.test.playground-state");

export function getPlaygroundState(scenarioId) {
  const state = stateStore();
  state.set(scenarioId, state.get(scenarioId) ?? {
    status: "waiting",
    stateVersion: 0,
    eventId: "",
  });
  return { ...state.get(scenarioId) };
}

export function markPlaygroundPermissionReady(scenarioId) {
  const current = getPlaygroundState(scenarioId);
  const next = {
    ...current,
    status: current.status === "queued" ? "queued" : "permission_ready",
  };
  stateStore().set(scenarioId, next);
  return { ...next };
}

export function markPlaygroundEventQueued(scenarioId, eventId) {
  const state = stateStore();
  const next = {
    ...getPlaygroundState(scenarioId),
    status: "queued",
    stateVersion: 1,
    eventId,
  };
  state.set(scenarioId, next);
  return { ...next };
}

function stateStore() {
  globalThis[PLAYGROUND_STATE_STORE] ??= new Map();
  return globalThis[PLAYGROUND_STATE_STORE];
}
