# ADR-0039 — Adopt Cloud Receiver v2 Transport and Operations Boundary

**Status:** Accepted for Feature 6 local v2 implementation only
**Date:** 2026-09-02
**Owners:** Cloud Receiver v2 implementation team
**Related:** ADR-0007, ADR-0010, ADR-0019, ADR-0038, TASK-021
**Source contract:** [Feature 06 — Transport, Errors, Health, and Operations](../Cloud-Receiver-Handoff/v2-build/06-transport-and-operations.md)

## Context

The v2 Express service currently exposes the accepted business routes but uses framework-default
body parsing and mixed historical error/health envelopes. Feature 6 hardens the shell while leaving
the Re-entry Core protocol, Connector client, and public authority boundaries unchanged.

## Decision

1. The three v0.1 protocol routes remain exactly `POST /v0.1/events`,
   `POST /v0.1/delivery-claims`, and `POST /v0.1/delivery-acknowledgements`. Known route methods
   other than `POST` return `405` with `Allow: POST`; unknown routes return `404`.
2. v0.1 requests require one `application/json` content type (optional UTF-8 charset), no content
   encoding, one non-empty UTF-8 JSON object, and at most 16 KiB. Exact route fields remain owned by
   the route contracts and Core-compatible services.
3. v0.1 JSON responses are canonical, at most 32 KiB, and include `Cache-Control: no-store`,
   `Pragma: no-cache`, and `X-Content-Type-Options: nosniff`. API requests never redirect.
4. Transport failures use only the bounded codes `http_body_invalid`, `http_body_too_large`,
   `http_content_type_invalid`, `http_method_not_allowed`, and `http_route_not_found`. Typed service
   errors retain their stable code/status; unknown errors become `500 receiver_internal_error` with
   no message or stack in the response or log.
5. The shell exposes only `GET /healthz` and `GET /readyz` as operational routes. `/healthz` proves
   process liveness; `/readyz` performs `SELECT 1` against PostgreSQL. They never assert delivery,
   Agent, Host-effect, or acknowledgement success. This shell surface follows the v2 handoff and
   ADR-0019 without changing the Core HTTP route set in ADR-0010.
6. Minimum logs contain only bounded route/status/event/error fields. Pairing codes, Connector,
   claim, lease, effect, consent, session, cookie, private binding, organization credential, SQL,
   connection strings, and stack traces are excluded.

## Consequences

The service becomes predictable for the Local Connector and SDK clients and fails visibly when input,
transport, persistence, or authority is unsupported. Health endpoints remain local shell operations;
HTTPS termination, deployment, rate limits, supervision, and production observability remain open.
No public Grant inspection/revocation route is introduced.

## Verification gate

`HTTP-001`–`HTTP-005` must pass through Express and disposable PostgreSQL, plus all earlier feature
matrices. Tests must cover malformed/oversized/non-JSON input, method/route behavior, exact errors,
health/readiness dependency behavior, response bounds, no redirects, and secret-free responses/logs.

## Reopen triggers

Reopen if an integration needs a different route, field, status, transport, body limit, health
meaning, logging field, fallback, or production deployment behavior.
