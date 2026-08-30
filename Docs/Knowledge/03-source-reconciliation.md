# Source Reconciliation and Cleanup Disposition

**Role:** SUPPORTING audit of the existing knowledge surface  
**Status:** Active; first consolidation pass  
**Observed:** 2026-08-30

## Reconciliation outcome

The repository already has a strong authority structure, but it was optimized for document
ownership rather than cross-layer retrieval. The safe cleanup is therefore additive:

- keep Core, ADR, governing rules, evidence, and immutable snapshots in place;
- add the four-level register and point each high-value statement to its owner;
- demote or label historical material instead of deleting it;
- record conflicts where an older thread or research snapshot is narrower, stale, or
  contradicted by current evidence; and
- leave other contributors' uncommitted work untouched until its owner validates and commits
  it.

No source is promoted merely because it is longer, newer in filename order, or repeated in a
thread. Current status, accepted decisions, exact evidence scope, and explicit freshness
control the result.

## Source-family disposition

| Source family | Current role | Level range | What it controls or contributes | Safe disposition |
|---|---|---:|---|---|
| `Docs/Core/` | CANONICAL | 1 | Current mechanism, requirements, architecture, security, validation, MVP boundary | Retain as owner. Reconcile claims when new evidence lands; do not duplicate full Core prose in the register. |
| `Docs/Decisions/` | DECISION | 1 | Accepted mechanism, P0 freeze, event/transport separation, H2 scope; ADR-0001 is superseded | Retain accepted ADRs. Keep ADR-0001 as historical trace; add a new ADR for app selection or transport selection. |
| `Docs/01-official-rules.md` plus Knowledge governance snapshot | Governing research copy plus English digest | 1 for the rule surface, volatile snapshot | Operational summary of eligibility, deadline, submission, judging, and legal constraints | Treat Official Rules as controlling. Use the [English digest](05-challenge-governance-snapshot.md) for collaborator routing; do not silently change legal meaning. |
| `Docs/02-submission-evaluation-strategy.md` and `Docs/03-technical-build-verification.md` | SUPPORTING challenge guidance | 2–3 | Evaluation framing, tool portfolio, testing and release advice | Retain as guidance; refresh volatile platform/rule claims from official sources. |
| `Docs/04-research-judgment-and-project-options.md` | DEPRIORITIZED option map | 3–4 | Earlier candidate comparison and rejected framing | Retain for provenance; no product selection authority. |
| `Docs/05-requirement-evidence-audit.md` | SUPPORTING audit | 2–3 | Earlier requirement-to-evidence reconciliation | Retain; cross-check against current Core status and latest evidence. |
| `Docs/Research/01–04` | SUPPORTING platform/probe/bridge research | 2–3 | Adapter capability, runtime probes, site-tool availability, public bridge gap | Retain with explicit current-build and no-production boundaries. |
| `Docs/Research/05–08` | SUPPORTING risk and mechanism research | 2–3 | Distributed seams, continuity alternatives, supported re-entry, P1 plan | Retain. Research 05 is advisory and its later evidence is controlled by Research 07–16 and current Core. |
| `Docs/Research/09–12` | SUPPORTING operating, unknowns, durability, and value research | 2–3 | H1 economics, risk register, cold-start protocol, product kill tests | Retain; use their gates to choose the next experiment, not as implementation proof. |
| `Docs/Research/13` plus `Experiments/continuity-calibration/` | Frozen protocol plus result | 2–3 | Method calibration and its `REVISE_PROTOCOL` verdict | Do not edit frozen inputs after results. Point current claims to the verdict and require actual runtime traces in a new app-specific protocol. |
| `Docs/Research/14–15` plus clean-context/model experiments | Current bounded evidence | 2 | C1 and M1 same-environment smokes | Retain as bounded evidence; do not promote to public portability or model parity. |
| `Docs/Research/16` plus transport calculator | Active model | 3, with measured sub-results at 2 | Watch-window economics and transport falsifiers | Retain as a model; replace illustrative inputs with selected-app measurements before a transport ADR. |
| `Docs/Research/17-mvp1-mvp2-comparative-integration-review.md` | SUPPORTING bounded branch review | 2–3 | MVP1/MVP2 mechanism comparison, selective-reuse map, and a local direct-queue observation | Retain with its evidence boundaries. It is not an app selection, transport decision, complete-branch merge authorization, or self-contained Q0 evidence package. |
| `mvp/src/`, `mvp/public/`, `mvp/test/`, runbooks | Implementation surface | 2 for observed behavior | The code and tests that implement the current fixture | Retain as source. Current behavior must reconcile with Core and evidence; local state under `mvp/var/` remains private. |
| `mvp/evidence/` | Frozen redacted evidence | 2 | P0/H0b/H1/H2a/H2 verdicts and bounded diagnostics | Retain frozen packages. Keep mutable traces and raw identifiers out of public commits. |
| `References/WebMCP/` | Primary-source snapshots | 2–4 | Dated WebMCP/Chrome/OpenAI source captures | Retain snapshots; refresh volatile facts from official sources before release decisions. |
| `References/WebMCP_Analysis/` | Broad supporting/partly historical dossier | 2–4 | Technical foundations, prior art, business hypotheses, competition analysis | Retain; the current Core and this register control project claims. Deprioritized files remain useful for prior-art boundary only. |
| `References/Other/` | Supporter and conflict log | 3–4 | Provider resources, deadline conflicts, unresolved community questions | Retain dated conflicts. Never treat silence, marketing copy, or participant counts as binding rules. |
| `References/TenderRelay/` | Immutable reference snapshot | 4 | Historical tender scenario and diagram | Preserve byte-for-byte; do not edit or overwrite. |
| `References/Legacy-Ideation/` | Deprioritized/superseded history | 4 | Earlier tender-specific and non-English reasoning | Preserve; do not extend. Use English Core successors for active work. |
| Related Codex threads and Codex Memory | Private historical inputs | 3–4 | Rationale, candidate ideas, earlier claims, failure lessons | Distill only high-value, non-secret statements. Current repository evidence supersedes old counts and unverified claims. |
| Current dirty working tree | Ownership signal, not evidence | N/A | Other collaborators' in-progress changes | Preserve. Do not stage, commit, or label uncommitted files as shipped evidence without owner validation. |

## Material conflicts and their resolution

| Conflict | Resolution | Current authority |
|---|---|---|
| **WebRTC versus WebMCP.** Early ideation and Signal Rescue used WebRTC language; the current MVP code and evidence use WebMCP page tools, local HTTP, HMAC-signed events, and adapters. | Treat WebRTC as a historical candidate domain/transport idea. Do not describe the current Receiver as WebRTC-based unless a future implementation proves that claim. | [K21](02-high-value-register.md); current source and Core design |
| **MVP1 versus MVP2.** A bounded branch review favors MVP2's product-shaped flow but finds authority, replay, durability, human-approval, and evidence gaps in its integrated core. | Keep MVP1 as the shared mechanism baseline and preserve MVP2 as a contributor reference. Import only selected UI/adapter assets after app or adapter approval; do not merge the complete branch on the review alone. | [K37](02-high-value-register.md); [Research 17](../Research/17-mvp1-mvp2-comparative-integration-review.md) |
| **80/80 versus 88/88 versus 114/114 tests.** Earlier MVP and H2 summaries reported their then-current totals; later lifecycle classification, contamination-latch, and automation-history scanner controls raised the current full suite. | Keep historical counts in their evidence context; use 114/114 for the current full suite, 88/88 for the H2-era full suite, and 30/30 for focused H2. | [current status](../Core/00-current-status.md), [H2 verdict](../../mvp/evidence/h2-durable-enrollment-service-contract-2026-08-30-verdict.md), [D4 inconclusive attempt](../../mvp/evidence/d4-h2b-first-formal-no-event-inconclusive-2026-08-30.md) |
| **37, 23, 59, 88, and 114 test counts.** These numbers refer to different scopes: P0 component/contract tests, frozen clean-run snapshots, combined P0+H1 history, the H2-era full suite, and the current hardened D4 harness suite. | Never present them as one cumulative claim. Name the suite and date whenever a count is reported. | [P0 evidence](../../mvp/evidence/README.md), [current status](../Core/00-current-status.md) |
| **Direct event wake versus scheduled pull.** P0 used a private current-build Desktop bridge; H0b/H1 used same-task scheduled turns. | Report them as separate adapter paths. Event acceptance is not the same as direct wake. | [ADR-0004](../Decisions/ADR-0004-separate-event-protocol-from-agent-transport.md), [Research 07](../Research/07-supported-reentry-transport-and-heartbeat-spike.md) |
| **Synthetic H2 versus production durability.** H2's destination is a separate synthetic SQLite service and its worker is one-shot. | Preserve the service-contract pass, but do not claim a production daemon, real Desktop destination, distributed exactly-once, or hosted deployment. | [ADR-0005](../Decisions/ADR-0005-run-additive-durable-enrollment-spike.md) |
| **C1/M1 versus portability/parity.** Fresh internal contexts and two eligible models passed one bounded read path in the same environment. | Keep the same-environment scope. C2–C4, full model comparison, and selected-app outcomes remain open. | [Research 14](../Research/14-clean-context-webmcp-portability-smoke.md), [Research 15](../Research/15-sol-terra-webmcp-model-variation-smoke.md) |
| **Exact-thread value versus capsule value.** The calibration instrument failed its primary inventory gate. | Mark the method `REVISE_PROTOCOL`; do not infer product value or equivalence from descriptive observations. | [calibration verdict](../../Experiments/continuity-calibration/verdict.md) |
| **TenderRelay/TwinSurface versus current identity.** Early materials made a tender product and named architecture appear selected. | ADR-0002 demoted the tender to a reference scenario and keeps the app/name open; the generic dual-surface claim is bounded by public prior art. | [ADR-0002](../Decisions/ADR-0002-separate-mechanism-from-demo-app.md), [prior-art audit](../../References/WebMCP_Analysis/12-Prior-Art-and-Originality-Audit.md) |
| **13:00 versus 17:00 Pacific deadline.** Older supporter/community material used 17:00. | Preserve the discrepancy, but use the current Official Rules deadline and refresh it before submission. | [official rules snapshot](../01-official-rules.md), [conflict log](../../References/Other/02-community-and-conflict-log.md) |
| **Research 13 header versus verdict.** The frozen protocol file says results were not yet recorded, while the separate verdict later records `REVISE_PROTOCOL`. | Do not edit the frozen protocol. Treat the verdict and experiment README as the outcome, and use a new protocol version for future work. | [Research 13](../Research/13-exact-task-vs-capsule-method-calibration.md), [verdict](../../Experiments/continuity-calibration/verdict.md) |

## Cleanup backlog ordered by attention

### Critical — perform before product implementation or public claims

1. Select the host app, user, workflow, event, artifact, and Site Tool contract through a
   new ADR; keep the domain-neutral mechanism unchanged until then.
2. Preserve the current claim boundary: local/current-build evidence is not public
   production support, cross-user durability, or a new standard.
3. Refresh the Official Rules and eligibility source before submission, with a clean English
   operational successor if the existing legacy-language rules copy remains active.
4. Keep the exact staged-content audit and secret/redaction gate for every collaborator
   commit; never label dirty, mutable, or private runtime state as shipped evidence.

### High — complete before app selection

1. Run D4/H2b full-Desktop restart once under the documented external-observer protocol.

### High — perform after app selection and before transport commitment

1. Decide whether any MVP2 UI or direct-queue adapter asset belongs behind the accepted
   app/adapter boundary.
2. Rewrite the continuity comparison as an app-specific, trace-based protocol with common
   startup conditions and observed Site Tool calls.
3. Measure the Research 16 watch-window variables against notification/deep-link and
   deterministic Host controls.
4. Build the selected app's public C2 evidence package, then test identity, revocation,
   outbox/retry, and real destination delivery only for the chosen topology.
5. Run a targeted prior-art and license review for the selected domain, not just generic
   WebMCP patterns.

### Medium — maintain while building the selected vertical slice

1. Keep Research 14/15 and their experiment packages clearly marked as same-environment
   bounded evidence.
2. Refresh volatile WebMCP, ChatGPT, Chrome, and provider snapshots when the tested client
   or deployment changes.
3. Keep tool schemas, state-derived registration, human review, and error/retry behavior
   synchronized across human UI, WebMCP adapters, and backend authority.

### Low — preserve without expanding scope

1. Keep the broad dossier, TenderRelay, legacy ideation, rejected candidates, and old thread
   reasoning available for traceability.
2. Do not spend build effort converting historical background into current product
   requirements unless a new decision explicitly reactivates it.

## Definition of a clean knowledge surface

The surface is clean when a new collaborator can:

- start at this folder and find the highest-impact statements first;
- identify the owner, evidence state, and freshness of every registered item;
- distinguish current implementation from hypothesis and historical context;
- trace every high-value claim to a repository file or a clearly bounded private-source
  synthesis;
- see unresolved blockers without reading every research file; and
- verify that no cleanup step deleted or overwrote historical or collaborator-owned work.
