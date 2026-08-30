# WebMCP Continuation Infrastructure — MVP2

MVP2 is now a composable continuation infrastructure reference with TenderRelay as one
replaceable Host Adapter. Its purpose is to show how any conforming business application can
authorize a bounded future event, send a signed prompt-free signal to a Receiver, and return
an Agent to fresh page state and stage-specific Site Tools.

It proves a local modular mechanism. It does not claim that Codex exposes a public wake API,
that this is an adopted standard, or that the local JSON store is production durability.

## Architecture

```text
Business Host Adapter
  domain state + human UI + event transition + Site Tools
             |
             | signed manifest/event via Host SDK
             v
ContinuationApplication
  atomic Host-transition + Receiver-reservation composition
             |
             v
ReceiverCore
  consent gate + Grants + scope + signatures + dedupe + run budget
             |
             v
AgentContinuationAdapter
  dry-run | Codex Desktop demo | future supported transport
             |
             v
canonical Host page -> fresh state -> stage tools -> visible draft -> human boundary
```

The two transport contracts remain separate:

1. Website Backend → Receiver is the project-owned protocol in [`protocol/`](protocol/).
2. Receiver → Agent runtime is a replaceable adapter and remains platform-specific.

## Module map

| Module | Responsibility | Domain-specific? |
|---|---|---|
| `lib/infrastructure/protocol.mjs` | Canonical serialization, strict schemas, signatures, validation | No |
| `lib/infrastructure/host-sdk.mjs` | Manifest and event issuance for a business backend | No |
| `lib/infrastructure/receiver-core.mjs` | Human-approved Grants, scope, expiry, dedupe, reservation, dispatch | No |
| `lib/infrastructure/continuation-application.mjs` | Compose Host, Receiver, store, and delivery transaction boundaries | No |
| `lib/infrastructure/state-store.mjs` | Replaceable memory and atomic JSON persistence | No |
| `lib/infrastructure/agent-adapter.mjs` | Agent adapter contract, fixed instruction builder, dry-run adapter | No |
| `lib/adapters/codex-desktop-demo.mjs` | Local `codex queue` implementation | Codex-specific |
| `lib/apps/tenderrelay/` | Tender state, transitions, manifest profile, and artifact rules | Yes |
| `public/webmcp-stage-tools.js` | AbortSignal-based replacement of obsolete Site Tools | No |
| `public/tender.js` | TenderRelay's stage-specific Site Tool definitions | Yes |
| `examples/incident-response-host.mjs` | Second non-tender Host Adapter used for portability proof | Yes, fixture |

[`lib/core.mjs`](lib/core.mjs) is only a public export surface; it contains no business or
Receiver implementation.

## Run

Requires Node.js 20 or newer. No package installation is needed.

```bash
npm test
npm run test:conformance
npm start
```

Open:

- Applicant: <http://127.0.0.1:43118/tenders/TENDER-102>
- Reviewer: <http://127.0.0.1:43118/reviewer/tenders/TENDER-102>
- Diagnostics: <http://127.0.0.1:43118/diagnostics/continuation>

Dry-run is the default and never contacts Codex. The local Desktop demonstration uses one
adapter:

```bash
CONTINUATION_RECEIVER_MODE=live \
CONTINUATION_CONTEXT_ID=<current-codex-task-id> \
npm start
```

The older `TENDERRELAY_*` environment variable names remain accepted as compatibility
aliases. The generic names are:

- `CONTINUATION_STATE_FILE`
- `CONTINUATION_EVENT_SECRET`
- `CONTINUATION_KEY_ID`
- `CONTINUATION_RECEIVER_MODE`
- `CONTINUATION_CONTEXT_ID`
- `CONTINUATION_CODEX_BIN`
- `CONTINUATION_PUBLIC_MODE=true` rejects the development fallback signing secret.

## Genuine external-sender path

The generic Receiver ingress is:

```text
POST /api/continuations/events
```

It accepts the strict signed event schema, not arbitrary Agent instructions. To demonstrate
an actual separate process crossing this boundary:

1. Start the server in dry-run mode.
2. In the applicant UI, attach the one-run Grant and submit the bid.
3. Run:

```bash
node examples/external-backend-simulator.mjs
```

The simulator asks the synthetic Host backend to atomically commit its legitimate business
transition and pending event intent without inline delivery, then sends the resulting signed
event to the Receiver endpoint. It imports no Receiver code. This proves the modular network
ingress; it does not prove a public OpenAI Agent wake transport.

## Plug in another business application

A Host Adapter supplies six small lifecycle methods:

```js
const hostAdapter = {
  id: "my-host",
  createInitialState(),
  publicState(state),
  authoritativeWorkflow(state),
  issueManifest(state),
  attachContinuationBinding(state, binding),
  audit(state),
};
```

Its domain code performs the legitimate business transition and uses
`ContinuationHostSdk.issueEvent(...)` to create the signed event. It must own:

- user and tenant authorization;
- authoritative workflow state and artifact revisions;
- canonical URL construction;
- stage-specific Site Tools;
- human-controlled consequential actions; and
- its transactional event intent.

Then compose it without changing Receiver Core:

```js
const application = new ContinuationApplication({
  hostAdapter,
  receiver: new ReceiverCore({
    adapter: agentAdapter,
    expectedOrigin: hostOrigin,
    keyResolver,
  }),
  stateStore,
});
```

[`examples/incident-response-host.mjs`](examples/incident-response-host.mjs) demonstrates a
different workflow, event, canonical URL, tool inventory, and artifact using this exact
composition. Its conformance test verifies that no TenderRelay branch is required in the
Receiver.

## Plug in another Agent runtime

Implement one method behind `AgentContinuationAdapter`:

```js
class MyAgentAdapter extends AgentContinuationAdapter {
  constructor() {
    super({ id: "my-agent", proofClassification: "supported-public" });
  }

  async deliver({ event, grant, instruction, runId }) {
    // Send the Receiver-derived fixed instruction to the bound managed context.
    return { status: "queued", externalRunId: runId };
  }
}
```

The Host never imports this adapter and never supplies an arbitrary prompt. Replacing the
Agent transport does not change protocol validation or business-domain code.

## Safety and reliability changes from the original spike

- Manifest and event payloads are strict, signed, and canonically serialized.
- Grant activation requires an explicit human UI action and defaults to one execution.
- Event replay returns the original logical run and cannot dispatch a second run.
- Host transitions create a persisted event intent; inline flows persist that transition and
  Receiver reservation together before delivery.
- Host state and private Receiver records occupy separate state namespaces.
- Draft mutations compare both workflow state version and artifact revision.
- Initial bid submission and Grant activation are no longer available as Site Tools.
- Re-entry exposes draft-only tools; consequential submission remains unavailable.
- Diagnostics redact signature values and distinguish Host, Receiver, and Agent Adapter.
- A shared stage-tool registry aborts obsolete tools whenever page state changes.

## Verification

The deterministic suite covers protocol tampering, human consent, Grant scope, replay,
revision conflicts, adapter replacement, Site Tool lifecycle, the human boundary, split
external ingress, and a second non-tender Host Adapter.

The current implementation still needs a production database, transactional outbox,
multi-issuer key management, revocation UI, authenticated Host users, and a supported public
Receiver-to-Agent transport before production use.
