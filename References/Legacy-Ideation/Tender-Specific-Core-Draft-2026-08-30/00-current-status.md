# TenderRelay Current Project Status

**Role:** CANONICAL current truth  
**As of:** 2026-08-30, Europe/London  
**Selected direction:** TenderRelay  
**Phase:** Product definition and architecture formalization  
**Controlling decision:** [`../Decisions/ADR-0001-select-tenderrelay.md`](../Decisions/ADR-0001-select-tenderrelay.md)

## 1. Executive status

TenderRelay is the selected working direction for the OpenAI WebMCP Challenge. The team is
formalizing the product, system contract, trust model, validation plan, and minimum
judge-visible demonstration before implementation.

The project is not yet implemented, deployed, or submitted. The complete concept dossier
has been preserved as an immutable reference; this Core documentation layer now controls
current project truth.

## 2. Product thesis

> WebMCP makes a live page actionable. TenderRelay lets a user authorize a specific
> business workflow to request that the Agent return later, re-enter the authoritative
> page, and continue through the tools valid for the new stage.

The challenge demonstration uses a tender/RFP portal: a bidder prepares an initial response,
grants narrowly scoped future re-entry, receives a later clarification event, and continues
the same visible work with the same Agent context before a human approves the consequential
submission.

## 3. Planning premise and evidence boundary

For the purpose of product and architecture design, the team is proceeding under this
premise:

> **WORKING ASSUMPTION:** An authorized backend event can resume the intended Agent context,
> enter a WebMCP-capable browser, open the canonical workflow URL, and discover the Site
> Tools exposed for the new stage.

This premise is accepted for planning under ADR-0001. It remains unverified until an
end-to-end bridge test produces runtime evidence. The assumption must not be described as
implemented, documented platform behavior, or judge-reproducible fact.

## 4. Evidence ledger

| Claim or surface | Current state | Evidence meaning |
|---|---|---|
| TenderRelay selected as working direction | **DECIDED** | ADR-0001 |
| Original dossier and diagram preserved | **VERIFIED** | Byte-identical snapshots with recorded SHA-256 hashes |
| WebMCP page tools can expose structured page-native actions | **VERIFIED EXTERNALLY** | Current platform/spec research; not yet implemented here |
| Grants, signed events, replay control, queues, and audit are implementable | **ENGINEERING-FEASIBLE** | Standard components; no project runtime evidence yet |
| Same logical Agent context can be resumed | **PARTIALLY VERIFIED EXTERNALLY** | Platform-specific primitives exist; chosen integration is not final |
| Resumed run can regain browser, auth, URL, and next-stage Site Tools | **WORKING ASSUMPTION** | Central bridge test still required |
| TenderRelay user demand | **UNKNOWN** | No recorded user interviews or production behavior |
| Portal-vendor integration incentive | **UNKNOWN** | Stakeholder and business model remain unresolved |
| Challenge MVP implementation | **NOT STARTED** | No application source exists in this workspace |
| Public deployment and clean-room judge flow | **NOT STARTED** | No live URL or release evidence |
| Devpost submission | **NOT SUBMITTED IN PROJECT DOCS** | Must be verified live before any status change |

## 5. Binding product boundaries

- The authoritative tender backend owns business state; an event never substitutes for a fresh state read.
- The website may request a typed continuation, but it may not inject arbitrary Agent instructions.
- The user explicitly chooses event types, expiry, run limits, and approval boundaries.
- The portal receives an opaque workflow-scoped binding, not an Agent thread ID or platform credential.
- Re-entry must return to the canonical page and use the tools valid for current state.
- Final commercial, legal, pricing, and submission decisions remain human-controlled.
- The MVP must use real `document.modelContext.registerTool` Site Tools.
- The site remains deterministic; TenderRelay does not add an unnecessary second LLM.
- Earlier ideas remain preserved references and do not expand the MVP.

## 6. Binding challenge constraints

The governing rules research currently requires a working public URL, public source
repository and visible open-source license, genuine WebMCP implementation, English
submission materials, and a public narrated demo under three minutes. Refresh all volatile
requirements against live Devpost sources before release.

See [`../01-official-rules.md`](../01-official-rules.md) and
[`../02-submission-evaluation-strategy.md`](../02-submission-evaluation-strategy.md).

## 7. Current highest-leverage sequence

1. Finalize the Core product and system contracts.
2. Run the smallest end-to-end continuation bridge spike.
3. Select and record the concrete Agent continuation adapter.
4. Build one vertical slice with one event and one re-entry stage.
5. Add trust controls, deterministic tests, and clean-room judge instructions.
6. Capture deployment, tool-discovery, re-entry, and approval evidence.
7. Freeze the demo and submission package before the official deadline.

## 8. Current non-claims

Do not claim that TenderRelay:

- is implemented, production-ready, deployed, or submitted;
- invents webhooks, Agent triggers, thread resume, queues, state machines, or tender automation;
- is the first resumable Agent workflow or a new WebMCP standard;
- has validated market demand or proven cost savings;
- can preserve browser authentication across every client or identity provider;
- can complete a tender submission autonomously without human governance.

## 9. Update rule

Update this file whenever the selected adapter, bridge evidence, implementation phase,
deployment, demo readiness, or submission state changes. Link each status change to the
corresponding ADR, test artifact, runtime evidence, or governing source.
