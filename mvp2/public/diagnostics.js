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
  const event = data.events.at(-1);
  const run = data.runs.at(-1);
  const clarificationDrafted = data.audit.some(
    (item) => item.action === "clarification.draft_updated",
  );
  const cards = [
    ["First-stage grant", Boolean(data.grant), data.grant?.grantId ?? "Not attached"],
    ["Waiting state", ["UNDER_REVIEW", "CHANGES_REQUESTED"].includes(data.status), data.status],
    ["Signed event", event?.signatureStatus === "verified", event?.eventId ?? "Not emitted"],
    ["Receiver delivery", run?.status === "queued", run?.status ?? data.receiver.mode],
    ["Second-stage draft", clarificationDrafted, clarificationDrafted ? "Visible draft updated" : "Awaiting re-entry"],
    ["Human boundary", true, "No submission tool exposed on re-entry"],
  ];
  $("#diagnosticCards").innerHTML = cards
    .map(
      ([title, ok, detail]) => `<article class="diagnostic-card">
        ${badge(ok)}<h2>${escapeHtml(title)}</h2><p>${escapeHtml(detail)}</p>
      </article>`,
    )
    .join("");
  $("#diagnosticAudit").innerHTML = data.audit
    .slice()
    .reverse()
    .map(
      (item) => `<div class="log-row"><time>${escapeHtml(item.createdAt)}</time>
        <strong>${escapeHtml(item.action)}</strong><span>state v${item.stateVersion}</span></div>`,
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

