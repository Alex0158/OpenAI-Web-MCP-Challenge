export function renderConsentPage(details) {
  const decisionControls = details.status === "PENDING"
    ? `
      <div class="decision-row">
        <button id="approve" class="primary">Approve one future re-entry</button>
        <button id="decline" class="secondary">Decline</button>
      </div>
      <pre id="decision-result" aria-live="polite"></pre>
      <script type="module">
        const challengeId = ${JSON.stringify(details.challenge_id)};
        const correlationId = ${JSON.stringify(details.correlation_id)};
        async function decide(decision) {
          const response = await fetch("/api/receiver/consent/" + challengeId + "/" + decision, {
            method: "POST",
            headers: {
              "X-Correlation-Id": correlationId,
              "X-Receiver-Human-Action": "true",
            },
          });
          const body = await response.json();
          const displayBody = body.agent_binding
            ? { ...body, agent_binding: maskOpaqueBinding(body.agent_binding) }
            : body;
          document.querySelector("#decision-result").textContent = JSON.stringify(displayBody, null, 2);
          document.querySelector("#approve").disabled = true;
          document.querySelector("#decline").disabled = true;
        }
        function maskOpaqueBinding(value) {
          if (typeof value !== "string" || value.length < 12) return "Registered";
          return value.slice(0, 10) + "…" + value.slice(-4);
        }
        document.querySelector("#approve").addEventListener("click", () => decide("approve"));
        document.querySelector("#decline").addEventListener("click", () => decide("decline"));
      </script>`
    : `<p class="status">This consent challenge is ${escapeHtml(details.status)}.</p>`;

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Receiver Consent</title>
      <link rel="stylesheet" href="/styles.css">
    </head>
    <body>
      <main class="shell narrow">
        <p class="eyebrow">Receiver-owned consent</p>
        <h1>Authorize one future Agent re-entry?</h1>
        <p>The website offered this bounded continuation. Approval creates authority; merely viewing the offer does not.</p>
        <dl class="consent-grid">
          <dt>Workflow</dt><dd>${escapeHtml(details.workflow_id)}</dd>
          <dt>Origin</dt><dd>${escapeHtml(details.issuer_origin)}</dd>
          <dt>Event</dt><dd>${escapeHtml(details.event_type)}</dd>
          <dt>Run limit</dt><dd>${details.max_runs}</dd>
          <dt>Expiry</dt><dd>${escapeHtml(details.expires_at)}</dd>
          <dt>Stop before</dt><dd>${escapeHtml(details.human_boundary)}</dd>
        </dl>
        ${decisionControls}
      </main>
    </body>
  </html>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
