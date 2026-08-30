const $ = (selector) => document.querySelector(selector);

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    ...options,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? result.delivery?.error ?? "Request failed");
  return result;
}

async function refresh() {
  const state = await api("/api/state");
  $("#reviewStatus").textContent = state.status;
  $("#reviewStatus").dataset.status = state.status;
  $("#reviewVersion").textContent = `state v${state.stateVersion}`;
  $("#submittedBid").textContent = state.tender.submittedBid ?? "No submitted bid yet.";
  $("#requestClarification").disabled = state.status !== "UNDER_REVIEW";
  if (state.status === "CHANGES_REQUESTED") {
    $("#reviewMessage").textContent = "Clarification already requested. Check the Codex task and diagnostics.";
  }
}

$("#requestClarification").addEventListener("click", async () => {
  const button = $("#requestClarification");
  button.disabled = true;
  $("#reviewMessage").textContent = "Committing state, verifying event, and contacting Receiver…";
  try {
    const result = await api("/api/reviewer/request-clarification", {
      method: "POST",
      body: JSON.stringify({ feedback: $("#reviewFeedback").value }),
    });
    $("#eventProof").hidden = false;
    $("#proofSignature").textContent = result.event.signature.algorithm + " verified";
    $("#proofGateway").textContent = result.gateway.accepted ? "Accepted" : "Rejected";
    $("#proofReceiver").textContent = result.delivery.status;
    $("#proofEvent").textContent = result.event.eventId;
    $("#reviewMessage").textContent =
      result.delivery.status === "queued"
        ? "Re-entry queued. The same Codex task should resume without a new prompt."
        : `Event accepted in ${result.delivery.status} mode.`;
    await refresh();
  } catch (error) {
    $("#reviewMessage").textContent = error.message;
    $("#reviewMessage").classList.add("error");
    button.disabled = false;
  }
});

refresh().catch((error) => {
  $("#reviewMessage").textContent = error.message;
});
setInterval(() => refresh().catch(() => {}), 2000);

