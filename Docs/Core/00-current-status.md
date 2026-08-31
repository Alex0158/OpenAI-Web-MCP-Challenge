# WebMCP Re-entry Workflow — Current Project Status

**Role:** CANONICAL current project and evidence truth  
**As of:** 2026-08-31, Europe/London  
**Selected direction:** Application-neutral Re-entry Core  
**Host application:** Unselected  
**Agent continuation adapter:** Unselected  
**Phase:** Core complete at `locally_verified`; application selection is the next product gate

## 1. Executive status

The project has implemented and locally verified the application-neutral Re-entry Core at the
scope accepted by ADR-0006 through ADR-0014. RECORE-001 through RECORE-004 and RECORE-006 are
`locally_verified`; RECORE-005 is `separate_process_verified`. The aggregate Core suite passes 79
of 79 tests on the recorded Node 24 and Node 26 environments. The package has zero runtime
dependencies and 16 selected package files.

The completed Core covers strict protocol values, Host issuance, Receiver-owned enrollment and
Grant authority, signed event acceptance, exact replay, atomic pending delivery, authenticated
Grant control and revocation, target-scoped delivery leases, bounded HTTP and outbound Connector
transport, deterministic Agent activation, private managed-context resolution, process-fault
evidence, and a non-production conformance profile.

The project has not selected or implemented the final Host application, production Receiver or
Connector shells, concrete Agent adapter, production consent and control sessions, binding
capture or custody, deployment, product validation, judge reproduction, or submission.

## 2. Selected concept

> A user authorizes one bounded future business event. After that event occurs, an available
> continuation adapter may return the bound Agent to the authoritative web page, where the Agent
> reads current state, discovers the Site Tools valid now, continues the same visible work, and
> stops at a human decision boundary.

```text
live WebMCP page
-> signed re-entry offer
-> Receiver-owned consent and scoped Grant
-> authoritative typed business event
-> accepted pending delivery
-> bounded Agent-context activation
-> canonical page re-entry
-> fresh state and Site Tool discovery
-> continued artifact or decision
-> human consequence boundary
```

The mechanism is selected. The domain, user, application, event, artifact, tool schemas, concrete
Agent runtime, and final product name remain open until accepted decisions select them.

## 3. Current decision and evidence state

| Surface | State | Owner or evidence |
|---|---|---|
| Mechanism/application separation | **DECIDED** | ADR-0002 |
| Re-entry Core source and target topology | **DECIDED** | ADR-0006 |
| Protocol, Host, Receiver, delivery, transport, adapter, and private binding contracts | **DECIDED** | ADR-0007 through ADR-0014 |
| Application-neutral implementation | **LOCALLY VERIFIED** | `reentry-core/`, RECORE-001 through RECORE-006 |
| Exact bounded process-fault matrix | **SEPARATE-PROCESS VERIFIED** | RECORE-005 |
| Source conformance profile | **LOCALLY VERIFIED, NON-PRODUCTION** | ADR-0012 and direct conformance execution |
| Frozen MVP1 mechanism proof | **VERIFIED, BOUNDED REFERENCE** | `mvp/` and its evidence index |
| Standalone App Server/Desktop Browser joins | **FAILED FOR BOTH TESTED ROUTES** | Research 19 and frozen probe artifacts |
| Workspace Agent Browser and page-bound WebMCP path | **UNKNOWN** | Research 20 |
| Final Host application and user | **UNSELECTED** | new app-selection ADR required |
| Concrete supported Agent adapter | **UNSELECTED / UNVERIFIED** | route-specific ADR and runtime evidence required |
| Production services and deployment | **NOT IMPLEMENTED** | future runtime work |
| Product value and judge reproducibility | **UNKNOWN** | selected-app evidence required |
| Submission | **NOT SUBMITTED** | live Devpost readback required |

## 4. Current implementation map

The current reusable source is `reentry-core/`. Its stable contracts are routed through the
[Mechanism index](../Mechanisms/README.md):

1. [Host integration, Manifest, and enrollment](../Mechanisms/01-host-integration-manifest-and-enrollment.md);
2. [Receiver Grant and event authority](../Mechanisms/02-receiver-grant-and-event-authority.md);
3. [delivery lease and Local Connector](../Mechanisms/03-delivery-lease-and-local-connector.md);
4. [managed context and Agent activation](../Mechanisms/04-managed-context-and-agent-activation.md); and
5. [Host re-entry, WebMCP, and human boundary](../Mechanisms/05-host-reentry-webmcp-and-human-boundary.md).

The first four have application-neutral local contract evidence. The fifth is a selected-app
obligation with frozen bounded MVP1 evidence; it is not implemented in `reentry-core/`.

`mvp/` is a frozen MVP1 proof fixture. MVP2 remains a preserved contributor reference. Neither is
the active source baseline for new application-neutral behavior.

## 5. Evidence boundary

Current evidence supports these bounded claims:

- Core contracts pass their focused and aggregate local tests;
- exact process compositions cover the recorded revocation, lease, stale-worker, effect-conflict,
  restart, and pre-commit termination cases;
- the source conformance profile runs distinct Host, Receiver, and Connector children and emits a
  redacted result;
- the frozen MVP1 suite currently passes 118 tests; and
- bounded P0/H1/H2 evidence demonstrates technical composability in the recorded local/current-
  build environments.

The evidence does not establish arbitrary-crash or power-loss safety, multi-replica behavior,
production security, public Agent activation, cross-user or cross-machine portability, deployed
performance, market value, or judge reproduction. Detailed current proof and future gates belong
to [Core/05](05-validation-and-evidence.md); dated history remains in Development, Research,
Experiments, and frozen evidence rather than this status file.

## 6. Binding mechanism invariants

- The Host application owns business truth and current workflow authorization.
- The Receiver owns future continuation authority and never trusts caller-asserted consent.
- The event is a bounded typed state-transition signal, not a prompt or artifact transport.
- Event acceptance, delivery, activation, Host effect, and acknowledgement are separate facts.
- The Host receives only an opaque binding; raw Agent-context custody stays private.
- Re-entry always revalidates the canonical page and discovers the current tool surface.
- The Agent cannot cross the selected human consequence boundary.
- Unsupported capability fails visibly; no hidden transport, retry, context, or tool fallback is
  permitted.

## 7. Current highest-leverage sequence

1. Complete [TASK-001](../Tasks/TASK-001-select-host-application.md) and accept the
   application-selection ADR using Core/06 and the candidate evidence.
2. Create a bounded selected-app Program and domain documentation layer.
3. Implement one vertical Host workflow, normal human UI, Host Adapter, and genuine WebMCP tools.
4. Validate and select one supported continuation adapter or explicitly narrow the demo claim.
5. Implement only the production Receiver and Connector shells required by that selected path.
6. Produce selected-app runtime, product, judge, deployment, and submission evidence.

Closed RECORE records are not reopened merely because application work begins.

## 8. Current non-claims

The project does not currently claim:

- a selected commercial product or validated customer problem;
- a new WebMCP standard or universal Agent continuation protocol;
- a supported public Codex or other Agent wake API;
- production consent, identity, pairing, credential custody, or administration;
- a production Cloud Receiver or Local Connector daemon;
- a real Host-effect verifier or real managed-context activation;
- public deployment, judge reproducibility, release, or submission; or
- historical originality beyond the bounded composition and evidence stated in Core/08.

## 9. Update rule

Update this file only when current phase, strongest evidence state, selected app/runtime,
deployment, or submission truth changes. Put module contracts in `Docs/Mechanisms/`, durable
choices in ADRs, implementation history in Development, and dated experiments in Research or the
owning evidence directory.
