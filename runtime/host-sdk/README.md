# Re-entry Host SDK

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

## Install

```sh
npm install re-entry-sdk
```

The package has three entrypoints:

| Import | Runtime | Responsibility |
| --- | --- | --- |
| `re-entry-sdk/server` | Node server | Sign Manifests and Events; call Re-entry |
| `re-entry-sdk/client` | browser | Build the shared action, register its Site Tool, and open Re-entry consent |
| `re-entry-sdk/next` | Next.js server | Small Route Handler adapters |

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
import { createHostSdk } from "re-entry-sdk/server";

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
} from "re-entry-sdk/client";

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

## Run the included Next.js sample

The sample page uses the same function for its button and `request_codex_reentry`, confirms consent
server-side, retains the opaque binding in a process-local demo store, and exposes a separate button
that simulates the later business event.

1. Start `runtime/cloud-receiver` and create an account, organization API key, and connected Mac.
2. Put these server-only values in `runtime/host-sdk/app/.env.local`:

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

3. Run the app:

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
Integrate the Re-entry Host SDK into this server application. First read
runtime/host-sdk/README.md and the example under runtime/host-sdk/app. Install the SDK only in the
server app. Keep the organization API key and Ed25519 private key in server environment
configuration and out of browser code, logs, prompts, and git. Add one server route that creates a
signed Manifest and Re-entry consent session. Add a second server route that calls getConsentSession,
verifies approved status, and stores the opaque binding against the authenticated Host user and
workflow while returning only a safe continuation id. In the top-level Client Component, create one
function with createReentryConsentAction; call that same function from the normal UI and pass it as
execute to registerReentryWebMcpTool. Keep the Site Tool schema closed and describe that it requests
future consent but does not trigger the later business event. Send the signed Event only from the
Host backend after the real event occurs. Preserve normal UI when WebMCP is unavailable. Run the SDK
tests and sample build, and report genuine Codex Site Tool invocation, deployment, and final Host
effects as unverified unless separately proven.
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
| `re-entry-sdk/server` | Host server only | Register a Host key; sign Manifests and Events; create consent sessions; send decisions and Events to Reentry |
| `re-entry-sdk/client` | Browser only | Render a small top-layer consent-looking prompt |
| `re-entry-sdk/next` | Next.js server route | Turn the server methods into `GET`/`POST` handlers |

The browser entrypoint never sees the Host private key. The prompt is only UI: it returns
`{ action: "approve" }` or `{ action: "decline" }`; it does not create a Grant or replace the
Receiver's consent authority. The Host server must send that action through the decision route.

## Publish the SDK

The package name is `re-entry-sdk`, and the reusable core is bundled inside the tarball. From this
directory, publish it with an npm account that owns the name:

```sh
npm login
npm publish --access public
```

Developers can then install it with:

```sh
npm install re-entry-sdk
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
import { createHostSdk } from "re-entry-sdk/server";

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
import { createManifestRoute } from "re-entry-sdk/next";
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
import { createEventRoute } from "re-entry-sdk/next";
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
import { createConsentSessionRoute } from "re-entry-sdk/next";
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
import { createConsentDecisionRoute } from "re-entry-sdk/next";
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

import { createContinuationPrompt } from "re-entry-sdk/client";

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
