# Host Re-entry, WebMCP, and Human Boundary

**Role:** CANONICAL mechanism contract  
**Status:** Target application contract with frozen bounded MVP1 evidence; selected app open  
**Controls:** ADR-0002, ADR-0003, ADR-0006, Core/01, and Core/02

## Responsibility

This module owns the product-visible completion of the Re-entry loop: return to the canonical Host
page, revalidate current authority and state, discover the Site Tools valid for the new stage,
continue the same visible artifact or decision, and stop before the human-only consequence.

It does not own the business domain, final user, Agent runtime transport, Receiver event authority,
or a generic browser-automation fallback.

## Required Host behavior

A conforming Host application must provide:

- one durable workflow record and canonical URL;
- current identity, authorization, workflow state, state version, and artifact revision;
- normal human UI for the same state and artifact;
- genuine imperative WebMCP tools derived from current server-authorized capabilities;
- a visible difference between initial and resumed tool surfaces;
- stale-state and optimistic-concurrency enforcement in the backend;
- one continued artifact or decision across stages;
- a human-visible reason for re-entry and receipt; and
- a consequential action that remains human-only.

The page and backend remain authoritative. The event and continuation receipt explain why the
Agent returned; they do not authorize a mutation against stale or inaccessible state.

## Re-entry lifecycle

```text
bounded activation
-> allowlisted canonical URL
-> current session and authorization check
-> current workflow and artifact read
-> fresh Site Tool registration
-> current-stage preparation or bounded mutation
-> visible artifact update
-> human review and consequence boundary
```

## WebMCP contract

- Tools expose domain actions rather than generic click or DOM wrappers.
- Tool availability derives from current state and permission.
- Read and mutation effects are explicit and bounded.
- Inputs include current workflow and revision identifiers where stale writes matter.
- Tool results are bounded and contain no Receiver, Connector, context, or signing secret.
- Untrusted page, event, and tool-result content cannot widen Agent authority.
- Registration lifecycle removes stale tools, but server enforcement remains decisive.
- No-WebMCP human UI remains functional.

## Human boundary

The Agent may inspect, compare, draft, stage, or continue work according to the selected domain.
It must stop before the irreversible or high-consequence human decision identified by the app ADR.
The backend must not expose that consequence through a Site Tool merely because the UI displays a
human control.

## Current evidence mapping

| Surface | Current evidence | Boundary |
|---|---|---|
| Two-stage authoritative fixture | frozen `mvp/` source and tests | reference implementation only |
| Genuine stage-specific Site Tools | frozen P0 correlated verdict | one controlled same-user environment |
| Canonical re-entry and same artifact | frozen P0 and H1 verdicts | private/current-build adapter paths |
| Fresh tool lifecycle | bounded lifecycle probe | current tested client only |
| Human stop | P0 final-state evidence and negative tool inventory | behavioral fixture evidence, not final app |

No corresponding application code exists in `reentry-core/`; that package intentionally owns only
application-neutral contracts and adapters.

## Application integration obligations

The app-selection ADR must name the user, asynchronous workflow, later event, durable artifact,
initial and resumed states, stage-specific tool roles, human consequence, reset path, and why a
notification or ordinary one-shot Agent call is insufficient. It must also identify the exact
backend authority and the real Agent/WebMCP runtime evidence required.

## Reopen conditions

Reopen if the selected app cannot expose fresh authoritative state after re-entry, requires a
different human boundary, proves a necessary cross-stage artifact contract is missing, or shows
that WebMCP is not materially involved in the continuation rather than merely present in the demo.
