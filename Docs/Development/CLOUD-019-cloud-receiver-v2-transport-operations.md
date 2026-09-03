# CLOUD-019 — Cloud Receiver v2 Transport and Operations

**Status:** `locally_verified` — Feature 6 complete in the Receiver checkout
**Date:** 2026-09-02
**Owner:** Cloud Receiver v2 implementation team
**Scope:** `saas-boilerplate/` only; no Core, Local Connector, SDK, public Grant, or deployment change
**Task:** [TASK-021](../Tasks/TASK-021-build-cloud-receiver-v2-transport-operations.md)
**Decision:** [ADR-0039](../Decisions/ADR-0039-adopt-cloud-receiver-v2-transport-operations.md)
**Contract:** [Feature 06 — Transport, Errors, Health, and Operations](../Cloud-Receiver-Handoff/v2-build/06-transport-and-operations.md)
**Exchange:** [Cloud Receiver v2 test exchange](../Cloud-Receiver-Handoff/v2-build/09-cloud-receiver-test-exchange.md)

## Outcome

The v0.1 Express shell now enforces the accepted transport boundary for:

- `POST /v0.1/events`;
- `POST /v0.1/delivery-claims`; and
- `POST /v0.1/delivery-acknowledgements`.

The shell adds only `GET /healthz` and `GET /readyz` as new operational routes. It does not add
public Grant inspection/revocation, push, WebSocket, diagnostics, or fallback routes.

## Exact transport behavior

- POST v0.1 requests require `application/json` with an optional UTF-8 charset and reject non-identity
  content encoding.
- JSON request bodies are bounded at `16 KiB`; malformed JSON and parser failures return
  `{ "error": { "code": "http_body_invalid" } }` with `400`; oversized bodies return
  `http_body_too_large` with `413`.
- Known protocol paths with a non-POST method return `405`, `Allow: POST`, and
  `http_method_not_allowed`. Unknown v0.1 paths return `404` and `http_route_not_found`.
- JSON v0.1 responses are canonical, bounded at `32 KiB`, and include `Cache-Control: no-store`,
  `Pragma: no-cache`, and `X-Content-Type-Options: nosniff`.
- v0.1 requests never redirect. Existing unversioned consent-page redirects remain outside the
  protocol shell.
- PostgreSQL transaction timeout/deadlock codes `P2024` and `P2034` map to `503 receiver_busy`
  with `Retry-After: 1`.
- Unexpected v0.1 failures map to `500 receiver_internal_error`; response and log output omit the
  internal error message and stack.

Operational responses are exact small JSON objects:

```http
GET /healthz
```

```json
{ "status": "ok" }
```

```http
GET /readyz
```

```json
{ "status": "ready" }
```

Both are `200` when healthy and use no-store/no-cache/no-sniff headers. `/readyz` performs
PostgreSQL `SELECT 1`; a failed dependency returns `503 {"error":{"code":"receiver_not_ready"}}`.
`/healthz` remains `200` during that dependency failure.

## Red phase

The five black-box tests were added at:

[`backend/src/modules/system-health/test/http.test.ts`](../../saas-boilerplate/backend/src/modules/system-health/test/http.test.ts)

Command against the pre-Feature-6 Receiver:

```sh
DATABASE_URL=postgresql://mac@127.0.0.1:55434/cloud_receiver_feature5 \
DIRECT_URL=postgresql://mac@127.0.0.1:55434/cloud_receiver_feature5 \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL= NODE_ENV=test \
npm test -w backend -- --runInBand \
  src/modules/system-health/test/http.test.ts
```

Result: all five cases failed against the old shell: parser failures were `500`, encoded requests
were not mapped to the bounded content error, the new health paths were absent, logs exposed parser
details, and v0.1 responses lacked the required headers.

## Green verification

Focused command:

```sh
DATABASE_URL=postgresql://mac@127.0.0.1:55434/cloud_receiver_feature5 \
DIRECT_URL=postgresql://mac@127.0.0.1:55434/cloud_receiver_feature5 \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL= NODE_ENV=test \
npm test -w backend -- --runInBand \
  src/modules/system-health/test/http.test.ts
```

Result: `HTTP-001`–`HTTP-005` passed, `5/5` tests, `1/1` suite. The suite covers malformed,
unsupported, encoded, and oversized input; method and route errors; persistence contention;
unexpected-error redaction; liveness/readiness separation; exact response headers and canonical
JSON; bounds; and no redirects.

The complete Receiver backend aggregate then passed `10/10` suites and `41/41` tests, including
Pairing, Consent/Target, Event, Claim/Lease, Acknowledgement, legacy health regression, and the
new transport suite. Prisma generation, backend type-check, backend build, and `git diff --check`
also passed.

## Runtime, database, commit, and remote state

- Runtime executed: Node `v26.8.1`, npm `11.19.0`, Prisma `7.10.0`.
- Database: disposable local PostgreSQL `14.18` at `127.0.0.1:55434`, database
  `cloud_receiver_feature5`; cluster stopped after verification.
- Tested Receiver commit: `300bce02e6a6f9b643a6de95a3596691304749b7`.
- Receiver worktree: clean on local `main`.
- Live command `git ls-remote origin refs/heads/main` returned
  `b851c320fae0505e3cf098f979d149e04ab44310`; the Feature 6 commit is local and not pushed.

## Logs and secret boundary

Expected readiness and unexpected-failure logs contain only bounded event, route, status, and
stable-code fields. They do not include parser objects, stack traces, SQL, connection strings,
cookies, pairing codes, Connector/claim/lease/effect tokens, private bindings, or organization
credentials.

## Remaining blockers

Feature 6 has no local Receiver blocker. Cross-team closure still requires an accepted resolution
of the Local Connector future-effect error mapping, exact clean counterpart commits, and the final
combined Host SDK → Receiver → Local Connector → Host effect → acknowledgement test. Deployment
and public Grant control remain explicitly out of scope.
