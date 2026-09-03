# Feature 06 — Transport, Errors, Health, and Operations

**Build gate:** `HTTP-001`–`HTTP-005`

**Owner:** Cloud Receiver v2 HTTP and operational boundary

**Compatibility source:** [Local Connector handoff 06](../06-transport-errors-and-operations.md)

## Goal

Make every successful and failed request bounded, predictable, secret-free, and compatible with
Local Connector protocol `0.1`. This feature hardens the shared transport after the business-flow
features are green.

## Transport rules

- Hosted Receiver uses HTTPS only.
- Local preview uses HTTP only on literal `127.0.0.1` or `::1`.
- API requests use JSON and `Cache-Control: no-store`.
- API requests never redirect.
- Request bodies are at most 16 KiB; JSON responses are at most 32 KiB.
- Preserve exact route names, JSON field names, status meanings, and token placement.
- The Connector polls; no WebSocket, push channel, or inbound Mac listener is required.

## Operational routes

```http
GET /healthz
GET /readyz
```

Return small operational JSON responses. Readiness must check the durable database boundary.
Health/readiness do not claim that delivery or acknowledgement succeeded.

## Error contract

All protocol and control API failures use:

```json
{ "error": { "code": "stable_machine_readable_code" } }
```

Minimum mapping:

| Situation | Status | Code |
|---|---:|---|
| malformed JSON or fields | `400` | `http_body_invalid` |
| invalid Connector identity | `401`/`403` | `connector_identity_invalid` |
| expired Grant | `403`/`410` | `grant_expired` |
| revoked Grant | `403`/`410` | `grant_revoked` |
| stale lease or conflicting state | `409` | `delivery_lease_invalid` or specific conflict |
| bounded persistence contention | `503` | `receiver_busy` |
| unexpected failure | `500` | `receiver_internal_error` |

Busy responses include `Retry-After: 1` where applicable. Never expose stack traces, SQL, secrets,
tokens, cookies, private bindings, connection strings, or organization credentials.

## Minimum logs

Allow only event names, timestamps, route, status, `connector_id`, `delivery_id`, attempt, and
stable error code. Redact or omit pairing codes, Connector tokens, claim/lease tokens, effect tokens,
session cookies, private bindings, and API keys.

## Debug order

1. Call `/readyz`.
2. Inspect pairing and Connector token digest lookup.
3. Inspect Grant and target lookup/effective state.
4. Inspect delivery state and lease expiry.
5. Compare exact HTTP status and response shape.
6. Inspect the local adapter process and acknowledgement path.

## Red tests

| ID | Arrange and act | Required assertion |
|---|---|---|
| `HTTP-001` | Send malformed JSON, unsupported method/field, oversized body, or non-JSON content type. | Documented bounded `4xx`; no partial mutation and no redirect. |
| `HTTP-002` | Force invalid identity, Grant expiry/revocation, lease conflict, persistence contention, and unexpected failure. | Exact status/code pairs and body `{ "error": { "code": "..." } }`; busy has retry guidance. |
| `HTTP-003` | Inspect success/failure responses and minimum logs. | No stack, SQL, connection string, pairing/Connector/lease/effect token, cookie, private binding, or org credential. |
| `HTTP-004` | Call health/readiness with healthy and unavailable persistence. | Small operational responses; readiness reflects dependency; neither claims delivery/effect success. |
| `HTTP-005` | Exercise every protocol route through the same Connector client policy. | JSON, no-store, bounded body, no redirect, protocol `0.1`, exact names/token placement. |

These are black-box tests through the same handler and persistence/authority boundaries used in
production. Fault injection may be test-only but must not bypass those boundaries.

## Green implementation order

1. Add bounded request parsing, method/content-type checks, and response-size enforcement.
2. Add no-redirect and cache-control policy.
3. Add stable error mapping and safe response headers.
4. Add health/readiness and durable dependency checks.
5. Add safe structured logs and redaction assertions.
6. Run the complete feature matrix through hosted and local transport profiles as applicable.

## Refactor checklist

- Test 204 responses for empty body and absent `Content-Type` exactly.
- Test persistence failures after headers have not yet been sent; never leak internal errors.
- Test a response close/timeout path without leaving an open lease or partial mutation.
- Confirm all earlier feature tests still pass through the hardened handler.
- Record runtime, deployment profile, and whether the evidence is local or externally verified.

## Exit condition

The v2 service is transport-ready only when `HTTP-001`–`HTTP-005`, all earlier feature IDs, and the
full end-to-end acceptance flow pass without using the retired v1 package.

