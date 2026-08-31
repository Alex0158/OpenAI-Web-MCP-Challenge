# Host SDK preview

This is the smallest reusable Host integration package around `reentry-core`. It is compatible
with Next.js because it uses standard server `Request`/`Response` objects and does not depend on
React or Next at runtime.

It has three deliberate entrypoints:

| Entry point | Runs in | Job |
| --- | --- | --- |
| `@webmcp-challenge/host-sdk/server` | Host server only | Sign Manifests and Events; send Events to the Receiver |
| `@webmcp-challenge/host-sdk/client` | Browser only | Render a small top-layer consent-looking prompt |
| `@webmcp-challenge/host-sdk/next` | Next.js server route | Turn the server methods into `GET`/`POST` handlers |

The browser entrypoint never sees the Host private key. The prompt is only UI: it returns
`{ action: "approve" }` or `{ action: "decline" }`; it does not create a Grant or replace the
Receiver's consent authority.

## Install locally

This repository has no root package manager workspace yet. For this preview:

```sh
cd runtime/host-sdk
npm run verify
```

## Server setup

```js
import { createHostSdk } from "@webmcp-challenge/host-sdk/server";

const sdk = createHostSdk({
  origin: process.env.HOST_ORIGIN,
  receiverOrigin: process.env.RECEIVER_ORIGIN,
  privateKey: process.env.REENTRY_PRIVATE_KEY,
  keyId: process.env.REENTRY_KEY_ID,
});
```

`privateKey` and the Receiver origin configuration belong in the Host server environment. Do not
import `server` from a Client Component.

The server object exposes only three useful operations:

```js
const manifest = sdk.createManifest(hostOwnedManifestFields);
const signedEvent = sdk.createEvent(hostOwnedEventFields);
const acceptance = await sdk.sendEvent(hostOwnedEventFields);
```

`createManifest` produces the signed offer for the Host page to expose. `sendEvent` signs an Event
and calls the existing `POST /v0.1/events` Receiver contract. It does not retry automatically.

## Next.js route handlers

`app/api/reentry/manifest/route.js`:

```js
import { createManifestRoute } from "@webmcp-challenge/host-sdk/next";
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
import { createEventRoute } from "@webmcp-challenge/host-sdk/next";
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

The callback is the important connection point: the Host server loads current authoritative state
and the opaque binding, then the SDK signs exactly that data. Do not accept a binding or state
version from the browser as proof of authority.

## Browser prompt

Use this from a Client Component or browser event handler:

```js
"use client";

import { createContinuationPrompt } from "@webmcp-challenge/host-sdk/client";

const prompt = createContinuationPrompt();
const decision = await prompt.show({
  title: "Continue this workflow?",
  reason: "The workflow has a later step ready for your review.",
});

await fetch("/api/reentry/consent", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(decision),
});
```

This preview does not include a Receiver consent route yet. The browser prompt is therefore a
visual/test shell, not production consent. The current Cloud Receiver exposes event, claim, and
acknowledgement routes; a later accepted consent HTTP contract can connect this UI without changing
the signing or event code.

## What to test first

1. Run `npm run verify` in this directory.
2. Read `test/host-sdk.test.mjs` to see the exact signed request sent to the Receiver.
3. Read `test/next.test.mjs` to see the Next route boundary.
4. In a browser, call `createContinuationPrompt().show(...)` from a Client Component and click both
   buttons.

This is a happy-path SDK shell. It intentionally does not implement accounts, organizations,
API-key administration, production consent identity, billing, deployment, or Agent activation.
