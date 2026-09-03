# Host Re-entry, WebMCP, and Human Boundary

**Role:** CANONICAL mechanism contract  
**Status:** Target application contract with frozen MVP1, bounded sample-Host, Host SDK, and
active-v2 simple-flow evidence; Sleepless Kingdom selected with partial local Host evidence;
supported Connector-to-Browser join open  
**Controls:** ADR-0002, ADR-0003, ADR-0006, ADR-0041 through ADR-0045, Core/01, and Core/02

## Selected-product action and no-action boundary

[ADR-0046](../Decisions/ADR-0046-restore-bound-task-notification-continuation.md) requires the notified existing task to use prior user strategy together
with fresh authenticated Host state and genuine WebMCP tools. Event context explains the trigger;
it is not an order to mutate. The Agent may choose a permitted action, no command, or necessary
human clarification. A stale/rejected command still returns a typed failure, not fake success.
Receiver notification completion does not depend on these outcomes and must not retry because
business work was interrupted. Any claimed Game mutation still needs independent Game evidence.
Current task memory, Browser access, and Game player identity must each be verified, not assumed.

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
- A consent-request Site Tool may call the same application JavaScript function as normal Host UI;
  its invocation does not create a Grant or trigger the later business Event.
- Tool availability derives from current state and permission.
- Read and mutation effects are explicit and bounded.
- Inputs include current workflow and revision identifiers where stale writes matter.
- Tool results are bounded and contain no Receiver, Connector, context, or signing secret.
- Untrusted page, event, and tool-result content cannot widen Agent authority.
- Registration lifecycle removes stale tools, but server enforcement remains decisive.
- Registration uses top-level imperative JavaScript in supported Browsers; iframe or declarative
  registration is not a hidden fallback.
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
| Application-shaped local sample | `runtime/application-demo/` and HOST-001 | deterministic Agent; not final app or real Connector-to-Browser join |
| Shared UI/WebMCP consent action | `runtime/host-sdk/` and HOST-002 | live tool discovery and bounded handler invocation; configured consent-to-return Browser chain remains open |
| Simple SDK-to-active-v2 flow | `runtime/host-sdk/`, `saas-boilerplate/`, `runtime/local-connector/`, and SDK-006 | separate process reaches a test effect/ack worker; no supported external Agent, Browser attachment, selected Host page, or default product acknowledgement |
| Selected Sleepless Kingdom Host | `WebApp/Web-Game/`, ADR-0042, and scoped Game evidence | persistent local gameplay and causal signal; four canonical-page reads with one genuine read-only invocation; local labelled-port/page-HTTP recall composition; no external Agent return or dynamic recall proof |

No corresponding application code exists in `reentry-core/`; that package intentionally owns only
application-neutral contracts and adapters. The application-review code under
`runtime/application-demo/` is a bounded sample consumer accepted by ADR-0023, not the selected
Host product. Sleepless Kingdom is the selected product layer under `WebApp/Web-Game/`; its scoped
authority owns Game behavior and evidence.

## Application integration obligations

ADR-0042 names the shelter owner, persistent gatherer mission, `CargoLostToMonster`, initial and
resumed states, four reads, target initial consent action, conditional recall, human-confirmed
high-consequence actions, deterministic fixture/reset, experimental adapter posture, and WebMCP
materiality. The remaining integration obligation is to prove the advanced-SDK enrollment, signed
Event, supported authenticated Browser return, fresh dynamic tool inventory, recall effect, and
independent acknowledgement as separate facts. ADR-0045's standing mode now has a locally verified
application-neutral low-level SDK-to-Adapter reference under RECORE-007. CLOUD-023 adds the active
Receiver's locally verified working-tree kernel, not its public controls or pinned release. Game,
normal Host facade, product Connector, and external Agent/Browser adoption remain open under
TASK-028 and TASK-033.

## Reopen conditions

Reopen if the selected app cannot expose fresh authoritative state after re-entry, requires a
different human boundary, proves a necessary cross-stage artifact contract is missing, or shows
that WebMCP is not materially involved in the continuation rather than merely present in the demo.
