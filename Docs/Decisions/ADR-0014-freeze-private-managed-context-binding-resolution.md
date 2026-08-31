# ADR-0014: Freeze Private Managed-Context Binding Resolution

**Status:** Accepted  
**Decision date:** 2026-08-31  
**Decision owners:** Alex and project team  
**Scope:** Receiver-authorized Grant-to-context lookup, adapter-local context custody, and one
fail-closed bound-adapter composition

## Context

The Re-entry Core already keeps the Host-facing binding opaque and sends a credential-free typed
activation to a replaceable Agent Adapter. The private continuation receipt carries the
Receiver-issued `grant_id`, but no current Core contract resolves that private identifier to the
intended managed context. RECORE-003 therefore leaves private managed-context binding as the last
application-neutral implementation gap.

MVP1 proves the useful authority properties: a caller cannot select the context, the Host never
receives the raw identifier, and the binding is per Grant. Its capture, receipt-delivery, and
durable-enrollment paths are fixture-specific and include a larger outbox and custody model that
must not be copied without a real runtime. MVP2's process-global raw Desktop task identifier is
smaller, but it is not a per-Grant authority model and cannot support multiple independent
bindings safely.

The Cloud Receiver and Local Connector split makes a further boundary necessary. The Receiver
must own which private Grant may activate, while the selected local or hosted adapter authority
must own custody of any raw platform locator. Putting a raw task or thread identifier in the Host,
Cloud Receiver, delivery lease, or activation would erase that separation. Building a generic
credential store or Codex-specific wake path now would guess an unselected runtime.

## Decision

### 1. Increment boundary

This decision freezes only:

- one private managed-context binding authority port inside the selected adapter boundary;
- one exact active binding record keyed by the private receipt `grant_id` and configured
  `adapter_id`;
- one bound-adapter composition that resolves the binding before one driver call;
- fail-closed missing, inactive, malformed, mismatched, exception, and timeout behavior; and
- deterministic evidence that the private binding reference crosses only the authority-to-driver
  call inside the adapter boundary.

It does not implement context capture, receipt delivery, production persistence, encryption,
credential storage, pairing, retirement transport, a Cloud Receiver route, a Local Connector
daemon, a concrete Agent platform, Browser acquisition, WebMCP, Host effect, or fallback.

### 2. Authority and custody split

The Receiver-issued private continuation receipt remains the authority anchor. Its `grant_id` is
the only stable binding lookup input available to the adapter. The Host public binding,
`delivery_target_id`, Connector identity, workflow ID, event data, and caller arguments cannot
select or replace a managed context.

One configured adapter-side `bindingAuthority` owns the private mapping. The Core owns the rule
that only an exact live Receiver Grant lookup may be consumed; the authority implementation owns
raw platform-locator custody. The Local Connector supplies only the already validated activation.
It cannot supply a context reference, choose another adapter, or widen the binding.

This refines rather than removes Receiver ownership: Grant authority and the binding lookup key
remain Receiver-issued, while raw context custody stays outside the Cloud Receiver and Host. A
production authority must authenticate and persist its mapping under a separate selected-runtime
decision. A deterministic authority proves only this consumer boundary.

### 3. Binding authority port

The bound adapter calls exactly:

```text
resolveBinding({ grantId, adapterId })
```

The input is immutable and contains no Host public binding, delivery target, Connector token,
lease token, event payload, context locator, prompt, or tool instruction. The authority returns
either `null` for no active binding or one exact private record:

```text
type = webmcp.managed_context_binding
protocol_version = 0.1
grant_id
adapter_id
binding_ref
bound_at
expires_at
```

`binding_ref` is a bounded adapter-private locator. It is not Grant, event, Connector, or Host
authority. It may be a local handle rather than a raw platform identifier; a selected adapter
decides that representation and its storage protection. It must never appear in the activation,
typed result, error surface, Host response, Cloud Receiver state, log, trace, or public evidence.

The record must match the exact requested Grant and configured adapter. `bound_at` cannot be in
the future, and `expires_at` must be later than `bound_at`, later than the current time, and no
later than the Receiver receipt expiry. An authority that has retired or revoked its local
binding returns `null`; it does not return a second mutable revocation state for Core to merge.

### 4. Bound adapter composition

`createManagedContextAdapter` requires exactly:

- one bounded `adapterId`;
- one `bindingAuthority.resolveBinding` function;
- one `activateBoundContext` driver function; and
- one clock.

For each validated activation, it:

1. reads only `activation.receipt.grant_id` as the lookup key;
2. calls the configured authority once;
3. returns `unsupported / required_capability_unavailable / managed_context_resume` when the
   authority returns no active binding;
4. rejects an expired binding without invoking the driver;
5. treats malformed, mismatched, or failed authority resolution as an adapter failure whose
   outcome remains unknown under ADR-0011;
6. calls `activateBoundContext` once with the immutable activation and private `bindingRef`; and
7. returns the driver's existing ADR-0011 result for outer exact validation.

There is no retry, adapter search, fresh-context substitution, process-global default binding,
manual reconstruction, polling, or alternate transport. The driver cannot acknowledge delivery
or turn its return value into a Host effect.

### 5. Revocation and race boundary

Receiver Grant revocation remains authoritative under ADR-0013. It prevents new or replayed
leases; this binding contract creates no independent activation authority. A selected production
topology may also retire its local mapping for privacy or immediate platform termination, but that
requires its own authenticated propagation and custody decision.

This increment does not claim that an already issued lease can be recalled from an arbitrary
driver after revocation. ADR-0013's existing lease and Host-effect ordering remains unchanged.
Adding live revocation polling or a new activation-fence route here would widen the Connector
protocol without a production consumer.

### 6. Package and evidence boundary

The package adds one narrow managed-context adapter module and explicit subpath export. It reuses
the existing Agent activation and result contract, adds no runtime dependency, route, Receiver
schema, store method, background task, logger, retry, or platform SDK. The root import remains free
of platform code.

Focused tests use a deterministic authority and driver. Passing them supports only a locally
verified binding-resolution contract. It does not prove a real binding was captured, persisted,
resumed, revoked, or used by an Agent, Browser, or WebMCP runtime.

## Consequences

### Positive

- The final application can change without changing private context-selection semantics.
- The Cloud Receiver never needs a raw platform task or thread identifier.
- The Local Connector cannot select context through event, delivery-target, or caller data.
- Missing binding is a visible unsupported capability rather than a fallback context.
- A later local, hosted, or non-Codex adapter can implement the same narrow authority port.

### Costs and open risks

- Production capture, storage, encryption, retirement, migration, and recovery remain unproved.
- A selected adapter may require a stronger handle format or platform-issued activation receipt.
- Immediate termination of in-flight platform work after Grant revocation is not implemented.
- Deterministic resolution does not prove dormant wake, Browser attachment, page navigation, or
  genuine page-bound WebMCP.

## Rejected alternatives

- **Store a raw task ID in the Cloud Receiver Grant:** rejected because it moves platform custody
  across the cloud boundary and makes Receiver persistence adapter-specific.
- **Use `delivery_target_id` as the context binding:** rejected because device eligibility and one
  per-Grant managed context are different authority dimensions.
- **Pass a context identifier in activation:** rejected because Connector or event data could then
  select the Agent target.
- **Use one process-global context:** rejected because it cannot preserve per-Grant isolation or
  safe multi-binding behavior.
- **Copy MVP1 durable enrollment wholesale:** rejected because the selected destination,
  encryption custody, outbox consumer, and production lifecycle remain undecided.
- **Add a generic binding database now:** rejected because storage and secret-protection needs
  depend on the selected adapter; the narrow authority port is the current consumer boundary.
- **Try every configured adapter until one works:** rejected as hidden fallback and possible
  cross-context activation.

## Verification gates

Implementation must prove:

- exact option, activation, authority-input, and binding-record validation;
- lookup uses only the private receipt `grant_id` and configured adapter ID;
- the Host binding, delivery target, Connector and lease credentials, event fields, and caller
  data cannot supply `binding_ref`;
- one active binding invokes one driver once and preserves existing result validation;
- a missing binding returns exact `managed_context_resume` unsupported status with no driver call;
- expired, malformed, mismatched, accessor-bearing, exception, and timeout cases fail visibly
  without retry or fallback;
- `binding_ref` is absent from activation, results, errors, bounded output, and tracked artifacts;
- aggregate and protocol tests pass on Node 24 and the current runtime;
- runtime dependencies remain zero and package expansion is exact and recorded; and
- no production binding, raw-credential custody, real Agent, Browser, WebMCP, Host effect,
  deployment, selected-app, or judge claim is inferred.

## Reopen triggers

Reopen this decision if a supported adapter cannot resolve by Receiver `grant_id`, requires a
platform credential in the activation contract, provides an authoritative idempotent activation
receipt, needs Cloud-owned binding custody, or a selected topology can prove a smaller supported
binding mechanism without weakening context isolation.
