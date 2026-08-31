# Cloud Receiver and Local Connector — Candidate Topology

**Role:** SUPPORTING reconciled topology and pre-ADR decision input  
**Status:** Reconciled precursor adopted in part by ADR-0006; implementation, wire protocol, concrete Agent adapter, and final Host app remain unverified or unselected  
**Integrated:** 2026-08-31, Europe/London  
**Source provenance:** Distilled from Eddie's `codex/mvp2-tenderrelay` branch at
`3f746694069486d3d48d5c6a26c73942ff6eab42`, especially the branch-local
`21-cloud-receiver-local-connector-mvp-plan.md`  
**Current authority:** [Core/00](../Core/00-current-status.md),
[ADR-0002](../Decisions/ADR-0002-separate-mechanism-from-demo-app.md),
[ADR-0004](../Decisions/ADR-0004-separate-event-protocol-from-agent-transport.md), and
[Core/06](../Core/06-mvp-and-demo.md)

## Decision update

ADR-0006 now adopts one Receiver Core with a Cloud Receiver service shell and outbound Local
Connector as the active Re-entry Core development topology. This selects the process and
authority shape, not a deployed system or a supported Connector-to-Agent path. The final Host
app still supplies operating requirements, and a materially better supported hosted-Agent path
remains an explicit reopen trigger.

The analysis below retains the evidence and kill gates that informed that decision. Where it
says the topology was only a candidate or lacked implementation authority, ADR-0006 and
RECORE-001 now control current development authority.

## Executive judgment

A hosted Cloud Receiver plus an outbound Local Connector is the selected Re-entry Core
reference topology. It is intended for applications that must accept events while the user's
device is unavailable but still need a local Codex and Browser execution surface later. The
selection does not prove that the components or last-mile join work.

The application must be selected before this topology is specialized or claimed as product-fit.
Its measured event frequency, waiting window, latency, offline behavior, privacy,
administration, and cost constraints determine whether
this topology is appropriate. Once a shortlisted application makes a local connector
plausible, the connector-to-Agent-to-Browser/WebMCP join becomes the earliest kill test
before a full hosted Receiver is built.

This reconciles two valid observations:

1. building a cloud control plane before proving the last mile would be wasteful; and
2. testing a connector before knowing the application's requirements could optimize a
   topology the product does not need.

## 1. Problem this topology could solve

A remote Host backend cannot deliver directly to a loopback-only Receiver when the user's
machine is offline or unreachable. A hosted Receiver can remain available for signed Host
events, while a Local Connector can later establish an outbound authenticated channel and
perform the device-specific continuation step without exposing a public inbound port.

The topology preserves the project-owned contract split:

~~~text
Host application -> Cloud Receiver
    authenticated event and bounded delivery authority

Cloud Receiver -> Local Connector -> Agent runtime
    replaceable activation and execution transport

Agent -> canonical Host page
    fresh authority and state-derived WebMCP Site Tools
~~~

The Cloud Receiver does not own Host business truth. The Connector does not issue Grants.
The Agent does not infer permission from an event or page description.

## 2. Selection prerequisites

An app-selection ADR must provide this requirements profile before the topology can be
selected:

| Requirement | Decision input |
|---|---|
| Event pattern | Expected event frequency, events per Grant, and waiting-window distribution |
| Latency | Maximum acceptable event-to-visible-result latency and jitter |
| Availability | Whether the device may be asleep, offline, closed, or signed out when the event arrives |
| Execution location | Whether the workflow may run in a hosted Agent or requires a local authenticated Browser/session |
| Privacy | Data that may reach a hosted Receiver, retention limits, and prohibited payloads |
| Administration | Who installs, pairs, revokes, monitors, and supports a Connector |
| Economics | No-op checks, Agent usage, support burden, and operating-cost budget per safe success |
| Judge path | How a clean evaluator installs or avoids the Connector and reproduces genuine WebMCP |

Do not infer these values from the TenderRelay reference scenario.

## 3. Candidate responsibility model

| Component | Owns | Must not own or infer |
|---|---|---|
| Host page and backend | Business identity, workflow state, artifact revision, canonical URL, domain authorization, event intent, human consequence | Agent credentials, raw task identity, or Receiver approval |
| Cloud Receiver | Manifest validation, Receiver-owned consent, Grant lifecycle, opaque binding, signed-event validation, pending-delivery ledger, bounded audit | Host business truth, full artifacts, or arbitrary Agent instructions |
| Local Connector | Paired device identity, outbound retrieval, local credential protection, adapter selection, bounded dispatch and acknowledgement | Grant issuance, event truth, wider scope, or a public inbound control port |
| Agent Continuation Adapter | Managed-context selection, bounded activation, eligible Browser acquisition, canonical navigation, correlated runtime outcome | Business authority or permission expansion |
| Agent and page-bound Site Tools | Fresh state read, stage-valid preparation, visible artifact continuation | Final human consequence or trust in stale event state |

The first proof may run the Connector as an explicit foreground process. Installer packaging,
automatic login startup, auto-update, cross-platform support, and fleet administration are
not required until the selected product makes them material.

## 4. Target happy path

This is a target sequence, not implemented or verified behavior:

1. The Host backend issues one signed Re-entry Manifest for one workflow and later event.
2. The Receiver verifies the offer and presents its own authenticated consent surface.
3. The user approves one bounded Grant and one trusted Continuation Receipt is delivered to
   the bound managed context.
4. The Host stores only an opaque continuation binding.
5. Before any future event, the evidence gate shows zero accepted event, delivery, activation,
   continuation turn, and Host effect.
6. The Host later commits a business-state transition and outbox intent together.
7. The Cloud Receiver authenticates and durably records one pending delivery.
8. The paired Connector retrieves a bounded lease over its outbound channel.
9. The selected adapter activates the intended managed context and eligible Browser.
10. The Agent opens the allowlisted canonical page and reads fresh authority through genuine
    page-bound WebMCP.
11. A resumed-stage Site Tool updates one visible draft or decision artifact.
12. The Agent stops before the declared human-only action.
13. Correlated Host-effect and delivery acknowledgements converge replay to one effect.

## 5. Trust requirements

- Receiver consent must be an authenticated Receiver-owned action bound to the exact signed
  offer; a caller-supplied `humanApproved: true` value is not sufficient.
- The trusted Continuation Receipt is Receiver-generated enrollment output, not the future
  business event and not proof that an Agent ran.
- Each Grant resolves to its own opaque Host binding and private Agent/Connector binding;
  a process-global raw task ID is not an acceptable shared authority model.
- Host event data is typed and bounded. It cannot contain a free-form re-entry prompt,
  tool instructions, or page-authored authority.
- The Connector accepts only Receiver-assigned deliveries for its paired identity and uses
  short-lived leases or equivalent replay-safe claims.
- The canonical page revalidates current user, workflow, state, and artifact revision before
  every effect.
- Delivery acknowledgement follows the observed Host effect. Queue acceptance or adapter
  dispatch alone is not completion.

## 6. Ordered kill gates

### T0 — Application and topology fit

**Pass:** An accepted app-selection ADR supplies the requirements profile in Section 2 and
shows why a local authenticated execution surface is preferable to a hosted Agent,
notification/deep link, or deterministic Host automation.

**Fail or demote:** The product can run safely in a hosted runtime, requires seconds-level
offline response, cannot tolerate a Connector, or cannot make the judge path reproducible.

### T1 — Connector-to-Agent-to-Browser/WebMCP join

**Pass:** One foreground Connector activates the intended bounded context through a declared
adapter, obtains the required Browser, opens the canonical page, fetches a fresh exact Site
Tool inventory, and invokes one genuine read-only current-state tool with correlated evidence.

**Fail:** Only enqueue is observed; a dormant task does not run; Browser is unavailable;
REST, DOM automation, generic MCP, or manual reconstruction is required; or the target
identity cannot be proven without exposing raw task credentials.

The current `codex queue` observation proves enqueue for one persistent task class, not wake,
Browser acquisition, or WebMCP. Both tested standalone App Server Desktop joins also failed
on the current build. A materially different supported adapter or topology is required before
repeating those paths.

### T2 — Enrollment authority and binding

**Pass:** Receiver-owned consent, per-Grant private binding, trusted receipt delivery,
opaque Host acknowledgement, activation fencing, decline, expiry, revocation, and the
pre-event zero-effect checkpoint are observable.

### T3 — Distributed delivery and effect convergence

**Pass:** Separate Host and Receiver state, signed outbox delivery, retry after acknowledgement
loss, Connector lease recovery, event replay, and one idempotent Host effect are proven at the
actual selected boundaries.

### T4 — Clean-room product proof

**Pass:** The selected application completes the full loop from public instructions in an
independent eligible environment, with genuine Site Tool evidence and the human boundary.

## 7. High-value contributions from Eddie's branch

The branch contributes useful design direction without selecting its runtime:

- separate hosted control authority from device-local execution;
- use outbound Connector communication rather than a public local webhook;
- keep Host integration behind a small SDK and versioned event contract;
- pair Connector identity independently from Host workflow identity;
- make the Agent adapter replaceable;
- acknowledge delivery only after a correlated Host effect;
- keep the first Connector foreground and observable; and
- defer packaging, fleet administration, and generalized multi-tenancy.

These ideas are retained as candidate architecture input. They do not validate the current
MVP2 `ReceiverCore`, JSON aggregate, direct queue adapter, diagnostics, or TenderRelay domain.

## 8. Rejection and fallback rules

Reject this topology for the selected app when any binding requirement is incompatible:

- reliable action is required while the user's device is unavailable;
- a local signed-in Browser is not essential;
- Connector installation or administration costs exceed expected user value;
- privacy policy prohibits the necessary hosted continuation metadata;
- the supported Agent adapter cannot prove Browser and genuine page-bound WebMCP;
- a hosted Agent runtime provides a simpler supported path; or
- a notification, authenticated API, or deterministic Host job produces equivalent outcomes.

A rejection changes the adapter topology, not the domain-neutral Grant/event/re-entry
mechanism.

## 9. Deferred work

- production multi-tenancy and organization administration;
- general issuer onboarding and key infrastructure;
- background service installers and auto-update;
- cross-platform Connector support;
- broad event policy engines;
- high-availability brokers and generalized workflow orchestration; and
- protocol standardization.

## 10. Decision consequence

This report no longer controls implementation authority. ADR-0006 and RECORE-001 authorize the
application-neutral Receiver Core, Cloud Receiver, and Local Connector foundation. They do not
authorize a direct-queue adapter, TenderRelay import, production credentials, deployment, or a
claim that the Connector-to-Agent-to-Browser/WebMCP join works. The earliest material adapter
kill gate remains required before a real Agent adapter is integrated.
