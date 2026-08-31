# Managed Context and Agent Activation

**Role:** CANONICAL mechanism contract  
**Status:** Deterministic activation and private binding-resolution contracts locally verified;
concrete Agent runtime open  
**Controls:** ADR-0011 and ADR-0014

## Responsibility

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

The adapter result is not Host-effect evidence and cannot authorize acknowledgement.

## Failure semantics

- Missing binding is explicit `unsupported / required_capability_unavailable /
  managed_context_resume`.
- Expired, lease-shorter, late, malformed, or mismatched binding reaches no driver.
- Authority exception, timeout, accessor-bearing value, malformed result, driver exception, or
  driver timeout becomes visible failure or unknown outcome according to ADR-0011.
- There is no adapter search, fresh-context substitution, manual reconstruction, polling, retry,
  or alternate transport.
- Revocation continues to fence new leases; this module adds no independent activation authority.

## Code and focused verification

| Surface | Current source | Focused tests |
|---|---|---|
| Activation and result contract | `reentry-core/src/agent-adapter.mjs` | `reentry-core/test/agent-adapter.test.mjs` |
| Private binding resolution | `reentry-core/src/managed-context-adapter.mjs` | `reentry-core/test/managed-context-adapter.test.mjs` |
| Connector handoff | `reentry-core/src/local-connector-client.mjs` and process roles | Connector and conformance tests |

## Current evidence and non-claims

Deterministic tests cover credential omission, expiry and correlation rejection, all bounded
outcomes, one-call behavior, timeout, exceptions, malformed results, missing and invalid bindings,
adapter scope, lifetime fencing, late resolution, and raw-reference non-disclosure. They do not
prove context capture, encrypted custody, persistence, retirement, real task resume, dormant wake,
Browser attachment, WebMCP, Codex support, hosted-agent support, or user-visible continuation.

## Adapter integration obligations

A selected adapter must define supported context identity, capture and retirement, secret custody,
idempotency or outcome reconciliation, process ownership, Browser acquisition, canonical-page
navigation, WebMCP availability, and evidence. These require a route-specific ADR and runtime
verification; they cannot be inferred from the deterministic adapter.

## Reopen conditions

Reopen if a supported runtime cannot resolve by Receiver Grant, provides a smaller authoritative
activation receipt, requires cloud-owned context custody, or cannot expose a safe explicit unknown
outcome without hidden retry or context substitution.
