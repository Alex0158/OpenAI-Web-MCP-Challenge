# ADR-0023: Adopt an Application Review Sample Host

**Status:** Accepted  
**Decision date:** 2026-09-01  
**Decision owners:** Eyad and project team  
**Scope:** Bounded local Host consumer for Re-entry integration evidence

## Context

The application-neutral Re-entry path is locally executable, but it is difficult to understand
without a recognizable Host workflow. TASK-001 still owns selection of the final product
application, and no current evidence justifies resolving that decision implicitly through demo
code.

The requested proof is a simple application form: an applicant submits it, a reviewer approves it
later, and that authoritative approval emits the event that returns an Agent to prepare the next
stage.

## Decision

Add `runtime/application-demo/` as a local sample Host with this bounded workflow:

```text
DRAFT -> SUBMITTED -> APPROVED -> NEXT_STAGE_READY -> ACCEPTED
```

- The applicant explicitly approves one Re-entry offer before submission.
- Submission and reviewer approval are normal human controls, never Site Tools.
- Reviewer approval commits Host business truth first, then sends one stable signed
  `application.approved` event through the Host SDK.
- The Local Connector claims the Receiver delivery and invokes a deterministic, evidence-only
  Agent Adapter.
- The adapter prepares the same application's visible next-stage plan, creates independent Host-
  effect proof, and stops before the applicant's final acceptance.
- The browser uses the Host SDK prompt for consent and registers stage-derived WebMCP Site Tools
  when the browser supports them.

The sample may compose the loopback Receiver and auto-pair a local Connector to make one-command
testing possible. Those are explicit local fixtures, not production identity or Agent behavior.

## Authority and data boundaries

- The Host owns applicant data, review state, the application state machine, and final acceptance.
- Re-entry receives only the signed Manifest/Event and protocol metadata; it does not receive the
  application form payload.
- The Host private key and organization credential remain server-side.
- The browser receives only the public consent challenge and one-time opaque consent token.
- Receiver event acceptance, Agent activation, Host effect, and delivery acknowledgement remain
  separate facts.

## Consequences

The repository gains one understandable integration consumer without selecting the final product.
It can verify SDK usability and every local protocol handoff, but cannot prove real Codex wake,
genuine Agent-driven browser acquisition, production authentication, public deployment, or market
fit.

TASK-001 remains pending. Any choice to make this workflow the final application requires a later
application-selection ADR and the full Core reconciliation named by TASK-001.

## Reopen triggers

Reopen if the sample changes Core authority, leaks form data into Re-entry, exposes a human
consequence as a Site Tool, hides unsupported Agent capability behind the deterministic adapter, or
is proposed as the final product without completing TASK-001.
