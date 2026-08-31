# ADR-0007: Freeze the Re-entry Core v0.1 Contract Kernel

**Status:** Accepted  
**Decision date:** 2026-08-31  
**Decision owners:** Alex and project team  
**Scope:** Re-entry Manifest, Host event wire contract, public binding, private continuation receipt, cryptographic boundary, and module ports

## Context

Re-entry Core needs a first contract that is strict enough to falsify unsafe implementations
but small enough to remain application-neutral. MVP1 supplies the stronger semantic baseline:
exact event fields, opaque Host binding, Receiver-owned Grant state, detached raw-body event
authentication, replay rejection, and separation between accepted delivery and Agent effect.
MVP2 supplies useful versioned protocol, Host SDK, key-resolver, module-export, and frozen-vector
seams.

Neither wire contract can be promoted unchanged. MVP1 is fixture-bound and shares one HMAC
secret and datastore across boundaries. MVP2 exposes Receiver Grant identifiers to the Host,
accepts caller-asserted consent and workflow truth, carries free-form re-entry goals and Site
Tool order into an Agent instruction, couples event acceptance to adapter dispatch, and persists
one in-process aggregate.

The first kernel must also preserve the Program Contract: one bounded event, no arbitrary
prompt or artifact payload, no hidden fallback, zero runtime dependencies, and no claim that a
real Agent path exists.

## Decision

### 1. Protocol version and naming

The first protocol version is `0.1`. External protocol fields use `snake_case`. Exact object
shapes reject unknown and missing fields.

- Re-entry Manifest type: `webmcp.reentry_manifest`
- Continuation Event type: `webmcp.continuation_event`
- public Host binding type: `webmcp.reentry_binding`
- private continuation receipt type: `webmcp.continuation_receipt`
- signature algorithm: `Ed25519`

This is a project contract, not a claim of public WebMCP standardization.

### 2. Re-entry Manifest

A Host backend issues the signed Manifest and a live page exposes it through genuine WebMCP.
The browser never receives the issuer private key. Merely retrieving the Manifest creates no
Grant or binding.

The signed Manifest has exactly these top-level fields:

```text
type
protocol_version
manifest_id
correlation_id
issuer_origin
issued_at
offer_expires_at
workflow
display
grant_request
signature
```

`workflow` has exactly:

```text
id
type
state_version
canonical_url
```

`display` has exactly `title` and `reason`. These strings are bounded, untrusted presentation
text. A Receiver escapes them for display and never carries them into the private continuation
receipt or Agent activation input.

`grant_request` has exactly:

```text
event_type
grant_expires_at
max_runs
human_boundary
```

Version `0.1` requests one event type and requires `max_runs` to equal `1`. Offer expiry and
requested Grant expiry are distinct: the offer must expire after issuance, and requested Grant
expiry must be later than offer expiry. The Receiver may narrow or decline the request.

`signature` has exactly `algorithm`, `key_id`, and `value`. It covers the canonical JSON of all
other Manifest fields.

Manifest verification requires a trusted expected origin from the actual page-acquisition
boundary. The declared issuer origin and canonical workflow URL must match that anchor. A key
resolver match alone is not proof that the Manifest came from the page being enrolled.

### 3. Public Host binding

Authenticated Receiver consent returns only a workflow-scoped public binding with:

```text
type
protocol_version
binding_id
correlation_id
workflow_id
event_type
expires_at
runs_remaining
status
```

The Host never receives `grant_id`, Connector credentials, adapter credentials, a raw managed
context identifier, or a platform task or thread identifier. `binding_id` is necessary but not
sufficient authority: every event also requires valid issuer authentication and a live Grant.

A caller-provided boolean, header, or event field is not proof of human consent. The exact
Receiver-owned consent session and anti-CSRF contract belongs to the Grant increment.

### 4. Continuation Event

The canonical JSON body has exactly:

```text
type
protocol_version
event_id
correlation_id
binding_id
issuer_origin
workflow_id
event_type
event_sequence
state_version
occurred_at
canonical_url
```

The body contains no `grant_id`, raw context identity, `prompt`, instruction, goal, Site Tool
name or order, artifact, free-form event payload, `nonce`, or second idempotency key.
`event_id` is the sole wire idempotency identity. Version `0.1` requires
`event_sequence == 1`; a later version may generalize sequencing only with a real consumer.

The Host commits its business transition and event intent atomically, then its outbox sends the
same canonical body at least once. The Receiver verifies the event against the resolved Grant
and signed issuer claim. It does not accept a caller-supplied `authoritativeWorkflow` object as
independent proof of Host truth. The canonical page remains responsible for fresh identity,
authorization, state, and revision validation before any mutation.

### 5. Detached event signature

The Cloud Receiver accepts the canonical event body plus:

```text
WebMCP-Reentry-Key-Id
WebMCP-Reentry-Timestamp
WebMCP-Reentry-Signature
```

The signature covers the UTF-8 bytes of:

```text
timestamp + "." + canonical_event_body
```

The timestamp is canonical decimal epoch seconds and is checked against a bounded delivery
clock-skew window. The signature is canonical unpadded base64url. The key resolver selects an
allowlisted Ed25519 public key by issuer origin, key ID, and purpose. The Cloud Receiver never
receives the Host private key and therefore cannot mint a valid Host Manifest or event.

Event verification requires the trusted issuer origin already stored with the resolved Grant.
The event issuer must match that origin before its key is accepted; the event body cannot select
its own authority merely by naming an origin and key.

MVP1's HMAC envelope remains historical fixture evidence. It is not the Re-entry Core v0.1
cryptographic contract.

### 6. Canonical and bounded data

The kernel uses deterministic canonical JSON with lexicographically sorted object keys. It
rejects `undefined`, sparse arrays, non-finite or unsafe numbers, negative zero, unsupported
types, invalid Unicode scalar values, and non-plain objects.

Initial limits are deliberately small:

- identifiers: 1–160 ASCII characters from the contract identifier alphabet;
- canonical HTTP(S) URLs: at most 2,048 UTF-8 bytes, with no credentials or fragment;
- display title: at most 120 UTF-8 bytes;
- display reason: at most 500 UTF-8 bytes;
- Manifest canonical JSON: at most 16 KiB;
- event canonical JSON body: at most 8 KiB;
- timestamps: canonical millisecond ISO-8601 strings of at most 27 characters, with detached
  epoch seconds limited to 16 canonical decimal digits; and
- revisions and sequences: non-negative safe integers, with stricter per-field rules.

These are denial-of-service and evidence-size boundaries, not performance claims. Any increase
requires a measured consumer need.

### 7. Private continuation receipt and Adapter input

After authenticated consent, Receiver Core derives a private receipt only from normalized
Grant fields. It binds the internal Grant identity, correlation, issuer origin, workflow,
event type, canonical URL, expiry, human boundary, and the fixed typed continuation mode
`open_canonical_page_read_current_state`.

The receipt contains no display copy, Host event payload, business-state assertion, free-form
goal, tool list, prompt, platform credential, or raw public binding secret. It is stored only
through a Receiver-, Connector-, or Agent-controlled private port.

The Agent Continuation Adapter accepts a typed activation value derived from one valid receipt
and one leased delivery. It does not accept an instruction string. It returns a typed explicit
result, including `unsupported` when the required bounded capability is unavailable. No
alternate transport or execution surface is attempted automatically.

### 8. Process and port ownership

| Boundary | Input | Output | Prohibited authority |
|---|---|---|---|
| Host SDK | Host-owned workflow snapshot and issuer private key | signed Manifest or detached signed event envelope | Grant issuance, consent, delivery, Agent credentials |
| Receiver Core | validated typed values plus persistence, clock, ID, and public-key ports | Grant, binding, accepted delivery, lease, acknowledgement, audit transitions | Host business mutation, Agent activation, transport fallback |
| Cloud Receiver shell | authenticated HTTP bytes and Connector session | parsed calls and bounded responses around the same Receiver Core | duplicate Receiver rules, private Host key, device control |
| Local Connector | outbound authenticated lease protocol and private adapter binding | typed activation dispatch and acknowledgement | Grant issuance, event reinterpretation, public inbound control |
| Agent Continuation Adapter | typed receipt plus leased delivery | explicit activation result and bounded evidence | event acceptance, Host mutation authority, hidden fallback |

Deterministic tests may compose these boundaries in one process. Such tests do not prove
separate-process execution, durable delivery, deployment, Agent activation, Browser access, or
genuine WebMCP.

## Consequences

### Positive

- Cloud Receiver verification no longer requires a Host signing secret.
- The Host can integrate through a small SDK without learning Receiver or Agent internals.
- The event remains a bounded state-transition signal rather than a prompt transport.
- Page-bound WebMCP stays authoritative for current tools and state.
- One event ID owns wire idempotency, avoiding redundant nonce and idempotency surfaces.
- Exact limits and frozen vectors make cross-module drift falsifiable.

### Costs and risks

- Issuer public-key provisioning, rotation, revocation, and origin ownership remain open beyond
  one pinned challenge issuer.
- Ed25519 and this canonical JSON profile require cross-language conformance vectors before a
  portability claim.
- Omitting event-specific payload means the re-entered page must fetch current Host state. This
  is intentional but may expose a selected-app requirement that needs a versioned amendment.
- Consent session security, durable state, Connector pairing, lease fields, acknowledgement,
  and effect convergence remain later RECORE-001 increments.
- This decision proves no concrete Codex, Browser, or WebMCP runtime path.

## Rejected alternatives

- **Shared HMAC as the new default:** rejected because the verifier could forge issuer data.
- **Promote MVP2's protocol unchanged:** rejected because it exposes Grant identity and carries
  prompt-like policy into the adapter.
- **Keep free-form event data for flexibility:** rejected until one selected app proves a
  minimum field that cannot be read from the canonical page.
- **Pass current Host state into Receiver Core:** rejected as false cross-process authority
  unless a later authenticated Host-state verifier contract is accepted.
- **Accept arbitrary JSON extensions:** rejected because they weaken strict validation,
  idempotency, boundedness, and protocol-version evidence.

## Reopen triggers

Reopen this decision if:

- a selected app proves one missing wire field is required before canonical page re-entry;
- a supported WebMCP or Agent platform contract supplies a safer standard binding or signature;
- cross-language conformance shows the canonical JSON profile is ambiguous; or
- measured payload or processing evidence shows an initial limit is insufficient.
