# 06 — Transport, Errors, and Operations

> **Cloud Receiver v2 handoff:** This document defines the proposed v2 replacement service. Cloud
> Receiver v1 is retired and retained only as historical evidence; this is not a v1 implementation
> guide. See [ADR-0032](../Decisions/ADR-0032-retire-current-cloud-receiver-runtime.md) for the v1
> runtime disposition.

## Transport

- Hosted Receiver: HTTPS only.
- Local preview: HTTP only on literal `127.0.0.1` or `::1`.
- Use `application/json` and `Cache-Control: no-store`.
- Do not redirect API requests.
- Keep request bodies at or below 16 KiB and JSON responses at or below 32 KiB.
- Preserve exact `v0.1` route names and JSON field names.
- The Connector polls; no WebSocket, push channel, or inbound Mac listener is required.

## Health

```http
GET /healthz
GET /readyz
```

Return small JSON responses. Readiness must include the durable database check. Health and
readiness do not mean that a delivery exists or that an effect succeeded.

## Error envelope

Return:

```json
{ "error": { "code": "stable_machine_readable_code" } }
```

Never expose stack traces, SQL, secrets, tokens, or connection strings.

Useful codes:

| Situation | Status | Code |
|---|---:|---|
| malformed JSON or fields | 400 | `http_body_invalid` |
| invalid Connector identity | 401/403 | `connector_identity_invalid` |
| expired or revoked Grant | 403/410 | `grant_expired` / `grant_revoked` |
| stale lease or conflicting state | 409 | `delivery_lease_invalid` or a specific conflict |
| database unavailable or busy | 503 | `receiver_busy` |
| unexpected failure | 500 | `receiver_internal_error` |

## Minimum safe logs

Log only event names, timestamps, route, status, `connector_id`, `delivery_id`, attempt, and error
code. Never log pairing codes, Connector tokens, lease tokens, effect tokens, session cookies, or
private binding values.

## Debug order

1. `GET /readyz`.
2. Pairing and Connector token digest lookup.
3. Grant and delivery target lookup.
4. Delivery state and lease expiry.
5. Exact HTTP status and response shape.
6. Local adapter process and acknowledgement path.

## Acceptance test

Run one full test with a fake Host signer, fake Connector, and fake effect verifier. Prove:

```text
pair -> approve -> sign event -> claim -> acknowledge
```

Also prove duplicate event, duplicate claim, expired lease, invalid token, stale acknowledgement,
and database-unavailable behavior.

## Required contract tests

| ID | Scenario | Required result |
|---|---|---|
| `HTTP-001` | Send malformed JSON, an unsupported method, an unexpected field, an oversized body, or a non-JSON content type. | Return the documented `4xx` error, normally `http_body_invalid` or `http_method_not_allowed`; never partially mutate state or return a redirect. |
| `HTTP-002` | Force invalid identity, Grant expiry/revocation, lease conflict, persistence contention, and unexpected failure. | Return the agreed status/code pair: `401`/`403` identity, `403`/`410` Grant, `409` lease/conflict, `503 receiver_busy` with `Retry-After: 1` where applicable, and `500 receiver_internal_error`. Every body is exactly shaped as `{ "error": { "code": "..." } }`. |
| `HTTP-003` | Inspect all successful and failed responses and the minimum safe logs. | Do not expose stack traces, SQL, connection strings, pairing codes, Connector/lease/effect tokens, cookies, private bindings, or organization credentials. |
| `HTTP-004` | Call `GET /healthz` and `GET /readyz` while the service is healthy, then with its persistence dependency unavailable. | Health/readiness remain small operational responses and do not claim delivery/acknowledgement success; readiness reflects dependency availability. |
| `HTTP-005` | Exercise every protocol route through the same client policy. | API routes use `application/json`, bounded bodies, no cache/redirect behavior, and protocol `0.1`; changing route names, fields, status meanings, or token placement fails compatibility review. |

These are black-box contract cases. Fault injection may be test-only, but it must pass through the
same handler and persistence/authority boundaries used by production.
