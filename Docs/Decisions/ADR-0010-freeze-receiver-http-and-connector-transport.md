# ADR-0010: Freeze Receiver HTTP and Outbound Connector Transport

**Status:** Accepted  
**Decision date:** 2026-08-31  
**Decision owners:** Alex and project team  
**Scope:** Minimal Host-event ingress, Connector claim and acknowledgement HTTP mapping, and
outbound Local Connector client

## Context

ADR-0008 and ADR-0009 now pass locally as one synchronous Receiver Core with a SQLite reference
store. That evidence does not prove the selected ADR-0006 process shape. The next boundary must
place Receiver authority and durable state in one process while an independent Host backend and
Local Connector communicate through explicit wire contracts.

MVP1 contributes the useful durability rule: acknowledge event acceptance only after durable
commit, and acknowledge delivery only after a correlated Host effect. MVP2 contributes useful
Host, Receiver, Connector, and Agent seams, but its combined server, JSON aggregate, direct Agent
dispatch, caller-asserted approval, broad diagnostics, and progress-based completion are not the
new transport contract.

The smallest useful proof needs no web application, Agent adapter, pairing UI, background polling
loop, broker, installer, or deployment. It needs one strict HTTP adapter over the existing Core,
one strict outbound Connector client, and separate-process tests that cannot share in-memory
authority objects.

## Decision

### 1. Increment boundary

This decision freezes only:

- one versioned Host-event ingress route;
- one versioned Connector delivery-claim route;
- one versioned Connector delivery-acknowledgement route;
- bounded exact-shape JSON requests and canonical responses;
- stable HTTP status and redacted error semantics;
- one outbound-only Local Connector client with no automatic retry; and
- separate-process proof using deterministic test authorities outside runtime code.

It does not freeze or implement consent HTTP routes, production pairing, credential storage,
rate limiting, TLS termination, public deployment, long polling, background supervision, an
Agent adapter, Browser/WebMCP access, Host-effect business logic, a selected application, or a
production operations surface.

### 2. Authority and process ownership

The process boundary does not change Core authority:

| Process | Owns | Must not own or infer |
|---|---|---|
| Host backend | Host private signing key, authoritative transition, signed event outbox | Receiver Grant, Connector credential, Agent dispatch |
| Cloud Receiver shell | Receiver Core, durable store, key resolver, consent, Connector-identity, and Host-effect authority ports | Host business truth, Agent adapter, transport fallback |
| Local Connector | Connector credential, durable claim token before send, received private lease, selected future adapter | Grant issuance, event reinterpretation, Host-effect assertion |

The Cloud HTTP adapter receives an already composed `ReceiverCore`. It cannot construct a store,
select an authority implementation, mutate Host state, or call an Agent. The Local Connector
client cannot choose a subject or target; it sends only opaque credentials and Core-defined claim
or acknowledgement values.

### 3. Frozen routes and methods

The exact version-0.1 routes are:

```text
POST /v0.1/events
POST /v0.1/delivery-claims
POST /v0.1/delivery-acknowledgements
```

No route accepts a query string. Unknown paths return `404`; a known path with another method
returns `405` and `Allow: POST`. There is no health, diagnostics, admin, reset, test, consent,
pairing, polling, Agent, or generic RPC route in this increment.

### 4. Bounded wire requests

Every request must use the `application/json` media type, optionally with UTF-8 charset, contain
one non-empty UTF-8 JSON object, and fit within 16 KiB. Content encoding is unsupported. The
adapter parses the body once, requires only enumerable data fields in the exact route shape, and
passes the resulting values directly to Core validation.

Outer JSON key order and insignificant whitespace are not authority and are not required to be
canonical. The event's inner `body` remains exact ADR-0007 canonical signed bytes; transport
parsing cannot rewrite it before Core verification. This keeps ordinary third-party JSON clients
interoperable without creating a second interpretation of signed content.

The event request is exactly the existing ADR-0007 event envelope:

```text
body
headers
```

The `headers` object contains the three detached ADR-0007 key ID, timestamp, and signature
fields. There is no top-level `signature` field.

The claim request is exactly:

```text
connector_token
claim_token
```

The acknowledgement request is exactly:

```text
connector_token
delivery_id
lease_token
effect_token
```

The HTTP adapter performs only snake-case wire to camel-case Core mapping for the two Connector
operations. Core validation remains authoritative. Tokens are carried only in the body, never in
the URL, query, response, or log.

### 5. Success responses

Successful bodies are deterministic canonical JSON with `Content-Type: application/json`,
`Cache-Control: no-store`, `Pragma: no-cache`, and `X-Content-Type-Options: nosniff`.

| Route | Status | Body |
|---|---|---|
| `/v0.1/events` | `202` | Exact ADR-0007 continuation acceptance |
| `/v0.1/delivery-claims` | `200` | Exact ADR-0009 claim result and private lease |
| `/v0.1/delivery-claims` | `204` | No body when no eligible delivery exists |
| `/v0.1/delivery-acknowledgements` | `200` | Exact ADR-0009 delivery acknowledgement |

The adapter does not wrap, enrich, rename, or reinterpret Core success values. In particular, it
does not add queue status, Agent progress, retry advice, a target identifier, or diagnostics.

### 6. Error boundary

Expected transport and typed Core failures return one canonical body:

```text
error.code
```

The response includes no exception message, stack, token, request body, delivery payload, or
internal storage detail. Transport codes are bounded to:

```text
http_body_invalid
http_body_too_large
http_content_type_invalid
http_method_not_allowed
http_route_not_found
```

Typed Receiver errors retain their existing bounded code and status. Any unknown exception maps
to `500` and `receiver_internal_error`. The HTTP adapter never retries, substitutes another route,
or returns a successful placeholder after failure.

### 7. Local Connector client

The Local Connector client requires exactly:

- a canonical Receiver origin;
- one bounded opaque Connector token; and
- an explicit request timeout between 100 milliseconds and 60 seconds.

The origin must use HTTPS. Plain HTTP is accepted only for literal `127.0.0.1` or `[::1]` test and
local-development origins. Credentials, non-root paths, queries, fragments, redirects, and
`localhost` name resolution are rejected.

The caller must create and durably retain the canonical 32-byte claim token before the first
claim. The client does not generate a hidden replacement, retry automatically, poll, back off,
or change the token. A caller may explicitly repeat the same operation with the same token under
ADR-0009 replay semantics.

The client bounds response bytes to 32 KiB, requires canonical JSON and the correct content type,
rejects redirects, and validates the exact lease or acknowledgement before returning it. A claim
lease must echo the supplied claim token, preserve exact receipt and continuation correlations,
and still be live when received. An acknowledgement must match the requested delivery.

Network, timeout, HTTP, malformed-response, and scope failures are visible typed client errors.
They do not trigger another transport or Agent action.

### 8. Package boundary

The zero-runtime-dependency Node 24 package adds explicit subpaths for the HTTP adapter and Local
Connector client. The root import remains the Core contract surface and must not implicitly load
the HTTP adapter, Connector client, or `node:sqlite`.

The transport implementation may use Node built-ins and the platform `fetch`. It must not add an
HTTP framework, schema library, retry library, ORM, broker, or logging dependency.

### 9. Separate-process evidence harness

The evidence harness may use deterministic credentials and authorities only under `test/`. It
must start independent Host, Receiver, and Connector child processes with no shared in-memory
maps. The Receiver process alone opens the SQLite file. The Host process alone owns its private
event-signing key. The Connector reaches the Receiver only through its outbound HTTP client.

Readiness and teardown use test-process IPC rather than adding runtime health or admin routes.
The HTTP listener binds only to literal loopback. Fixture credentials, fixed effect attestations,
and IPC setup are evidence scaffolding and cannot be presented as production identity, pairing,
TLS, Host-effect, or daemon behavior.

### 10. Failure and lifecycle semantics

- Event ingress returns `202` only after Receiver Core commits the event, pending delivery, and
  run reservation.
- Claim and acknowledgement retain ADR-0009 transaction and replay semantics unchanged.
- A connection loss is unknown delivery outcome, not permission to invent a new claim token or
  report success.
- Graceful close stops the listener from accepting new requests and lets the owner close the
  Receiver store after outstanding requests finish.
- Forced process termination, acknowledgement-response loss, concurrent processes, and restart
  recovery require explicit tests before they become evidence claims.

No catch-all fallback, memory queue, JSON store, silent local mode, alternate endpoint, or direct
Agent call is permitted.

## Consequences

### Positive

- Host, Receiver, and Connector boundaries become falsifiable without selecting a web app.
- Receiver authority remains identical in local and future hosted shells.
- The device exposes no public inbound control port.
- Exact bounded request shapes and canonical responses reduce ambiguity without imposing a
  nonstandard serializer on third-party senders.
- Exact claim and acknowledgement retries remain caller-controlled and observable.
- The package stays lightweight and framework-free.

### Costs and open risks

- Strict field allowlists reject extensions, so version evolution requires an explicit route or
  contract update.
- The proof listener is not a deployable public Cloud Receiver without TLS termination, abuse
  controls, secure credential lifecycle, observability, and deployment evidence.
- A Connector must durably retain its claim token; this increment supplies no credential or local
  state store.
- No background availability or latency contract exists without a supervised Connector loop.
- The real Host-effect verifier remains application-specific and unimplemented.
- The supported Connector-to-Agent-to-Browser/WebMCP join remains the primary last-mile risk.

## Rejected alternatives

- **Reuse the MVP2 combined server:** mixes Host, Receiver, JSON state, Agent dispatch, UI,
  diagnostics, and application domain in one process.
- **Expose a public local webhook:** widens the device attack surface and breaks outbound-only
  Connector ownership.
- **Put bearer credentials in headers or query parameters:** query values leak easily and a
  second credential convention adds no value to the typed body contract.
- **Return raw error messages or diagnostics:** leaks internal state and makes unstable prose part
  of the wire API.
- **Automatic retries with fresh claim tokens:** can spend multiple activation attempts after an
  unknown response outcome.
- **Long polling, WebSocket, SSE, or broker now:** adds lifecycle and deployment behavior before a
  simple separate-process contract is proven.
- **Add health, reset, and test routes to runtime:** turns evidence scaffolding into product attack
  surface.
- **Bundle production pairing and Agent dispatch:** combines independent trust and capability
  gates and hides which boundary failed.

## Verification gates

Implementation must prove:

- strict route, method, content type, UTF-8 JSON, request-size, and field-shape rejection;
- `202` event acceptance occurs only after durable Receiver commit;
- `200` claim, `204` no-work, and `200` acknowledgement preserve exact Core values;
- typed Core errors survive only as bounded status and code, while unknown failures are redacted;
- the Connector rejects insecure non-loopback origins, redirects, timeouts, oversized bodies,
  malformed JSON, extensions, token mismatch, stale leases, and acknowledgement mismatch;
- no client operation retries automatically or changes a caller's claim token;
- independent Host, Receiver, and Connector processes complete event, claim, and acknowledgement
  transport through a file-backed Receiver store;
- a Receiver close and restart preserves exact event and claim replay;
- raw Connector, claim, lease, and effect tokens remain absent from Receiver persistence;
- Node 24 focused and aggregate tests pass with zero runtime dependencies and bounded package
  weight; and
- no TLS, public deployment, production pairing, real Host effect, Connector daemon, Agent,
  Browser, WebMCP runtime, or selected-app claim is inferred.

## Reopen triggers

Reopen this decision if a real integration cannot preserve the exact field contract, a supported
platform requires a different authenticated outbound transport, the selected app needs latency
that simple request-response cannot satisfy, the hosted storage interface makes synchronous Core
composition invalid, or a supported hosted Agent removes the Local Connector boundary entirely.
