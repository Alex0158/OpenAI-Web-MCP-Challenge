# Re-entry Host SDK

> **Cloud Receiver dependency notice — 2026-09-02:** The former loopback and hosted Cloud Receiver
> implementations are deprecated and must not be used for new integrations or production traffic.
> This SDK documents a reusable Host boundary; connect it only to a separately accepted replacement
> Receiver service.

A small Next.js-compatible library that bundles Host signing and Receiver calls with the browser
action that joins ordinary page UI, WebMCP, and Re-entry-owned consent.

> Current boundary: this package is verified against the loopback Cloud Receiver and is prepared
> for npm publication. It does not replace Host authentication, app-specific tool schemas,
> business state, deployment, or final-effect verification. The sample proves JavaScript
> registration and composition; genuine Codex discovery and invocation still require a supported
> built-in Browser runtime.

## The complete idea

```text
page button ---------\
                     -> requestReentry() -> Host route -> signed Manifest -> Re-entry consent
WebMCP Site Tool ----/

authenticated Re-entry approval -> Host confirms status -> Host stores opaque binding

later Host business event -> signed Event -> Re-entry -> Local Connector -> fresh Codex session
```

The first action creates permission to return later; it does not start the later work. A WebMCP
invocation may receive the Browser's normal safety review, but that review is not a Re-entry Grant.
Only the authenticated Re-entry approval can create the Grant and binding.

## Developer-agent integration guide

This section is the practical contract for an agent integrating Re-entry into an existing Host
application. Read it before changing the Host application. The current path is **account-first**:
the developer owns the Host organization credentials, while the end user owns the Re-entry account
and connected Mac. The older Host-issued pairing and Host-forwarded consent examples remain in the
legacy appendix at the end of this file and must not be used for a new integration.

### The one-sentence goal

Let a person approve one bounded future continuation in Re-entry, then let the Host application
send a later business Event that causes the user's Local Connector to open a fresh Codex session on
the authoritative Host page.

### The four roles

| Role | Lives where | Owns | Must not receive |
| --- | --- | --- | --- |
| Host application | Developer's website and backend | User identity, workflow state, business rules, Host signing key, continuation database | Connector bearer, Re-entry browser cookie |
| Host SDK | Installed inside the Host application | Signing, Receiver HTTP calls, browser handoff UI, WebMCP registration | Nothing beyond what its runtime requires |
| Re-entry Cloud Receiver | Re-entry service | Account consent, connected devices, Grants, bindings, Events, delivery leases | Host private signing key |
| Local Connector | User's Mac | Outbound polling, delivery claim, local Codex launch | Organization API key, Host private key |

The SDK is not a replacement for the Host backend. It is a small library inside it. The Cloud
Receiver and Local Connector are separate services in the overall product.

### The credential split

There are three different credentials. Keeping them separate is part of the protocol:

1. **Organization API key** — belongs to the developer's Re-entry organization. It authenticates
   Host setup and consent-session/status calls. It stays on the Host backend.
2. **Host signing key** — the Host backend signs Manifests and Events with its Ed25519 private key.
   The Receiver stores only the derived public key. The private key stays on the Host backend.
3. **Connector credential** — belongs to the end user's connected Mac. It is issued once after the
   user approves the Mac and is stored locally with restrictive permissions. It is used only by
   the Local Connector to claim delivery.

The browser may see a consent URL, a consent-session ID, and a safe continuation ID. It must never
see an organization API key, Host private key, Connector credential, or private binding.

### The complete lifecycle

```text
DEVELOPER SETUP
──────────────────────────────────────────────────────────────────────────────
Developer dashboard
  create Re-entry account -> create organization -> reveal organization API key once
                                      │
                                      ▼
Host backend
  keeps Ed25519 private key -> SDK registers derived public key
                                      │
                                      └── POST /v0.1/host-keys

END-USER MAC SETUP
──────────────────────────────────────────────────────────────────────────────
User runs `npx @4xeoz/re-entry install --codex-cd /absolute/project`
  -> Connector starts device authorization
  -> Re-entry opens in the user's browser
  -> user signs in or registers
  -> user approves "Connect this Mac"
  -> Connector polls until approved
  -> Connector stores its credential and installs a macOS LaunchAgent

FIRST ACTION: ASK FOR FUTURE CONSENT
──────────────────────────────────────────────────────────────────────────────
Host button OR WebMCP Site Tool
  -> one browser function: requestReentry()
  -> Host route: POST /api/reentry/consent
  -> server loads Host user + current workflow
  -> SDK signs a Manifest
  -> SDK calls Receiver: POST /v0.1/consent-sessions
  <- Receiver returns consent_url + consent_session_id
  -> SDK shows its top-layer handoff dialog
  -> user clicks "Review in Re-entry"
  -> Receiver renders the real consent page
  -> user approves/declines and chooses a connected Mac
  -> Receiver creates a Grant and binding only after approval
  -> popup sends completion message to the Host page
  -> Host route checks Receiver: GET /v0.1/consent-sessions/:id
  -> Host stores the binding and returns only continuation_id to the browser

LATER BUSINESS EVENT
──────────────────────────────────────────────────────────────────────────────
Host business logic decides that the event really happened
  -> Host loads the stored binding and current workflow from its database
  -> SDK signs an Event
  -> SDK calls Receiver: POST /v0.1/events
  -> Receiver verifies the Event, spends the Grant's run, and creates delivery
  -> Local Connector polls: POST /v0.1/delivery-claims
  <- Connector receives a short lease; the Codex activation receives credential-free context
  -> Connector starts a fresh `codex exec` process
  -> Codex opens the canonical page, reads current state, and stops at the human boundary
```

The Host page's dialog is only a handoff surface. The consent page rendered by Re-entry is the
authority that knows the account and connected devices. A popup `postMessage` only tells the Host
page that the popup changed; the Host backend must still confirm the status with the Receiver.

### What the integrating agent should build

For a normal Host application, the smallest useful integration contains:

1. One server-only SDK module that reads the environment variables and creates `reentry`.
2. One server route that creates the signed Manifest and consent session.
3. One server route that confirms approval and stores the private binding.
4. One Client Component that creates `requestReentry` and uses it for both a normal button and a
   top-level WebMCP Site Tool.
5. One Host database record that maps the approved continuation to the authenticated Host user
   and workflow.
6. One server-side business-event handler that loads that record and calls `reentry.sendEvent`.

The agent must use the Host application's existing authentication, workflow database, page routes,
and business transitions. The SDK does not invent those things. It only provides the Re-entry
connection and enforces the protocol boundary.

Do not build these as part of the Host integration:

- a second pairing-code system;
- a browser-side Receiver client with server credentials;
- a generic "click this page" Site Tool;
- a browser-side binding store;
- an Event endpoint that trusts a binding or state version supplied by the browser; or
- a final consequential business action that bypasses the Host application's human boundary.

## Install

```sh
npm install @4xeoz/re-entry-sdk
```

The package name in this checkout is `@4xeoz/re-entry-sdk`. Its manifest is prepared for public
publication, but this repository state alone does not prove that the package is already available
from the npm registry. If registry installation is not available yet, use the included sample,
install the package from this checkout as a local file dependency, or publish it through the normal
npm release process. Do not copy the SDK source into the Host application or edit the bundled Core
dependency by hand.

The package has three entrypoints:

| Import | Runtime | Responsibility |
| --- | --- | --- |
| `@4xeoz/re-entry-sdk/server` | Node server | Sign Manifests and Events; call Re-entry |
| `@4xeoz/re-entry-sdk/client` | browser | Build the shared action, register its Site Tool, and open Re-entry consent |
| `@4xeoz/re-entry-sdk/next` | Next.js server | Small Route Handler adapters |

### Public methods at a glance

| Method | Where to call it | What goes in | What comes out |
| --- | --- | --- | --- |
| `sdk.registerHostKey({ hostId })` | Host setup/server | A stable Host ID | Receiver registration result |
| `sdk.createManifest(fields)` | Host server | Current workflow, display copy, and Grant request | Signed Manifest; no network call |
| `sdk.createConsentSession({ manifest, hostSubjectRef })` | Host server | Signed Manifest and authenticated Host subject | Consent URL and session ID |
| `sdk.getConsentSession({ consentSessionId })` | Host server | Session ID | Pending, declined, expired, or approved status; approved status includes the binding |
| `sdk.createEvent(fields)` | Host server | Binding and current workflow | Signed Event; no network call |
| `sdk.sendEvent(fields)` | Host server | Binding and current workflow | Receiver acceptance; delivery is still pending |
| `createReentryConsentAction(options)` | Browser | Host callbacks for create and confirm | One async function for a button and WebMCP |
| `registerReentryWebMcpTool(options)` | Top-level browser page | Tool metadata and the shared action | Registered/unavailable result |

The SDK's synchronous methods only create signed protocol objects. Its asynchronous methods cross a
network boundary and can fail because the Receiver is unavailable, rejects the request, or returns a
stale/expired result. The SDK does not silently retry these calls.

`decideConsent` and `createConsentDecisionRoute` still exist for compatibility with the earlier
Host-forwarded preview. A new account-first integration must let the Re-entry consent page make the
decision and use `getConsentSession` for server confirmation instead.

## 1. Server routes

Keep every value below in server environment configuration:

```sh
HOST_ORIGIN=https://your-app.example
RECEIVER_ORIGIN=https://your-reentry.example
REENTRY_KEY_ID=host_key_your_app
REENTRY_PRIVATE_KEY='-----BEGIN PRIVATE KEY----- ...'
REENTRY_ORGANIZATION_API_KEY=re_org_...
```

```js
import { createHostSdk } from "@4xeoz/re-entry-sdk/server";

const reentry = createHostSdk({
  origin: process.env.HOST_ORIGIN,
  receiverOrigin: process.env.RECEIVER_ORIGIN,
  privateKey: process.env.REENTRY_PRIVATE_KEY,
  keyId: process.env.REENTRY_KEY_ID,
  organizationApiKey: process.env.REENTRY_ORGANIZATION_API_KEY,
});

await reentry.registerHostKey({ hostId: "host_your_app" });
```

`registerHostKey` sends only the public key derived from the private key. Call it during controlled
Host setup; do not put key registration in browser code.

### Create and confirm consent

The consent route must derive the authenticated Host user and current workflow from server state:

```js
const manifest = reentry.createManifest(loadCurrentHostManifest());
const session = await reentry.createConsentSession({
  manifest,
  hostSubjectRef: authenticatedHostUser.id,
});

return Response.json({
  title: manifest.display.title,
  reason: manifest.display.reason,
  consent_url: session.consent_url,
  consent_session_id: session.consent_session_id,
});
```

The status route must re-read Receiver state and retain the binding in the Host database. Never
return the binding to browser JavaScript:

```js
const status = await reentry.getConsentSession({ consentSessionId });
if (status.status !== "approved") throw new Error("consent_not_approved");

const continuation = await hostDatabase.continuations.create({
  hostUserId: authenticatedHostUser.id,
  workflowId: currentWorkflow.id,
  binding: status.binding,
});

return Response.json({
  status: "approved",
  continuation_id: continuation.id,
});
```

## 2. Use one JavaScript function for UI and WebMCP

This is the main integration seam. `requestReentry` is an ordinary async JavaScript function. The
normal button and the Site Tool receive that exact function:

```js
"use client";

import {
  createReentryConsentAction,
  registerReentryWebMcpTool,
} from "@4xeoz/re-entry-sdk/client";

const requestReentry = createReentryConsentAction({
  async createConsentSession(input) {
    const response = await postJson("/api/reentry/consent", input);
    return {
      title: response.title,
      reason: response.reason,
      consentUrl: response.consent_url,
      consentSessionId: response.consent_session_id,
    };
  },
  async confirmConsentSession({ consentSessionId }) {
    const response = await postJson("/api/reentry/consent/status", {
      consent_session_id: consentSessionId,
    });
    return {
      status: response.status,
      continuationId: response.continuation_id,
    };
  },
});

button.addEventListener("click", () => requestReentry({}));

await registerReentryWebMcpTool({
  name: "request_codex_reentry",
  description: "Ask the signed-in user to approve one future Codex continuation. This creates consent; it does not trigger the later business event.",
  inputSchema: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
  annotations: { readOnlyHint: false },
  execute: requestReentry,
});
```

`registerReentryWebMcpTool` uses `document.modelContext.registerTool(...)` on the top-level page. It
returns `{ registered: false, reason: "webmcp_unavailable" }` when WebMCP is unavailable; the normal
button remains the visible path. Do not register from an iframe or use the declarative form API.

The SDK prompt opens the exact Re-entry URL from a human click, validates the popup window, Receiver
origin, session identifier, and completion shape, then calls the Host status route. A popup message
alone cannot produce `{ status: "approved" }` from the shared action.

## 3. Send the later business Event from the Host server

The business event is separate from the WebMCP action and separate from consent:

```js
const continuation = await hostDatabase.continuations.loadForUserAndWorkflow({
  continuationId,
  hostUserId: authenticatedHostUser.id,
  workflowId: currentWorkflow.id,
});

await reentry.sendEvent({
  binding: continuation.binding,
  workflow: {
    id: currentWorkflow.id,
    stateVersion: currentWorkflow.stateVersion,
    canonicalUrl: currentWorkflow.canonicalUrl,
  },
});
```

The Host backend decides when the real business event happened. Do not expose this endpoint as a
generic Site Tool merely because the initial consent request is a Site Tool.

## What the Host application supplies

The SDK cannot know the Host application's domain. Before integrating it, identify these values in
the Host codebase:

| Host value | Example | Why it matters |
| --- | --- | --- |
| Authenticated Host subject | `user_123` | Associates approval with the correct Host user |
| Stable workflow ID | `order_123` | Tells Codex which business workflow to reopen |
| Workflow type | `order_review` | Describes the kind of workflow, not a tool command |
| Monotonic state version | `42` | Prevents a later Event from using stale Host state |
| Canonical URL | `https://shop.example/orders/order_123` | Gives Codex the exact page to open |
| Display title/reason | `Review this order later?` | Explains the requested continuation to the person |
| Grant expiry | ISO-8601 timestamp | Limits how long the approval remains usable |
| Later business condition | `order.status === "needs_review"` | Decides when the Event is actually sent |

The browser can request an action, but it is not authoritative for any of these values. The server
must load the authenticated user, workflow, state version, and binding from Host-controlled state.

## The current protocol objects

The SDK creates or transports four important objects. A new integration does not need to recreate
these schemas by hand; this list explains what the agent is expected to provide.

### Manifest: the first offer

The Host creates a Manifest before consent. It describes what may happen later:

```js
{
  offerExpiresAt: "2026-09-01T12:00:00.000Z",
  workflow: {
    id: "order_123",
    type: "order_review",
    stateVersion: 1,
    canonicalUrl: "https://shop.example/orders/order_123"
  },
  display: {
    title: "Let Codex return later?",
    reason: "Codex may review this order after the payment update."
  },
  grantRequest: {
    eventType: "order.needs_review",
    grantExpiresAt: "2026-09-08T12:00:00.000Z",
    humanBoundary: "explicit_receiver_consent"
  }
}
```

`createManifest` signs this object with the Host private key. The Manifest is an offer, not yet a
Grant. It does not give Codex permission to act.

### Consent session: the browser handoff

`createConsentSession` sends the signed Manifest from the Host backend to Re-entry. Re-entry returns
an opaque session and a URL. The Host page opens that URL; it does not decide consent itself.

```js
const session = await reentry.createConsentSession({
  manifest,
  hostSubjectRef: authenticatedUser.id,
});

// Safe to return to the browser:
{
  consent_url: session.consent_url,
  consent_session_id: session.consent_session_id
}
```

The Re-entry page authenticates the person's Re-entry account, displays the scope, and lets the
person choose an eligible connected Mac. Only approval creates the Receiver-owned Grant and Host
binding.

### Binding: the server-side continuation reference

After approval, the Host calls `getConsentSession`. The approved response contains the binding that
the Host needs for the later Event. Store it in the Host database, associated with the Host user and
workflow. Treat it as an opaque server value:

```text
Host database
  continuation_id
  host_subject_id
  workflow_id
  binding
  expires_at
```

Return only `continuation_id` to browser code. Do not put the binding in a URL, cookie, local
storage, WebMCP result, prompt, log, or client response.

### Event: the later business fact

When the Host's real business rule fires, load the binding and current workflow on the server:

```js
const continuation = await hostDatabase.continuations.loadForUserAndWorkflow({
  continuationId,
  hostUserId: authenticatedUser.id,
  workflowId: currentWorkflow.id,
});

const acceptance = await reentry.sendEvent({
  binding: continuation.binding,
  workflow: {
    id: currentWorkflow.id,
    stateVersion: currentWorkflow.stateVersion,
    canonicalUrl: currentWorkflow.canonicalUrl,
  },
});
```

`sendEvent` signs the Event and sends it to Re-entry. An accepted Event creates pending delivery;
it does not mean that Codex has finished the work or that a Host-side consequence has happened.

## Recommended Next.js integration layout

The exact filenames may differ, but the responsibilities should remain separate:

```text
app/
  _lib/reentry-server.js       server-only SDK instance and helpers
  api/reentry/consent/route.js creates signed Manifest and consent session
  api/reentry/consent/status/route.js confirms Receiver approval and stores binding
  api/reentry/event/route.js   optional authenticated trigger for a later Event
  components/ReentryAction.jsx Client Component for button + WebMCP Site Tool
```

Keep the organization key and private key imported only by the server module. A Client Component
may call your Host routes with `fetch`, but it must not import `@4xeoz/re-entry-sdk/server`.

### Route 1: create consent

The browser sends only a trigger, or an empty JSON object. The route should:

1. require the Host application's authenticated user;
2. load the current workflow from the Host database;
3. create the signed Manifest with `sdk.createManifest`;
4. call `sdk.createConsentSession` with the authenticated Host subject; and
5. return display fields, `consent_url`, and `consent_session_id`.

Do not accept `hostSubjectRef`, `workflow.id`, `stateVersion`, `canonicalUrl`, or a binding from
the browser as authoritative input.

### Route 2: confirm consent

The browser sends only the consent-session ID after the Re-entry popup reports completion. The route
should:

1. require the Host application's authenticated user;
2. load the pending Host-side record for that user and workflow;
3. call `sdk.getConsentSession` with the session ID;
4. require `status === "approved"`;
5. store the returned binding in the Host database; and
6. return a safe `continuation_id`.

The popup completion message is not proof of approval. The Receiver status response is the source
of truth.

### Route 3: send the later Event

This route or background job should be triggered by Host business logic. It should:

1. authenticate and authorize the Host user or internal job;
2. load the continuation by Host-owned ID;
3. load the current workflow and current state version;
4. verify that the continuation belongs to that workflow; and
5. call `sdk.sendEvent` on the server.

The later Event route is not the same thing as the consent request. Do not expose it as a generic
WebMCP Site Tool just because the first consent request is a Site Tool.

The `@4xeoz/re-entry-sdk/next` entrypoint provides small Route Handler adapters for these server
boundaries. The callbacks are still responsible for loading Host authentication, workflow state,
and bindings. `createConsentDecisionRoute` represents the older Host-forwarded decision path and is
not the normal account-first browser flow.

## Using Re-entry with any business logic

Use the same two-phase pattern for any domain:

```text
PHASE 1: PERMISSION
Host workflow is visible
  -> person approves one future continuation in Re-entry
  -> Host stores continuation binding

PHASE 2: BUSINESS EVENT
Host business condition becomes true
  -> Host sends signed Event
  -> Receiver creates one delivery
  -> Connector opens Codex on the canonical page
```

Examples:

- **Commerce:** ask once when an order is created; send an Event when payment needs review.
- **Support:** ask once for a ticket; send an Event when the customer replies.
- **Travel:** ask once for an itinerary; send an Event when a price or schedule changes.
- **Procurement:** ask once for a bid; send an Event when a clarification arrives.
- **Documents:** ask once for a review; send an Event when a required attachment is uploaded.

The SDK does not inspect an order, ticket, itinerary, bid, or document. The Host application owns
that logic. Re-entry only requires a stable workflow identity, current state version, canonical
page, approved binding, and a later signed Event.

## Browser behavior and WebMCP rules

The browser integration has two layers:

1. The Host SDK renders a small top-layer dialog branded for Codex/Re-entry. It explains the
   handoff and gives the person a **Review in Re-entry** button.
2. Re-entry renders the actual account consent page. It owns sign-in, approval/decline, and device
   selection.

Use one action for both entry points:

```text
normal Host button ────────┐
                           ├── createReentryConsentAction(...)
top-level WebMCP tool ────┘
```

Rules for the Client Component:

- call `createReentryConsentAction` once and reuse the returned function;
- pass that exact function to the normal button and to `registerReentryWebMcpTool({ execute })`;
- register the tool from the top-level page with `document.modelContext.registerTool`;
- use a closed input schema when the action needs no parameters;
- describe the tool as requesting future consent, not performing the later business action;
- keep the normal button when WebMCP is unavailable; and
- let the SDK reject overlapping requests and visible popup-blocker failures.

The SDK validates the exact Receiver origin, popup window, consent-session ID, and completion
message. It then requires the Host status route to confirm approval. A WebMCP safety review and a
popup message are not substitutes for the authenticated Re-entry Grant.

## Persistence and ownership checklist

The Host application must persist enough information to answer these questions after a restart:

1. Which Host user approved the continuation?
2. Which workflow did they approve?
3. Which Host-side continuation ID represents it?
4. Which opaque binding belongs to that continuation?
5. Is it still active and within the intended Host business lifetime?

The sample stores the binding in a process-local Map so it is easy to run. That Map is deliberately
non-production and is cleared when Next.js stops. A real Host must use its database and must scope
every lookup to the authenticated Host user and workflow.

The Host owns business records and continuation references. Re-entry owns account identity,
connected-device identity, Grant state, Event reservation, and delivery state. Do not duplicate
Receiver authority in the Host database.

## Errors and safe handling

The SDK uses bounded requests, strict response validation, exact origins, and no automatic retry.
An integrating agent should keep failures visible:

- if the user declines or cancels, do not create a continuation;
- if the popup is blocked, show the user how to allow it and let them retry;
- if WebMCP is unavailable, keep the normal button available;
- if Receiver status is not approved, do not store a binding or return success;
- if a Manifest, binding, workflow, or state version is stale, show a typed failure;
- if `sendEvent` times out, do not blindly create a second Event without deciding how the Host will
  inspect or safely reconcile the unknown outcome; and
- treat a `202` Event acceptance as “Receiver accepted the Event,” not “Codex completed the task.”

The Host should add its own authentication, authorization, CSRF protection, rate limiting, audit
logging, and production secret rotation. Those are Host/deployment responsibilities, not hidden SDK
fallbacks.

## Integration definition of done

An agent should consider the integration complete only when all of these are true:

1. `@4xeoz/re-entry-sdk/server` is used only in server code.
2. The organization key and Host private key are loaded from server secret configuration.
3. The Host public key is registered with the Receiver.
4. A real Host user and current workflow create the Manifest server-side.
5. The normal button and WebMCP Site Tool call the same browser action.
6. The Re-entry popup is opened from the SDK handoff and approval is confirmed server-to-server.
7. The binding is stored only in the Host database and never returned to browser JavaScript.
8. The later business rule sends the Event from the Host backend, not from the browser.
9. The canonical page exposes the current Host state and the tools Codex is allowed to use.
10. Decline, popup blocking, WebMCP absence, stale state, and Receiver failure remain visible.
11. The Host tests the path with a connected Local Connector, while keeping Browser/WebMCP and final
    Host-effect claims separate from SDK unit-test evidence.

## Verification for an integrating agent

From the SDK package directory:

```sh
npm run verify
```

For the included sample:

```sh
cd app
npm install
npm run build
npm run dev
```

Then test both paths:

1. Open the sample in an ordinary browser and click the normal button.
2. Complete the Re-entry account consent and connected-Mac selection.
3. Confirm that the Host status route returns a continuation ID but not a binding.
4. Use the sample's separate later-event control or a real Host business transition.
5. Run the Connector's `claim-once` path and inspect that a fresh Codex process starts.
6. In a compatible built-in Browser, verify Site Tool discovery separately from ordinary browser
   button behavior.

The current sample's process-local binding store resets on restart. The current Local Connector
starts a fresh `codex exec` session; it does not prove an existing Codex Browser-session attachment,
cross-machine reliability, production deployment, or final Host-effect verification.

## Run the included Next.js sample (historical receiver integration)

> This sample's Receiver configuration targets the deprecated local Cloud Receiver. Keep the
> sample for SDK contract evidence only; do not use its setup steps for a new production
> integration until a replacement Receiver is accepted.

The sample page uses the same function for its button and `request_codex_reentry`, confirms consent
server-side, retains the opaque binding in a process-local demo store, and exposes a separate button
that simulates the later business event.

1. Start the historical local Cloud Receiver preview:

   ```sh
   cd runtime/cloud-receiver
   npm install
   npm start
   ```

   It listens on `http://127.0.0.1:43224` by default. This is a historical replay only. Create a Re-entry account, an organization,
   an organization API key, and a connected Mac before testing the Host sample. The Receiver is a
   local preview; it is not a production identity or deployment environment.

2. Start the Local Connector on the Mac where Codex should open. From the repository root or the
   intended Host project directory, use an absolute Codex workspace:

   ```sh
   npx @4xeoz/re-entry install \
     --receiver http://127.0.0.1:43224 \
     --codex-cd /absolute/path/to/your/project
   ```

   Complete the Re-entry account approval in the browser. The Connector stores its own local
   credential and polls the Receiver; the Host API key never goes to the Connector.

3. Put these server-only values in `runtime/host-sdk/app/.env.local`:

```dotenv
HOST_ORIGIN=http://127.0.0.1:43220
RECEIVER_ORIGIN=http://127.0.0.1:43224
REENTRY_HOST_ID=host_sdk_demo
REENTRY_KEY_ID=host_key_sdk_demo
REENTRY_ORGANIZATION_API_KEY=re_org_replace_me
REENTRY_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
replace-with-an-ed25519-private-key
-----END PRIVATE KEY-----"
```

4. Run the app:

```sh
cd runtime/host-sdk/app
npm install
npm run dev
```

Open `http://127.0.0.1:43220`. In a compatible Codex built-in Browser, inspect Site Tools for
`request_codex_reentry`; in an ordinary browser, click **Approve a future return**. The sample's
process-local continuation store is deliberately non-production and clears when Next.js stops.

## Give this to a coding agent

```text
Integrate the reusable Re-entry Host SDK into this Host application. First read
runtime/host-sdk/README.md and the example under runtime/host-sdk/app. Do not target the deprecated
runtime/cloud-receiver package or its former hosted alias; use only a separately accepted Receiver
origin. Inspect the Host's existing
authentication, workflow model, canonical page, and database before editing. Install
@4xeoz/re-entry-sdk in the Host application; import its server and Next entrypoints only from
server code, and its client entrypoint only from a top-level Client Component. Keep the organization
API key and Ed25519 private key in server secret configuration and out of browser code, logs, prompts,
and git. Add a server-only SDK module. Add one authenticated route that loads the current Host user
and workflow, creates a signed Manifest, and creates a Re-entry consent session. Add a second route
that receives only a consent-session ID, re-reads Receiver status, requires approved status, stores
the binding against the authenticated Host user and workflow, and returns only a safe continuation
ID. In the top-level Client Component, create one function with createReentryConsentAction; call
that exact function from the normal UI and pass it as execute to registerReentryWebMcpTool. Keep the
Site Tool schema closed and describe that it requests future consent; it must not trigger the later
business event. When the real business condition occurs, load the binding and current workflow on
the Host server and call reentry.sendEvent. Do not trust browser-supplied identity, workflow state,
binding, or consent. Do not use the legacy Host-forwarded consent-decision path for the new flow.
Preserve the normal UI when WebMCP is unavailable. Run the SDK tests and Host build, then report
Browser/WebMCP, Connector, deployment, and final Host-effect evidence separately.
```

Verify with Node 24:

```sh
npm run verify
cd app && npm run build
```

<details>
<summary>Legacy Host-forwarded consent notes</summary>

The material below describes the superseded Host-forwarded decision preview and is kept only for
traceability.

This is the smallest reusable Host integration package around `reentry-core`. It is compatible
with Next.js because it uses standard server `Request`/`Response` objects and does not depend on
React or Next at runtime.

It has three deliberate entrypoints:

| Entry point | Runs in | Job |
| --- | --- | --- |
| `@4xeoz/re-entry-sdk/server` | Host server only | Register a Host key; sign Manifests and Events; create consent sessions; send decisions and Events to Reentry |
| `@4xeoz/re-entry-sdk/client` | Browser only | Render a small top-layer consent-looking prompt |
| `@4xeoz/re-entry-sdk/next` | Next.js server route | Turn the server methods into `GET`/`POST` handlers |

The browser entrypoint never sees the Host private key. The prompt is only UI: it returns
`{ action: "approve" }` or `{ action: "decline" }`; it does not create a Grant or replace the
Receiver's consent authority. The Host server must send that action through the decision route.

## Publish the SDK

The package name is `@4xeoz/re-entry-sdk`, and the reusable core is bundled inside the tarball. From this
directory, publish it with an npm account that owns the name:

```sh
npm login
npm publish --access public
```

Developers can then install it with:

```sh
npm install @4xeoz/re-entry-sdk
```

## Get started

Use this flow to hook the host app into Reentry quickly.

### 1) Install

For local development, use the checkout directly:

```sh
cd /path/to/OpenAI-Web-MCP-Challenge/runtime/host-sdk
npm install
```

### 2) Configure your server environment

Set these values in your host server environment only (never in browser/client code):

```sh
HOST_ORIGIN=https://your-app.example
RECEIVER_ORIGIN=https://your-reentry.example
REENTRY_KEY_ID=host_key_your_app
REENTRY_PRIVATE_KEY=your_host_private_key
REENTRY_ORGANIZATION_API_KEY=re_org_...
```

### 3) Create the Host SDK instance

Call this from a Node server module or Next.js route handler:

```ts
import { createHostSdk } from "@4xeoz/re-entry-sdk/server";

export const reentry = createHostSdk({
  origin: process.env.HOST_ORIGIN!,
  receiverOrigin: process.env.RECEIVER_ORIGIN!,
  privateKey: process.env.REENTRY_PRIVATE_KEY!,
  keyId: process.env.REENTRY_KEY_ID!,
  organizationApiKey: process.env.REENTRY_ORGANIZATION_API_KEY!,
});
```

<details>
<summary>Quick design check</summary>

```sh
cd runtime/host-sdk
npm run verify
```
</details>

`privateKey` and the Receiver origin configuration belong in the Host server environment. Do not
import `server` from a Client Component.

The server object exposes these operations:

```js
await sdk.registerHostKey({ hostId: "host_001" });
const manifest = sdk.createManifest(hostOwnedManifestFields);
const session = await sdk.createConsentSession({
  manifest,
  hostSubjectRef: authenticatedUser.id,
});
const decision = await sdk.decideConsent({
  challengeId: session.challenge.challenge_id,
  consentToken: session.consent_token,
  hostSubjectRef: authenticatedUser.id,
  action: "approve",
});
const signedEvent = sdk.createEvent(hostOwnedEventFields);
const acceptance = await sdk.sendEvent(hostOwnedEventFields);
```

`registerHostKey` sends only the derived public key. `createManifest` produces the signed offer.
`createConsentSession` sends the signed Manifest to Reentry and returns a public challenge plus one
opaque consent token. `decideConsent` sends the user's decision to Reentry; approval returns only a
public binding. `sendEvent` signs an Event and calls `POST /v0.1/events`. None of these calls retry
automatically.

The organization API key is accepted only by the server entrypoint. It is never part of the
browser bundle or the Browser SDK prompt.

## Next.js route handlers

`app/api/reentry/manifest/route.js`:

```js
import { createManifestRoute } from "@4xeoz/re-entry-sdk/next";
import { sdk } from "../sdk";

export const GET = createManifestRoute({
  sdk,
  async getManifestInput() {
    return loadManifestFieldsFromHostDatabase();
  },
});
```

`app/api/reentry/event/route.js`:

```js
import { createEventRoute } from "@4xeoz/re-entry-sdk/next";
import { sdk } from "../sdk";

export const POST = createEventRoute({
  sdk,
  async getEventInput({ body }) {
    const workflow = await loadCurrentWorkflowFromHostDatabase();
    const binding = await loadBindingFromHostDatabase(body.bindingId);
    return {
      binding,
      workflow: {
        id: workflow.id,
        stateVersion: workflow.stateVersion,
        canonicalUrl: workflow.canonicalUrl,
      },
    };
  },
});
```

`app/api/reentry/consent/route.js`:

```js
import { createConsentSessionRoute } from "@4xeoz/re-entry-sdk/next";
import { sdk } from "../sdk";

export const POST = createConsentSessionRoute({
  sdk,
  async getConsentSessionInput() {
    const user = await requireAuthenticatedUser();
    const fields = await loadManifestFieldsFromHostDatabase();
    return {
      manifest: sdk.createManifest(fields),
      hostSubjectRef: user.id,
    };
  },
});
```

`app/api/reentry/consent/decision/route.js`:

```js
import { createConsentDecisionRoute } from "@4xeoz/re-entry-sdk/next";
import { sdk } from "../sdk";

export const POST = createConsentDecisionRoute({
  sdk,
  async getConsentDecisionInput({ body }) {
    const user = await requireAuthenticatedUser();
    return {
      challengeId: body.challenge_id,
      consentToken: body.consent_token,
      hostSubjectRef: user.id,
      action: body.action,
    };
  },
});
```

The callbacks are the important connection points: they load the current Host user and current
Manifest/session from the Host server. The browser request is only a trigger and must not be the
source of identity, binding, current state, or consent token authority.

The callback is the important connection point: the Host server loads current authoritative state
and the opaque binding, then the SDK signs exactly that data. Do not accept a binding or state
version from the browser as proof of authority.

## Browser prompt

Use this from a Client Component or browser event handler:

```js
"use client";

import { createContinuationPrompt } from "@4xeoz/re-entry-sdk/client";

const prompt = createContinuationPrompt();
const session = await (await fetch("/api/reentry/consent", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ trigger: "workflow-ready" }),
})).json();
const decision = await prompt.show({
  title: session.challenge.display.title,
  reason: session.challenge.display.reason,
});

await fetch("/api/reentry/consent/decision", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    challenge_id: session.challenge.challenge_id,
    consent_token: session.consent_token,
    action: decision.action,
  }),
});
```

The local Cloud Receiver preview now includes the consent-session routes. The prompt remains a
Host-page UI and is not a trusted Reentry-origin UI: the browser sees only the public challenge and
opaque token, while the Host server supplies the authenticated subject, owns the organization key,
and forwards the decision to Reentry. Production still needs authenticated user sessions, CSRF
protection, rate limits, key rotation, and a selected deployment identity model.

## What to test first

1. Run `npm run verify` in this directory.
2. Read `test/host-sdk.test.mjs` to see the exact signed request sent to the Receiver.
3. Read `test/next.test.mjs` to see the Next route boundary.
4. In a browser, call `createContinuationPrompt().show(...)` from a Client Component and click both
   buttons.

This is a local-preview SDK. It intentionally does not implement account or organization
administration, production consent identity, billing, deployment, Host-effect verification, or
Agent activation.

</details>
