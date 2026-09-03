import { createContinuationPrompt } from "/assets/reentry-client.mjs";

const root = document.querySelector("#application-root");
const apiPath = root.dataset.apiPath;
const submitToken = root.dataset.submitToken;
const acceptToken = root.dataset.acceptToken;
const prompt = createContinuationPrompt();
const form = document.querySelector("#application-form");
const consentButton = document.querySelector("#enable-reentry");
const acceptButton = document.querySelector("#accept-next-stage");
const message = document.querySelector("#message");
const stateLabel = document.querySelector("#state-label");
const connectionLabel = document.querySelector("#connection-label");
const deliveryLabel = document.querySelector("#delivery-label");
const plan = document.querySelector("#next-stage-plan");
const webmcpLabel = document.querySelector("#webmcp-label");
const steps = [...document.querySelectorAll("[data-stage]")];
let currentState;
let formDirty = false;
let registeredStage = null;
let registeredTools = [];

form.addEventListener("input", () => { formDirty = true; });
form.addEventListener("submit", submitApplication);
consentButton.addEventListener("click", enableReentry);
acceptButton.addEventListener("click", acceptNextStage);

await refresh();
setInterval(() => void refresh({ quiet: true }), 1_000);

async function enableReentry() {
  setBusy(consentButton, true, "Opening…");
  try {
    const session = await requestJson(`${apiPath}/reentry/session`, { method: "POST", body: {} });
    const decision = await prompt.show({ title: session.title, reason: session.reason });
    const result = await requestJson(`${apiPath}/reentry/decision`, {
      method: "POST",
      body: {
        challenge_id: session.challenge_id,
        consent_token: session.consent_token,
        action: decision.action,
      },
    });
    showMessage(result.status === "approved"
      ? "Re-entry is enabled. You can submit the application."
      : "Re-entry was not enabled.", result.status === "approved" ? "success" : "neutral");
    await refresh();
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    setBusy(consentButton, false, "Enable Re-entry");
  }
}

async function submitApplication(event) {
  event.preventDefault();
  const button = form.querySelector("button[type=submit]");
  setBusy(button, true, "Submitting…");
  try {
    const values = Object.fromEntries(new FormData(form).entries());
    await requestJson(`${apiPath}/submit`, {
      method: "POST",
      body: {
        submit_token: submitToken,
        expected_state_version: currentState.state_version,
        expected_revision: currentState.artifact.revision,
        form: values,
      },
    });
    formDirty = false;
    showMessage("Application submitted. The reviewer can now approve it.", "success");
    await refresh();
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    setBusy(button, false, "Submit application");
  }
}

async function acceptNextStage() {
  setBusy(acceptButton, true, "Accepting…");
  try {
    await requestJson(`${apiPath}/accept`, {
      method: "POST",
      body: {
        accept_token: acceptToken,
        expected_state_version: currentState.state_version,
        expected_revision: currentState.artifact.revision,
      },
    });
    showMessage("Next stage accepted by you.", "success");
    await refresh();
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    setBusy(acceptButton, false, "Accept next stage");
  }
}

async function refresh(options = {}) {
  try {
    const state = await requestJson(apiPath);
    const previousStatus = currentState?.status;
    currentState = state;
    render(state);
    await syncSiteTools(state, previousStatus);
    return state;
  } catch (error) {
    if (!options.quiet) showMessage(error.message, "error");
    return currentState;
  }
}

function render(state) {
  stateLabel.textContent = state.status.replaceAll("_", " ");
  connectionLabel.textContent = state.reentry.connected ? "Connected" : "Not connected";
  deliveryLabel.textContent = state.reentry.delivery_status.replaceAll("_", " ");
  plan.textContent = state.artifact.next_stage_plan || "The plan will appear here after reviewer approval triggers Re-entry.";

  if (!formDirty && state.artifact.form) {
    for (const [name, value] of Object.entries(state.artifact.form)) {
      const input = form.elements.namedItem(name);
      if (input && typeof value === "string") input.value = value;
    }
  }

  const draft = state.status === "DRAFT";
  for (const field of form.elements) {
    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) field.disabled = !draft;
  }
  consentButton.disabled = !draft || state.reentry.connected;
  consentButton.textContent = state.reentry.connected ? "Re-entry enabled" : "Enable Re-entry";
  const submit = form.querySelector("button[type=submit]");
  submit.disabled = !draft || !state.reentry.connected;
  acceptButton.disabled = state.status !== "NEXT_STAGE_READY";
  acceptButton.hidden = !["NEXT_STAGE_READY", "ACCEPTED"].includes(state.status);
  if (state.status === "ACCEPTED") acceptButton.textContent = "Next stage accepted";

  const order = ["DRAFT", "SUBMITTED", "APPROVED", "NEXT_STAGE_READY", "ACCEPTED"];
  const current = order.indexOf(state.status);
  for (const step of steps) {
    const index = order.indexOf(step.dataset.stage);
    step.classList.toggle("is-current", index === current);
    step.classList.toggle("is-complete", index < current);
  }
}

async function syncSiteTools(state, previousStatus) {
  const modelContext = document.modelContext;
  if (typeof modelContext?.registerTool !== "function") {
    webmcpLabel.textContent = "Normal browser mode — the human page still works.";
    return;
  }
  if (registeredStage === state.status) return;
  if (registeredStage !== null && typeof modelContext.unregisterTool !== "function") {
    webmcpLabel.textContent = "Workflow stage changed; reloading to refresh Site Tools.";
    if (previousStatus !== state.status) location.reload();
    return;
  }
  for (const name of registeredTools) await modelContext.unregisterTool(name);
  registeredTools = [];

  await registerTool({
    name: "get_application_state",
    description: "Read the current authoritative application and next-stage draft.",
    inputSchema: schema(),
    annotations: { readOnlyHint: true },
    execute: () => refresh(),
  });

  if (state.status === "DRAFT") {
    await registerTool({
      name: "prepare_application_draft",
      description: "Prepare the visible application fields without submitting the application.",
      inputSchema: schema({
        full_name: { type: "string", minLength: 2, maxLength: 120 },
        email: { type: "string", minLength: 3, maxLength: 254 },
        project_name: { type: "string", minLength: 2, maxLength: 120 },
        summary: { type: "string", minLength: 10, maxLength: 1500 },
        expected_state_version: { type: "integer", minimum: 1 },
        expected_revision: { type: "integer", minimum: 0 },
      }, ["full_name", "email", "project_name", "summary", "expected_state_version", "expected_revision"]),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
      execute: async (input) => requestJson(`${apiPath}/draft`, {
        method: "POST",
        body: {
          expected_state_version: input.expected_state_version,
          expected_revision: input.expected_revision,
          form: {
            full_name: input.full_name,
            email: input.email,
            project_name: input.project_name,
            summary: input.summary,
          },
        },
      }),
    });
  }

  if (state.status === "NEXT_STAGE_READY") {
    await registerTool({
      name: "revise_next_stage_plan",
      description: "Revise the visible next-stage plan and stop before the applicant's acceptance.",
      inputSchema: schema({
        content: { type: "string", minLength: 1, maxLength: 2000 },
        expected_state_version: { type: "integer", minimum: 1 },
        expected_revision: { type: "integer", minimum: 0 },
      }, ["content", "expected_state_version", "expected_revision"]),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
      execute: async (input) => requestJson(`${apiPath}/plan`, { method: "POST", body: input }),
    });
  }

  registeredStage = state.status;
  webmcpLabel.textContent = `WebMCP mode — ${registeredTools.join(", ")} registered for ${state.status}.`;

  async function registerTool(definition) {
    await modelContext.registerTool(definition);
    registeredTools.push(definition.name);
  }
}

function schema(properties = {}, required = []) {
  return { type: "object", properties, required, additionalProperties: false };
}

async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    method: options.method ?? "GET",
    headers: options.body === undefined ? { Accept: "application/json" } : {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
    credentials: "same-origin",
    redirect: "error",
  });
  const value = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((value.error?.code ?? "request_failed").replaceAll("_", " "));
  return value;
}

function showMessage(text, tone) {
  message.textContent = text;
  message.dataset.tone = tone;
  message.hidden = false;
}

function setBusy(button, busy, label) {
  button.disabled = busy;
  button.textContent = label;
}
