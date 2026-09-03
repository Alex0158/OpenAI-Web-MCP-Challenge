# Host SDK v2 Facade Report

**Date:** 2026-09-03
**Scope:** `runtime/host-sdk` only. No Cloud Receiver, Local Connector, shared Core, package
version, deployment, or publish changes were made.

## What was built

- Added the server-only `createReentry` facade in `src/server.mjs`.
- The facade accepts only `subject`, `prompt`, and same-origin `url` for a request.
- It registers the Host public key once per explicit request, then creates the consent session in
  that order. Registration accepts the existing `201` first-registration and `200` duplicate
  responses; no cache, retry, polling, or alternate route was added.
- It compiles the strict Core Manifest with bounded defaults: `domain-neutral-workflow`, state
  version `0`, `workflow.ready`, five-minute offer expiry, thirty-minute Grant expiry, explicit
  consent, and `max_runs: 1`.
- It returns a consent URL/session ID and a JSON-serializable server-only handle. The handle and
  later continuation contain no subject, prompt, organization key, Host private key, or Connector
  credential.
- `confirm` reads Receiver status, returns visible non-approved status, invokes `onApproved` only
  after validating an approved active binding, and returns the opaque continuation.
- `trigger` delegates one-time/replay authority to the Receiver and preserves Event `202` as
  queued acceptance only. Existing `createHostSdk` APIs remain available and backward compatible.
- Migrated the sample app's consent, status, and event routes to use the facade. The consent route
  supplies only the demo's server-side subject, prompt, and existing root URL; the status route
  confirms the stored handle and persists only an approved continuation; the event route calls
  `trigger(continuation)`.
- Added focused contract test files and this report; added a short README quickstart.

## 1. Tests passed and failed

| Check | Result |
| --- | --- |
| `node --test test/reentry-facade.test.mjs` | **7 passed, 0 failed, 0 skipped** |
| `node --test app/test/reentry-demo-routes.test.mjs` | **3 passed, 0 failed, 0 skipped** |
| `npm run verify` | **25 passed, 0 failed, 0 skipped**; 18 existing SDK tests plus 7 facade tests |
| `npm run build` from `runtime/host-sdk/app` | **Passed** under Node `v26.8.1`; Next.js `16.3.4` |
| `git diff --check` for task-owned tracked files | **Passed** |
| `npm --cache /private/tmp/reentry-sdk-npm-cache pack --dry-run --json` | **Passed**, package `@4xeoz/re-entry-sdk@0.3.1` |

The first package dry-run using the machine's default npm cache failed with `EPERM` because that
cache contains root-owned files. It was an environment failure, not a test failure; the isolated
cache retry passed.

The real Cloud Receiver contract tests, Feature 3 Event tests, and Host-to-Connector full-chain
test were not run in this increment. They require an exact counterpart checkout, fresh PostgreSQL,
and the required runtime credentials. They are blocked rather than failed.

## 2. Exact commit SHA

- Local repository `HEAD` recorded for this report:

  `733d77f97cca34429e2784dcf39663256dd3544b`

- No commit was created, pushed, published, or deployed for this task. The SHA is the base
  checkout identity, not a commit containing these changes.

Task-owned uncommitted paths:

- `runtime/host-sdk/src/server.mjs`
- `runtime/host-sdk/README.md`
- `runtime/host-sdk/test/reentry-facade.test.mjs`
- `runtime/host-sdk/SDK-FACADE-REPORT.md`
- `runtime/host-sdk/app/app/_lib/reentry-demo.mjs`
- `runtime/host-sdk/app/app/api/reentry/consent/route.js`
- `runtime/host-sdk/app/app/api/reentry/consent/status/route.js`
- `runtime/host-sdk/app/app/api/reentry/event/route.js`
- `runtime/host-sdk/app/test/reentry-demo-routes.test.mjs`

Pre-existing uncommitted paths preserved under the same component were:

- `runtime/host-sdk/app/AGENTS.md`
- `runtime/host-sdk/app/CLAUDE.md`
- `runtime/host-sdk/app/app/layout.jsx`
- `runtime/host-sdk/app/app/page.jsx`
- `runtime/host-sdk/app/app/page.module.css`
- `runtime/host-sdk/app/next.config.mjs`
- `runtime/host-sdk/app/package-lock.json`
- `runtime/host-sdk/app/package.json`
- `runtime/host-sdk/app/page.jsx`
- `runtime/host-sdk/src/client.mjs`

They were not edited by this task. Other repository paths were also already dirty and remain
untouched.

## 3. Runtime and database evidence

- Runtime used: Node.js `v26.8.1`, npm `11.19.0`; package baseline requires Node `>=24`.
- No Node 24 executable was available; the sample app build and route tests therefore ran under
  Node 26.
- Package version remained `0.3.1`.
- Focused tests used an in-process `fetchImpl` harness with generated Ed25519 keys and fixed test
  time. They verified serialized shapes, request order, signatures, headers, status handling, and
  secret boundaries.
- The sample app route test also used an in-process `fetch` harness. The demo's server-side
  request-handle and continuation maps are process-local illustrative storage, not production
  durable persistence.
- No Cloud Receiver process, network endpoint, real browser, PostgreSQL connection, migration, or
  durable database was used. Therefore this report makes no deployed, external-browser, or
  durable-state claim.

## 4. Required changes from the other teams

### Cloud Receiver

- Provide the exact green Feature 3–6 commit SHA and run the SDK contract tests against that exact
  checkout and a fresh PostgreSQL database.
- Preserve these routes and meanings: `POST /v0.1/host-keys`, `POST /v0.1/consent-sessions`,
  `GET /v0.1/consent-sessions/:id`, and `POST /v0.1/events`.
- Keep organization authentication on control routes only. `/v0.1/events` must accept the signed
  envelope without an organization API key and return only the bounded `202` acceptance shape.
- Implement Feature 3 validation and Features 4–6 durable claim, lease, delivery, and
  acknowledgement behavior without changing the accepted Core contract or adding fallback routes.

### Local Connector

- Provide the exact tested Connector commit SHA and pass the received Cloud Receiver contract
  document against that SHA.
- Consume only Receiver-issued claim/lease data, keep Connector and lease credentials out of Host
  and Agent inputs, and complete the effect-backed acknowledgement contract.
- Supply runtime and durable-state evidence for `PENDING -> LEASED -> ACKNOWLEDGED`, replay, stale
  lease fencing, and bounded failure behavior.

### Project/authority gate

- Reconcile this facade's public API in the owning Task/ADR and current documentation before
  release. ADR-0013 must be approved before any public Grant inspection or revocation API is added;
  this SDK change adds neither.

## 5. Integration test document

The following is the exact SDK-side contract for the counterpart run. Dynamic values are shown as
`<placeholders>`; field names, routes, status codes, and secret boundaries are fixed.

### Preconditions and commands

Use a fresh PostgreSQL database with the Cloud Receiver migrations applied. Verify the Cloud
checkout before running the test:

```sh
git -C /absolute/path/to/cloud-receiver rev-parse HEAD
```

The printed SHA must equal the Cloud SHA supplied by the Cloud team. Then, from this SDK checkout:

```sh
cd /Users/mac/Desktop/OpenAI-Web-MCP-Challenge/runtime/host-sdk
npm run verify
CLOUD_RECEIVER_V2_ROOT=/absolute/path/to/cloud-receiver \
CLOUD_RECEIVER_V2_CONTRACT=1 \
node --test test/cloud-receiver-v2.contract.mjs
CLOUD_RECEIVER_V2_ROOT=/absolute/path/to/cloud-receiver \
CLOUD_RECEIVER_V2_EVENT_CONTRACT=1 \
node --test test/cloud-receiver-v2.event.contract.mjs
```

The combined gate additionally requires the exact Connector SHA and the accepted ACK mapping:

```sh
CLOUD_RECEIVER_V2_ROOT=/absolute/path/to/cloud-receiver \
CLOUD_RECEIVER_V2_CLOUD_SHA=<40-character-cloud-sha> \
CLOUD_RECEIVER_V2_LOCAL_CONNECTOR_SHA=<40-character-connector-sha> \
CLOUD_RECEIVER_V2_FULL_CHAIN=1 \
CLOUD_RECEIVER_V2_ACK_MAPPING_APPROVED=1 \
node --test test/cloud-receiver-v2.full-chain.contract.mjs
```

### Request 1: Host-key registration

```http
POST <RECEIVER_ORIGIN>/v0.1/host-keys
Accept: application/json
Authorization: Bearer <ORGANIZATION_API_KEY>
Content-Type: application/json

{
  "host_id": "host_<sha256(HOST_ORIGIN + newline + KEY_ID)>",
  "issuer_origin": "<HOST_ORIGIN>",
  "key_id": "<KEY_ID>",
  "public_key_pem": "-----BEGIN PUBLIC KEY-----..."
}
```

Expected first response: `201` with type `webmcp.reentry_host_key`, protocol `0.1`, the same
`host_id`, `issuer_origin`, and `key_id`, `status: "active"`, and `duplicate: false`. An identical
later registration is expected to return `200` with `duplicate: true`. The private key must not be
sent.

### Request 2: Consent-session creation

```http
POST <RECEIVER_ORIGIN>/v0.1/consent-sessions
Accept: application/json
Authorization: Bearer <ORGANIZATION_API_KEY>
Content-Type: application/json

{
  "host_subject_ref": "<AUTHENTICATED_SUBJECT>",
  "expected_origin": "<HOST_ORIGIN>",
  "manifest": {
    "type": "webmcp.reentry_manifest",
    "protocol_version": "0.1",
    "manifest_id": "<MANIFEST_ID>",
    "correlation_id": "<CORRELATION_ID>",
    "issuer_origin": "<HOST_ORIGIN>",
    "issued_at": "<ISO_TIME>",
    "offer_expires_at": "<ISSUED_AT_PLUS_5_MINUTES>",
    "workflow": {
      "id": "<WORKFLOW_ID>",
      "type": "domain-neutral-workflow",
      "state_version": 0,
      "canonical_url": "<HOST_ORIGIN>/reports/123"
    },
    "display": {
      "title": "<DERIVED_TITLE_MAX_120_UTF8_BYTES>",
      "reason": "<PROMPT_MAX_500_UTF8_BYTES>"
    },
    "grant_request": {
      "event_type": "workflow.ready",
      "grant_expires_at": "<ISSUED_AT_PLUS_30_MINUTES>",
      "human_boundary": "explicit_receiver_consent",
      "max_runs": 1
    },
    "signature": "<ED25519_SIGNATURE>"
  }
}
```

Expected response: `201` on first creation or `200` for an exact duplicate, with type
`webmcp.reentry_consent_session`, protocol `0.1`, an opaque `consent_session_id`, a consent URL
whose only query parameter is one 43-character token, `duplicate`, `expires_at`, and a pending
challenge. The response must not contain the organization key, Host private key, or Connector
credential.

The facade exposes to browser code only:

```json
{
  "consentUrl": "<RECEIVER_ORIGIN>/consent?token=<43-character-token>",
  "consentSessionId": "<CONSENT_SESSION_ID>"
}
```

The serialized server handle is separate and contains only `consentSessionId` and the event
workflow `{ id, stateVersion, canonicalUrl }`.

### Request 3: Consent status and confirmation

```http
GET <RECEIVER_ORIGIN>/v0.1/consent-sessions/<CONSENT_SESSION_ID>
Accept: application/json
Authorization: Bearer <ORGANIZATION_API_KEY>
```

Expected `200` status response field set:

```json
{
  "type": "webmcp.reentry_consent_status",
  "protocol_version": "0.1",
  "consent_session_id": "<CONSENT_SESSION_ID>",
  "challenge_id": "<CHALLENGE_ID>",
  "status": "pending | approved | declined | expired | revoked",
  "effective_status": null,
  "expires_at": "<ISO_TIME>",
  "binding": null
}
```

For `approved`, `effective_status` is `active` and `binding` is the public exact binding with
`binding_id`, `correlation_id`, `workflow_id`, `event_type`, `expires_at`, `runs_remaining: 1`,
`status: "active"`, type, and protocol. `confirm(handle)` returns `{ "status": "pending" }`,
`declined`, `expired`, or `revoked` without invoking the save callback until approval. After
binding validation it returns the server-only `{ binding, workflow }` continuation.

### Request 4: Signed Event and `202`

```http
POST <RECEIVER_ORIGIN>/v0.1/events
Accept: application/json
Content-Type: application/json

{
  "body": "<CANONICAL_JSON_EVENT>",
  "headers": {
    "WebMCP-Reentry-Key-Id": "<KEY_ID>",
    "WebMCP-Reentry-Signature": "<ED25519_SIGNATURE>",
    "WebMCP-Reentry-Timestamp": "<UNIX_SECONDS>"
  }
}
```

The Event body has exactly: `type`, `protocol_version`, `event_id`, `correlation_id`, `binding_id`,
`issuer_origin`, `workflow_id`, `event_type`, `event_sequence: 1`, `state_version`, `occurred_at`,
and `canonical_url`. There is no `Authorization` header and no organization key in the body.

Expected `202` response:

```json
{
  "type": "webmcp.continuation_acceptance",
  "protocol_version": "0.1",
  "event_id": "<EVENT_ID>",
  "correlation_id": "<CORRELATION_ID>",
  "accepted": true,
  "duplicate": false,
  "status": "accepted"
}
```

This means accepted/queued only. It does not mean Connector claim, Agent activation, Host effect,
delivery, or acknowledgement.

### Expected bounded errors

| Case | Expected status/code | Mutation assertion |
| --- | --- | --- |
| Invalid subject, prompt, URL, or extra facade field | local `TypeError` before network | no request is sent |
| Host registration failure | `503`, `host_registration_failed` | consent route is not called |
| Invalid Event signature | `401`, `event_signature_invalid` | Grant remains active with one run |
| Expired Grant | `410`, `grant_expired` | no Event or delivery mutation |
| Revoked Grant | `422`, `grant_revoked` | no Event or delivery mutation |
| Wrong Event origin | `422`, `event_origin_mismatch` | no Event or delivery mutation |
| Invalid Event body/sequence | `422`, `event_sequence_invalid` | no Event or delivery mutation |
| Second new Event after one run | bounded Receiver `grant_exhausted` error | no second run |

The SDK surfaces Receiver errors as `HostSdkTransportError` with the bounded code and HTTP status;
it does not expose arbitrary Receiver response text.

### Replay, timing, and durable state

- Host registration is idempotent, but each explicit `request()` makes exactly one registration
  call; the SDK does not cache or retry it.
- Exact signed Event replay reaches the Receiver again and must return the recorded acceptance with
  `duplicate: true`, without consuming another run or creating another delivery. A new Event after
  exhaustion must fail visibly.
- The facade fixes offer validity to five minutes and Grant validity to thirty minutes. The SDK
  request timeout defaults to five seconds and has no polling, refresh, retry, or alternate route.
- After the first real `202`, PostgreSQL must show Grant `runs_remaining = 0`, one Event row, one
  `PENDING` delivery row, and `acknowledged_at IS NULL`.
- After the Connector claims and acknowledges the delivery, the durable state must show
  `PENDING -> LEASED -> ACKNOWLEDGED`, one attempt, the exact effect correlation, and no duplicate
  activation on acknowledgement replay.
- The combined gate is not complete until the exact test proves:

  `Host SDK -> Cloud Receiver -> Local Connector -> Host effect -> acknowledgement`

### Sample app route mapping

The browser calls the existing `/api/reentry/consent` action with an empty JSON object. The route
does not accept browser identity, prompt, URL, workflow, or Manifest fields; it creates the facade
request from server-side demo values and returns only title, reason, consent URL, and session ID.
It stores the returned serializable handle keyed by the session ID.

The existing browser completion callback posts only the session ID to
`/api/reentry/consent/status`. That route loads the server-side handle and calls:

```js
await reentry.confirm(handle, { onApproved: saveApprovedContinuation });
```

Only the approved continuation is put in the continuation map. The event route loads that stored
continuation and calls `reentry.trigger(continuation)`; it returns a reduced, secret-free `202`
response to the browser.

### Secret boundaries

- Browser: consent URL and session ID only.
- Host server: organization API key, Ed25519 private key, authenticated subject, handle, and
  continuation.
- Event route: signed envelope only; no organization API key.
- Receiver: public Host key and public binding; private Grant, subject, Connector identity, and
  delivery target remain private.
- Connector/Agent inputs: no Host private key, organization key, Connector bearer, or lease token.

## 6. Unresolved mismatch

No local facade contract mismatch was found. The remaining gaps are verification and coordination
gates, not silently addressed in SDK code:

1. The Cloud Receiver Feature 3–6 commit SHA, fresh PostgreSQL run, Local Connector SHA, and
   combined chain result were not supplied or executed in this increment.
2. Real external browser approve/decline popup flows and a deployed Receiver remain unverified.
3. Node 24 was unavailable on the machine; app build evidence is Node 26 only.
4. The demo's global in-process maps are not durable across serverless/process restarts and must be
   replaced by the Host application's authorized persistence before production use; no direct DB
   path was added here.
5. The default npm cache has an ownership problem; package verification succeeds with an isolated
   cache and the machine cache should be repaired by its owner.
6. Shared Task/ADR/current-status reconciliation remains for the project manager; no public Grant
   inspection or revocation was added before ADR-0013 approval.

The SDK task should remain open for the counterpart commit and combined-test evidence. No full
system completion claim is made.
