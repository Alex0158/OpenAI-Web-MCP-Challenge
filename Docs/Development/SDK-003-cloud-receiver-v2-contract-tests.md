# SDK-003 — Cloud Receiver v2 Contract Tests

**Task:** [TASK-016](../Tasks/TASK-016-prepare-sdk-v2-contract-tests.md)
**Decision:** [ADR-0035](../Decisions/ADR-0035-adopt-cloud-receiver-v2-consent-targeting.md)
**Source contract:** [SDK to Cloud Receiver v2 Integration Contract](../Cloud-Receiver-Handoff/v2-build/08-sdk-cloud-receiver-integration.md)
**Status:** `verified` — SDK contract and real local browser flows pass against the tested Receiver commit
**Repository surfaces:** root SDK plus nested `saas-boilerplate/` Receiver source

## Objective

Exercise the SDK's actual Host-key registration, consent-session creation, consent-status, and
browser completion transport against the actual v2 Receiver app and a disposable PostgreSQL
database.

## Test matrix

| ID | Boundary | Expected result | Current disposition |
|---|---|---|---|
| `SDK-V2-001` | SDK `registerHostKey()` -> `POST /v0.1/host-keys` | `201` first registration, `200` idempotent replay; bounded `webmcp.reentry_host_key` JSON | Green against real local Receiver |
| `SDK-V2-002` | SDK `createConsentSession()` -> `POST /v0.1/consent-sessions` | `201` with signed-Manifest challenge and `/consent?token=<43-char-token>` URL | Green against real local Receiver |
| `SDK-V2-003` | SDK `getConsentSession()` -> `GET /v0.1/consent-sessions/:id` | Pending then approved status; public binding only, no Connector/target identifiers | Green against real local Receiver |
| `SDK-V2-004` | Authenticated Receiver consent HTML -> browser SDK popup | `window.opener.postMessage({type, consent_session_id, status}, window.location.origin)` after a successful decision | Green against real local Receiver |

## Harness and assumptions

The suite is [`runtime/host-sdk/test/cloud-receiver-v2.contract.mjs`](../../runtime/host-sdk/test/cloud-receiver-v2.contract.mjs).
It is deliberately opt-in because it loads the nested TypeScript Receiver and requires a disposable
database. It uses Supertest against `createApp()` and the Receiver's real Prisma client; successful
responses are never mocked. The standard SDK test suite remains independent of the cloud service.

Required process inputs are supplied only in the shell:

```sh
cd runtime/host-sdk
CLOUD_RECEIVER_V2_CONTRACT=1 \
  DATABASE_URL="<fresh disposable PostgreSQL URL>" \
  CLOUD_RECEIVER_RUNTIME_DATABASE_URL="" \
  DIRECT_URL="" \
  node --test test/cloud-receiver-v2.contract.mjs
```

The test sets the local Receiver public origin to `http://127.0.0.1:4000`, creates unique User,
Developer, Organization, API-key, and Connector fixtures, then removes only those fixtures. It does
not point at the retired Receiver database and does not claim a deployed endpoint.

## Expected responses and privacy assertions

- Host-key registration returns exactly `type`, `protocol_version`, `host_id`, `issuer_origin`,
  `key_id`, `status`, and `duplicate`; it does not return an organization id.
- Consent creation returns exactly `type`, `protocol_version`, `consent_session_id`, `challenge`,
  `consent_url`, `expires_at`, and `duplicate`. The raw consent token appears only in the URL, not
  as a separate field or persisted secret.
- Consent status returns `pending`/`approved` and `effective_status`; an approved public binding
  contains binding/workflow/event status fields but not Connector, delivery-target, account, or API
  key values.
- Browser completion is not inferred from a successful decision HTTP response. The popup emits the
  exact event accepted by `createReentryConsentPrompt()` from the exact origin and source only
  after a successful decision; failed decisions emit no message and no private value is included.

## Executed verification — 2026-09-02

The suite was run with Node `v26.8.1` against the actual `saas-boilerplate/backend` Express app at
Receiver commit `f67e741dd0392dd04f14d7d02764b7c0a7179dc5` and a fresh Homebrew PostgreSQL `14.18`
cluster on loopback port `55436`, database `sdk_v2_contract_final`. The cluster was stopped after
the run; credentials were supplied only in the shell and are not recorded here.

Results:

- Full SDK contract run: `SDK-V2-001`–`SDK-V2-004`, `4/4` passed.
- Full Cloud Receiver backend regression run: `5/5` suites and `17/17` tests passed, including
  `CONSENT-004`.
- Normal SDK syntax and unit/adapter suite: `18/18` passed.
- Real browser approve flow: Google Chrome headless via Playwright opened the Receiver popup,
  received HTTP `200`, delivered the exact `reentry.consent.complete` message from the matching
  popup source and origin, and produced Receiver status `approved` / `active`.
- Real browser decline flow: the same browser path received HTTP `200`, delivered the exact
  `reentry.consent.complete` message from the matching popup source and origin, and produced
  Receiver status `declined` with no binding.
- Docker was unavailable, so the equivalent disposable local PostgreSQL installation was used; no
  deployed or external Receiver endpoint was involved. The browser run used the explicit same-origin
  local configuration `FRONTEND_URL=RECEIVER_PUBLIC_URL=http://127.0.0.1:4010`; a split-origin
  deployment was not claimed or tested here.

The default opt-out check was:

```sh
cd runtime/host-sdk
node --test test/cloud-receiver-v2.contract.mjs
```

It skipped all four tests. The green contract run used `CLOUD_RECEIVER_V2_CONTRACT=1` and the
disposable database environment with the same command; no SDK fallback or alternate transport was
enabled.

## Handoff verification

`SDK-V2-004` reaches an authenticated `200 text/html` consent page. In the real Chrome run, after a
successful approve or decline, the page emitted:

```js
window.opener.postMessage(
  { type: "reentry.consent.complete", consent_session_id, status },
  window.location.origin
)
```

The Receiver `CONSENT-004` test also proves that a failed decision emits no message and that the
message contains only `type`, `consent_session_id`, and `status`, sent to `window.location.origin`.

The final record distinguishes local process evidence from deployed or externally verified evidence
and records environment limits such as unavailable Docker or missing Node 24.

No SDK fallback, alternate route, or deployment/integration-complete claim is authorized by this
record.
