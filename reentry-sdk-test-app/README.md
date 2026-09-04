# Re-entry SDK Test App

This is a deliberately isolated, test-only Next.js consumer for checking the published
`@4xeoz/re-entry-sdk` consent flow against a Re-entry Cloud Receiver.

It intentionally stays small while covering the complete playground path:

```text
button or WebMCP tool -> signed Manifest + consent session -> Re-entry consent
       -> Host status confirmation -> approved opaque continuation retained in memory
       -> human-only business update -> signed Event -> Re-entry delivery queue
```

The WebMCP surface is intentionally limited to two tools per mini-app: a read-only status tool and
a consent tool. It does not expose the developer switch or the later business-update control. The
in-memory store is only a placeholder for a real Host database and is cleared when the Next.js
process restarts.

## Run locally

```sh
npm install
cp .env.example .env.local
npm run dev
```

Set the values in `.env.local` using the Host origin, Receiver origin, Ed25519 PKCS#8 PEM Host
private key, Host key id, and organization API key from the developer setup. Keep `.env.local`
untracked. The private key and organization API key are read only by server Route Handlers and are
never exposed to the browser. If the PEM is stored on one line, use literal `\n` escapes between
lines.

Open [http://localhost:3000](http://localhost:3000) and select **Sign a test contract**. The SDK
opens the Receiver consent page in a popup. After approval, the Host status route confirms the
Receiver state and stores the opaque continuation in memory. Use the customer view for consent,
then use the clearly labelled developer view to simulate the later business update.

## Verify

```sh
npm test
npm run build
```

The package versions are intentionally exact so this test consumer is reproducible. The app was
scaffolded against Next.js `16.3.4`, React `19.2.8`, and the npm `latest` Re-entry SDK at `0.3.2`.

## Playground plan

The home page is a small playground rather than one product. It currently contains four simulated
mini-apps:

- Ledgerly: approve a supplier invoice.
- Parcelly: prepare an order for pickup.
- Kindline: resolve a support ticket.
- Morrow: review a client proposal.

Each mini-app has two visible sides:

1. **User side** — a normal-looking product page where a demo user asks for Re-entry permission.
2. **Developer side** — a clearly labelled human-only control that simulates the business update.

The developer control has `data-webmcp-excluded="true"` and is not registered as a WebMCP tool. The
WebMCP tools are registered only while a selected mini-app is on its customer view. Each tool is
also guarded so it refuses to act when that mini-app is not active.

The intended demo path is:

```text
User asks for permission
  -> Re-entry consent
  -> Host confirms approval
  -> Human-only developer control changes the demo status
  -> reentry.trigger()
  -> Re-entry accepts one Event
  -> Local Connector can claim the queued delivery
  -> Agent opens the canonical page and reads current state
```

The mini-app business state is deliberately in memory. This keeps the playground easy to reset and
avoids adding a database before the workflow is understood. It is suitable for local testing, but
serverless instances can lose or split in-memory state.

## What does `reentry.trigger()` send?

The application does not send a large custom object. It gives the SDK an approved continuation. The
SDK creates one small signed Event from that continuation:

```json
{
  "type": "webmcp.continuation_event",
  "protocol_version": "0.1",
  "event_id": "event_...",
  "correlation_id": "correlation_...",
  "binding_id": "binding_...",
  "issuer_origin": "https://your-host.example",
  "workflow_id": "workflow_...",
  "event_type": "workflow.ready",
  "event_sequence": 1,
  "state_version": 0,
  "occurred_at": "2026-09-04T00:00:00.000Z",
  "canonical_url": "https://your-host.example/?scenario=invoice"
}
```

That Event is sent to `POST /v0.1/events` inside a signed envelope. The SDK adds the signature and
the Receiver checks it. The current protocol intentionally has no arbitrary `data` or nested
business payload. For this playground, the simple useful values are the workflow ID, event type,
state version, and canonical page URL. The business status itself stays in the Host app.

The Event stays small. The mini-app's read-only status route supplies the scenario-specific record
context after the page is reopened, so the Event does not need an arbitrary nested `data` field.

## What does the Local Connector receive?

The Connector first sends its locally stored credential and a one-time claim token to
`POST /v0.1/delivery-claims`. If work is waiting, Re-entry returns a small delivery lease:

```json
{
  "duplicate": false,
  "lease": {
    "delivery_id": "delivery_...",
    "event_id": "event_...",
    "attempt": 1,
    "lease_token": "short-lived-token",
    "lease_expires_at": "2026-09-04T00:01:00.000Z",
    "continuation": {
      "correlation_id": "correlation_...",
      "workflow_id": "workflow_...",
      "event_type": "workflow.ready",
      "event_sequence": 1,
      "state_version": 0,
      "occurred_at": "2026-09-04T00:00:00.000Z",
      "canonical_url": "https://your-host.example/?scenario=invoice",
      "instruction": "Allow Ledgerly to return when this invoice is ready for the next review."
    },
    "receipt": {
      "type": "webmcp.continuation_receipt",
      "protocol_version": "0.1",
      "grant_id": "grant_...",
      "correlation_id": "correlation_...",
      "issuer_origin": "https://your-host.example",
      "workflow_id": "workflow_...",
      "event_type": "workflow.ready",
      "canonical_url": "https://your-host.example/?scenario=invoice",
      "expires_at": "2026-09-04T00:30:00.000Z",
      "human_boundary": "explicit_receiver_consent",
      "continuation_mode": "open_canonical_page_read_current_state"
    }
  }
}
```

In simple terms, the Connector reads three important things:

- **Canonical URL** — which page to open.
- **Instruction** — the short, bounded reason the user approved. It is context, not a command from
  the cloud.
- **Local binding** — the Connector's locally selected workspace and Codex destination. This does
  not come from the Event; it is local configuration owned by the user.

The Connector validates the lease and continuation, then its Codex adapter builds a short local
message: open the exact page, read its current state, and continue only up to the human boundary.
The Connector does not receive the Host private key or Organization API key.

The status route returns a small, flat context object:

```json
{
  "scenario_id": "invoice",
  "workflow_id": "ledgerly-invoice-1042",
  "workflow_type": "invoice_approval",
  "record_id": "INV-1042",
  "status": "queued",
  "state_version": 1,
  "event_id": "event_...",
  "canonical_url": "https://your-host.example/?scenario=invoice",
  "agent_instruction": "Read invoice INV-1042 and prepare the next safe review step. Do not approve or pay it.",
  "human_boundary": "explicit_receiver_consent"
}
```

The agent-facing WebMCP tools are:

- a read-only tool that fetches this current state;
- a consent tool that uses the same Host consent action as the visible customer button.

The developer switch and `/api/reentry/playground/advance` remain human-only and are never exposed
as WebMCP tools.

Remaining limitations:

- WebMCP availability depends on the browser exposing `document.modelContext.registerTool`; the
  ordinary customer button remains available when it does not.
- The in-memory state store is suitable for this local playground but can split across Vercel
  serverless instances. A durable Host store is still needed for production-like multi-instance
  testing.

## Next playground increments

1. Verify each mini-app from consent through Event acceptance.
2. Connect a paired Local Connector and verify that it claims one delivery.
3. Reopen each canonical page and verify its WebMCP status tool reads current state.
4. Add durable storage only if hosted multi-instance testing needs state to survive requests.
