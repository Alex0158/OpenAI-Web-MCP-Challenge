# Managed Context and Agent Activation

**Role:** CANONICAL mechanism contract  
**Status:** Deterministic v0.1/v0.2 activation and v0.1-only private binding-resolution contracts locally verified;
active-v2 separate-process dispatch and local Codex fresh-session preview verified only in bounded
test compositions; concrete supported Agent runtime open  
**Controls:** ADR-0011, ADR-0014, ADR-0025, ADR-0026, ADR-0041, ADR-0043, and ADR-0045

## Selected existing-task product contract

[ADR-0046](../Decisions/ADR-0046-restore-bound-task-notification-continuation.md) requires real trusted capture and durable private binding of the existing
task during enrollment, then same-task notification on later Events. TASK-035 owns this missing
integration; current Core lookup and the manual in-memory queue preview do not implement it.
Fresh exec is non-product preview evidence only, never fallback or same-task continuity proof.
Bounded event context cannot override prior user strategy or become a system-level command.

TASK-034 owns proof of actual same-task wake and Browser/WebMCP access. Notification handoff
settlement is separate from business work; TASK-029 must specify it without reinterpreting the
retained v0.1/v0.2 result or effect-ACK contracts below. Busy-task scheduling/coalescing must be
bounded and explicit, without monitoring Game completion or promising unlimited model memory.

## Responsibility

[ADR-0047](../Decisions/ADR-0047-authorize-local-desktop-bridge-probe.md) separately authorizes a
default-disabled native Desktop messaging/wake experiment. CLOUD-027 implements the isolated client,
but current-build peer authorization rejected its real preflight before any new send. It is not a
product Adapter, Grant binding, notification receipt, or relaxation of the selected contract above.

This module converts one valid delivery lease and private continuation receipt into one bounded,
credential-free activation attempt against the exact managed Agent context selected by private
Receiver-issued authority.

It owns:

- immutable activation derivation;
- omission of Connector and lease credentials;
- one-call Agent Adapter dispatch;
- typed `accepted`, `unsupported`, `rejected`, and `outcome_unknown` results;
- private Grant-to-context resolution inside the adapter boundary;
- binding lifetime and adapter-scope fencing; and
- explicit no-retry and no-fallback behavior.

It does not own event acceptance, delivery acknowledgement, Host effects, production context
capture or storage, Browser acquisition, WebMCP access, or the selected Agent platform.

The activation may contain one immutable bounded `instruction` copied from the user-visible,
signed Manifest reason. It is developer-provided context, not authority. The selected adapter must
delimit it as untrusted data; it cannot override the exact canonical URL, current Host-page state,
available WebMCP tools, safety rules, or the human boundary.

## Authority and custody

The Receiver-issued private receipt `grant_id` and one configured `adapter_id` are the only lookup
inputs. The Host binding, workflow ID, event fields, delivery target, Connector identity, caller
arguments, or process-global defaults cannot select a context.

Raw `binding_ref` custody remains inside the selected adapter authority and driver call. It must
not appear in Host, Cloud Receiver, delivery, activation, result, error, log, trace, or public
evidence surfaces.

## Activation flow

```text
live delivery lease + private receipt
-> immutable credential-free activation
-> exact adapter authority lookup by grant_id and adapter_id
-> lifetime and scope recheck
-> one driver call
-> one bounded typed result
```

The adapter result is not Host-effect evidence and cannot authorize acknowledgement. Protocol v0.2
changes only the validated activation version and positive ordered Event sequence; it does not
expose the standing Grant or let one Agent turn schedule another activation.

## Failure semantics

- Missing binding is explicit `unsupported / required_capability_unavailable /
  managed_context_resume`.
- Expired, lease-shorter, late, malformed, or mismatched binding reaches no driver.
- Authority exception, timeout, accessor-bearing value, malformed result, driver exception, or
  driver timeout becomes visible failure or unknown outcome according to ADR-0011.
- A selected production adapter cannot search, substitute a fresh context, manually reconstruct
  one, poll, retry, or use an alternate transport. The explicitly local Codex `exec` preview is a
  separate non-production path: it starts a fresh CLI session and must not be read as managed-context
  resume evidence.
- Revocation continues to fence new leases; this module adds no independent activation authority.
- Missing, blank, control-character-bearing, or oversized instructions are rejected before any
  adapter call.

## Code and focused verification

| Surface | Current source | Focused tests |
|---|---|---|
| Activation and result contract | `reentry-core/src/agent-adapter.mjs` | `reentry-core/test/agent-adapter.test.mjs` |
| Private binding resolution | `reentry-core/src/managed-context-adapter.mjs` | `reentry-core/test/managed-context-adapter.test.mjs` |
| Connector handoff | `reentry-core/src/local-connector-client.mjs` and process roles | Connector and conformance tests |
| Local Codex fresh-session preview | `runtime/local-connector/src/codex-exec-adapter.mjs` | `runtime/local-connector/test/codex-exec-adapter.test.mjs` |
| Active-v2 separate-process composition | Host SDK, `saas-boilerplate/`, and a separately spawned Local Connector worker | `runtime/local-connector/test/cloud-receiver-v2-e2e.test.mjs`; SDK-006 |

## Current evidence and non-claims

Deterministic tests cover v0.1 and v0.2 profile selection, positive standing sequence, credential
omission, expiry and correlation rejection, all bounded outcomes, one-call behavior, timeout,
exceptions, malformed results, missing and invalid bindings,
adapter scope, lifetime fencing, late resolution, raw-reference non-disclosure, and exact bounded
instruction validation. They do not
prove context capture, encrypted custody, persistence, retirement, real task resume, dormant wake,
Browser attachment, WebMCP, supported Codex activation, hosted-agent support, or user-visible
continuation. CLOUD-008 adds local fake-process evidence for one opt-in fresh-session CLI dispatch.
RECORE-007 adds two standing dispatches and verifies that the current Codex result seam preserves
v0.2. The managed-context and Codex queue adapters explicitly reject v0.2 before private lookup or
process effects; generic activation validation does not make them standing-capable. SDK-006 adds a
Node 24 separate-process v2 composition, but its effect and acknowledgement authority
is a distinct test worker rather than the default Connector product path. Neither result changes the
supported-runtime or Browser/WebMCP claim boundary.

## Adapter integration obligations

A selected adapter must define supported context identity, capture and retirement, secret custody,
idempotency or outcome reconciliation, process ownership, Browser acquisition, canonical-page
navigation, WebMCP availability, and evidence. These require a route-specific ADR and runtime
verification; they cannot be inferred from the deterministic adapter.

## Reopen conditions

Reopen if a supported runtime cannot resolve by Receiver Grant, provides a smaller authoritative
activation receipt, requires cloud-owned context custody, or cannot expose a safe explicit unknown
outcome without hidden retry or context substitution.
