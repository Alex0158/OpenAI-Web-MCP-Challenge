const $ = (selector) => document.querySelector(selector);

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    ...options,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "Request failed");
  return result;
}

function badge(ok, yes = "PASS", no = "WAIT") {
  return `<span class="diagnostic-badge ${ok ? "pass" : "wait"}">${ok ? yes : no}</span>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function refresh() {
  const data = await api("/api/diagnostics");
  const event = data.receiver.events.at(-1);
  const run = data.receiver.runs.at(-1);
  const grant = data.receiver.grants.at(-1);
  const intent = data.hostOutbox.at(-1);
  const clarificationDrafted = data.hostAudit.some(
    (item) => item.action === "clarification.draft_updated",
  );
  const cards = [
    ["Host Adapter", Boolean(data.hostAdapter), data.hostAdapter],
    ["First-stage Grant", Boolean(grant), grant?.grantId ?? "Not attached"],
    ["Host event intent", Boolean(intent), intent?.status ?? "Not emitted"],
    [
      "Waiting state",
      ["UNDER_REVIEW", "CHANGES_REQUESTED"].includes(data.workflow.currentState),
      data.workflow.currentState,
    ],
    ["Signed event", event?.signatureStatus === "verified", event?.eventId ?? "Not emitted"],
    [
      "Agent Adapter",
      run?.status === "queued",
      run?.status ?? data.receiver.adapter.id,
    ],
    [
      "Second-stage draft",
      clarificationDrafted,
      clarificationDrafted ? "Visible draft updated" : "Awaiting re-entry",
    ],
    [
      "Human boundary",
      data.siteToolEvidence.consequentialSubmissionUnavailable,
      data.siteToolEvidence.consequentialSubmissionUnavailable
        ? `No forbidden Site Tool in ${data.siteToolEvidence.checkedSurface}`
        : `Exposed: ${data.siteToolEvidence.exposedNames.join(", ")}`,
    ],
  ];
  $("#diagnosticCards").innerHTML = cards
    .map(
      ([title, ok, detail]) => `<article class="diagnostic-card">
        ${badge(ok)}<h2>${escapeHtml(title)}</h2><p>${escapeHtml(detail)}</p>
      </article>`,
    )
    .join("");

  const combinedAudit = [
    ...data.hostAudit.map((item) => ({ ...item, component: "host" })),
    ...data.receiver.audit.map((item) => ({ ...item, component: "receiver" })),
  ].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
  $("#diagnosticAudit").innerHTML = combinedAudit
    .map(
      (item) => `<div class="log-row"><time>${escapeHtml(item.createdAt)}</time>
        <strong>${escapeHtml(item.action)}</strong><span>${escapeHtml(item.component)}${item.stateVersion ? ` · state v${item.stateVersion}` : ""}</span></div>`,
    )
    .join("");
  $("#lastUpdated").textContent = `Updated ${new Date().toLocaleTimeString()}`;
}

$("#resetTest").addEventListener("click", async () => {
  await api("/api/test/reset", { method: "POST", body: "{}" });
  await refresh();
});

refresh().catch(console.error);
setInterval(() => refresh().catch(() => {}), 2000);
