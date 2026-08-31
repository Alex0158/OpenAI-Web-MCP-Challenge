# ADR-0011: Freeze the Agent Adapter Activation Boundary

**Status:** Accepted  
**Decision date:** 2026-08-31  
**Decision owners:** Alex and project team  
**Scope:** Typed Local Connector-to-Agent Adapter activation, explicit result classification,
and deterministic contract evidence

## Context

ADR-0010 proves that an independent Local Connector can obtain one private, validated delivery
lease from the Receiver. It deliberately stops before Agent activation. The remaining boundary
must not turn the lease into a prompt, expose Connector authority to an Agent platform, or claim
that an adapter return proves Browser, WebMCP, Host-effect, or human-decision completion.

MVP1 demonstrated useful runtime probes but mixed free-form wake input, platform-specific
details, and weak result assertions. MVP2 contributed a replaceable adapter seam but did not
preserve the current Receiver lease and effect-authority model. Re-entry Core therefore needs a
small independent contract rather than either reference implementation.

No supported production Codex, Browser, and page-bound WebMCP join is currently selected. The
contract must make that absence explicit through `unsupported`, not through a fixture presented
as real activation or an undeclared fallback.

## Decision

### 1. Increment boundary

This decision freezes only:

- one typed activation value derived from one live ADR-0009 delivery lease;
- one narrow `activate(activation)` adapter port;
- one bounded typed activation result;
- explicit `accepted`, `unsupported`, `rejected`, and `outcome_unknown` classifications;
- one explicitly bounded invocation wrapper that calls the selected adapter at most once; and
- deterministic contract tests with no platform or Host mutation.

It does not select an Agent platform, capture or expose a managed-context identifier, provision
a production private binding, persist Connector credentials, poll for deliveries, open a real
Browser, invoke WebMCP, observe a Host effect, acknowledge a delivery, or implement a fallback.

### 2. Typed activation value

The Local Connector derives exactly one immutable activation value:

```text
type = webmcp.agent_activation
protocol_version = 0.1
delivery_id
event_id
attempt
lease_expires_at
continuation
receipt
```

`continuation` contains only the already validated correlation, workflow, event, state version,
occurrence time, and canonical URL fields from the delivery. `receipt` is the exact normalized
private ADR-0007 continuation receipt.

Before adapter invocation, the boundary must independently verify:

- the delivery lease type and protocol version;
- delivery and event identifiers, bounded attempt, and canonical expiry;
- a canonical 32-byte lease token on the Connector side;
- a live lease and live receipt at the supplied current time; and
- exact correlation, workflow, event type, and canonical URL agreement between continuation and
  receipt.

The adapter receives neither the lease token nor any Connector token, Host-effect token,
Receiver binding, raw delivery target, raw managed-context identifier, arbitrary instruction,
prompt, goal, tool list, Host artifact, or application-state assertion.

The receipt's private `grant_id` is the only stable lookup input available to a concrete adapter.
How an approved Grant becomes privately bound to managed context remains owned by the selected
adapter and consent topology. A caller cannot supply a context identifier through this contract.

### 3. Result classification

The adapter returns exactly:

```text
type = webmcp.agent_activation_result
protocol_version = 0.1
delivery_id
event_id
attempt
outcome
code
unavailable_capability
```

The allowed combinations are:

| `outcome` | Allowed `code` | `unavailable_capability` | Meaning |
|---|---|---|---|
| `accepted` | `activation_dispatch_accepted` | `null` | The adapter accepted this exact typed dispatch. It does not prove that an Agent started or that any later stage completed. |
| `unsupported` | `required_capability_unavailable` | one named capability | The adapter did not dispatch because a required bounded capability is unavailable. |
| `rejected` | `activation_rejected` | `null` | The adapter deterministically rejected the activation and reports no accepted dispatch. |
| `outcome_unknown` | `activation_outcome_unknown`, `adapter_invocation_failed`, `adapter_invocation_timed_out`, or `adapter_result_invalid` | `null` | Activation may or may not have been accepted. The Connector must not infer success or retry automatically. |

The only version-0.1 unavailable capabilities are:

```text
managed_context_resume
eligible_browser
canonical_page_navigation
page_bound_webmcp
```

The result carries no free-form message, stack, platform credential, raw context identifier,
prompt, tool output, or Host-effect claim. A concrete selected adapter may keep stronger private
platform evidence, but that evidence requires its own bounded contract and cannot widen this
result implicitly.

### 4. Invocation and unknown-outcome rule

The invocation wrapper:

1. validates and freezes the activation before the adapter sees it;
2. invokes exactly one explicit adapter exactly once;
3. requires a caller-selected timeout from 100 milliseconds to 60 seconds and narrows the
   effective wait to the remaining lease window;
4. validates exact correlation on the returned result;
5. maps timeout to `outcome_unknown / adapter_invocation_timed_out`;
6. maps an adapter exception to `outcome_unknown / adapter_invocation_failed`;
7. maps an invalid or mismatched result to `outcome_unknown / adapter_result_invalid`; and
8. returns the immutable typed result without retry, fallback, acknowledgement, or Host call.

An exception after invocation begins is not proof that no activation occurred. Repeating that
activation automatically could create a duplicate Agent run. Recovery remains explicit and may
use later independent Host-effect evidence; this contract does not invent idempotency that an
Agent platform has not provided.

### 5. Authority and effect boundary

No activation result is authoritative evidence of a Host effect. In particular:

- `accepted` is not `agent_started`, Browser attached, page opened, Site Tools discovered, tool
  invoked, artifact changed, or human boundary reached;
- `unsupported` and `rejected` do not acknowledge or cancel Receiver delivery authority;
- `outcome_unknown` does not authorize a new lease or automatic retry; and
- only the ADR-0009 Host-effect authority can support delivery acknowledgement.

The Local Connector may record the result as a bounded observation. It cannot translate an
adapter status into an effect token or claim that Receiver work is complete.

### 6. Deterministic adapter evidence

Contract tests use a deterministic adapter that returns each allowed outcome, throws once, or
returns a malformed value. It has no Browser, Agent, network, Host, credential, or persistent
runtime capability. Its only purpose is to prove activation derivation, one-call behavior,
failure classification, immutable values, correlation rejection, and absence of fallback.

Passing those tests supports only `locally_verified` adapter-contract behavior. It does not
support a real Agent activation, Browser, WebMCP, selected-app, deployment, or portability claim.

### 7. Package boundary

The package exposes this contract only through an explicit `./agent-adapter` subpath. The root
import remains free of Agent-platform code. The implementation uses no runtime dependency,
platform SDK, background worker, logger, retry library, or credential store.

## Consequences

### Positive

- Connector authority and lease secrets stop before the Agent-platform boundary.
- Unsupported platform capability becomes a first-class truthful result.
- Unknown activation outcomes cannot be disguised as safe retries or successful delivery.
- A later concrete adapter can be replaced without changing Receiver event or lease semantics.
- The contract is independently testable without selecting the final Host application.

### Costs and open risks

- The contract cannot prove that a selected platform resumes the intended context.
- Private Grant-to-context binding provisioning remains unimplemented.
- Browser, canonical-page, WebMCP, and Host-effect evidence remain separate later gates.
- A platform-specific idempotency or operation-recovery contract may require a versioned
  extension after one supported adapter is selected.

## Rejected alternatives

- **Pass a wake prompt:** rejected because it allows the event or Connector to become an
  instruction-authoring authority.
- **Give the adapter the lease token:** rejected because the adapter does not need Connector
  acknowledgement authority.
- **Treat adapter return as delivery completion:** rejected because only a correlated Host effect
  can acknowledge the delivery.
- **Retry an exception automatically:** rejected because the first activation outcome is unknown.
- **Use the deterministic adapter as a product fallback:** rejected because a fixture has no
  Agent, Browser, or WebMCP capability.
- **Add one generic capability string:** rejected because arbitrary labels weaken bounded result
  validation and evidence comparison.
- **Implement a Codex-specific adapter now:** rejected until a supported route passes its own
  managed-context, Browser, and genuine WebMCP gate.

## Verification gates

Implementation must prove:

- strict activation and result field validation;
- exact receipt and continuation correlation;
- expiry rejection before adapter invocation;
- omission of Connector and lease credentials from adapter input;
- immutable input and result values;
- each allowed outcome and capability classification;
- exception and malformed-result conversion to explicit unknown outcome;
- bounded timeout conversion to explicit unknown outcome;
- result mismatch cannot be accepted;
- one adapter call with no automatic retry, fallback, acknowledgement, or Host mutation;
- Node 24 and current-runtime aggregate tests with zero runtime dependencies; and
- no real Agent, Browser, WebMCP, Host-effect, deployment, or selected-app claim is inferred.

## Reopen triggers

Reopen this decision if a selected supported adapter proves that one field is necessary to
activate or safely recover the exact private binding, if a platform supplies an authoritative
idempotent activation receipt, if the Local Connector boundary is removed by a supported hosted
Agent topology, or if app-specific evidence shows that the four bounded capability classes are
insufficient.
