const root = document.querySelector("#review-root");
const apiPath = root.dataset.apiPath;
const reviewToken = root.dataset.reviewToken;
const approveButton = document.querySelector("#approve-application");
const message = document.querySelector("#review-message");
let currentState;

approveButton.addEventListener("click", approve);
await refresh();
setInterval(() => void refresh(true), 1_000);

async function approve() {
  approveButton.disabled = true;
  approveButton.textContent = currentState?.reentry.event_status === "PENDING"
    ? "Retrying event…"
    : "Approving…";
  try {
    await requestJson(`${apiPath}/review/approve`, {
      method: "POST",
      body: {
        review_token: reviewToken,
        expected_state_version: currentState.state_version,
        expected_revision: currentState.artifact.revision,
      },
    });
    showMessage("Approval committed and the Re-entry event was accepted.", "success");
    await refresh();
  } catch (error) {
    showMessage(`${error.message}. If Host approval is visible, use Retry event.`, "error");
    await refresh(true);
  }
}

async function refresh(quiet = false) {
  try {
    currentState = await requestJson(apiPath);
    render(currentState);
  } catch (error) {
    if (!quiet) showMessage(error.message, "error");
  }
}

function render(state) {
  document.querySelector("#review-state").textContent = state.status.replaceAll("_", " ");
  document.querySelector("#applicant-name").textContent = state.artifact.form.full_name || "—";
  document.querySelector("#applicant-email").textContent = state.artifact.form.email || "—";
  document.querySelector("#project-name").textContent = state.artifact.form.project_name || "—";
  document.querySelector("#project-summary").textContent = state.artifact.form.summary || "—";
  document.querySelector("#event-state").textContent = state.reentry.event_status.replaceAll("_", " ");
  document.querySelector("#delivery-state").textContent = state.reentry.delivery_status.replaceAll("_", " ");

  const canApprove = state.status === "SUBMITTED" ||
    (state.status === "APPROVED" && state.reentry.event_status === "PENDING");
  approveButton.disabled = !canApprove;
  approveButton.textContent = state.status === "APPROVED" && state.reentry.event_status === "PENDING"
    ? "Retry Re-entry event"
    : state.status === "SUBMITTED"
      ? "Approve application"
      : "Approval complete";
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
