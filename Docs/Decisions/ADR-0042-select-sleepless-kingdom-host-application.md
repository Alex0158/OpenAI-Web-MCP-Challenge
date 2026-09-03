# ADR-0042 — Select Sleepless Kingdom as the Host Application

**Status:** Accepted  
**Date:** 2026-09-03  
**Owners:** Alex and project team  
**Related:** ADR-0002, ADR-0006, ADR-0041, later ADR-0043, TASK-001, Core/05, Core/06, Core/08,
and the scoped [`WebApp/Web-Game/`](../../WebApp/Web-Game/) authority

## Decision

Select **Sleepless Kingdom** as the first Host application and challenge-demo carrier for the
Re-entry Core concept.

Sleepless Kingdom is a first-party persistent web strategy game. A player dispatches a gatherer and
may leave the page while the server-owned world continues. If the authoritative world later commits
`CargoLostToMonster`, one approved continuation may return an Agent to the canonical shelter page.
The Agent must reread current shelter, mission, and causal history through page-bound WebMCP before
the backend may accept one bounded `force_recall_soldier` action. Migration, siege, destructive
upgrades, irreversible recovery, and any later high-consequence action remain human-confirmed.

This is an application-selection decision, not a claim that the complete external Re-entry chain,
commercial demand, hosted runtime, or submission is already verified.

ADR-0043 subsequently accepts an additive standing-authorization v0.2 target for repeated ordered
signals, and RECORE-007 locally verifies its application-neutral Core/SQLite reference. Neither
changes this Host selection or its first visible `CargoLostToMonster` cycle. A v0.1
one-Grant/one-Event trace may remain a compatibility probe, but it cannot close the selected product
or standing-mode claim: TASK-033 requires two sequential effect-acknowledged signals under one
Consent after cross-layer adoption.

## Selected workflow

| Required field | Sleepless Kingdom specialization |
|---|---|
| Product layer | First-party Host web application and game backend under [`WebApp/Web-Game/`](../../WebApp/Web-Game/) |
| Primary user | A strategy-game player responsible for one persistent shelter and its soldiers |
| Buyer and operator | Initial challenge hypothesis: the game developer operates the game and Re-entry integration; payer and long-term distribution remain `UNKNOWN` |
| External actor | The authoritative world worker and seeded monster combat system |
| Persistent object | The shelter-scoped gatherer mission, mission attempt, causal event history, continuation signal, and the player's still-open recall decision |
| Initial state | The player assigns a GATHERER to a Wood or Rock route through the ordinary UI, reviews the scoped cargo-loss standing-authorization offer, authorizes it, and leaves the page |
| Later event | Exactly one eligible G2 signal type: `CargoLostToMonster`; later occurrences may activate sequentially under the standing Grant |
| Resumed state | The live page shows current shelter, active/reissued mission, revisions, signal digest, and causal history after the loss |
| Initial-only tool role | A future Game-specific consent action presents the bounded cargo-loss standing relationship through the same Host action used by normal UI; it creates no Grant by itself and is not yet implemented in the Game |
| Shared read tools | `inspect_shelter_state`, `inspect_client_snapshot`, `inspect_missions`, and `inspect_mission_history` |
| Resumed-only tool | `force_recall_soldier`, registered only when current server-owned continuation and mission state make it eligible |
| Bounded Agent effect | Recall the current eligible soldier using current revisions, signal identity, causal event identity, and idempotency; typed stale or in-combat failure remains valid |
| Human-only boundary | Migration, siege, destructive upgrades, irreversible recovery, and any action outside the accepted G2 recall envelope |
| Deterministic fixture | `sleepless-mvp-01`: 128 x 128 world, two shelters, five soldiers per shelter, four resource nodes, and one seeded monster; reset creates a fresh world identity |
| Canonical page | The authenticated shelter/game page at the selected hosted origin; exact production URL remains a CP-17 gate |

The initial consent action is a target specialization needed to complete the changed-tool-surface
proof. The current Game page has already verified the four reads and has implemented conditional
recall locally, but has not yet integrated the Manifest/Consent flow or proved the dynamic recall
through a genuine external Agent return.

## Why this application

Sleepless Kingdom is selected because it makes the temporal discontinuity visible without depending
on a third-party system:

1. the world continues for a credible reason after the player leaves;
2. the later event is committed by first-party authoritative game state, not fabricated as a prompt;
3. the page visibly changes from a routine mission view to a causal loss/recovery decision;
4. current revisions and state-derived tools are necessary because the mission may have reissued,
   returned, entered combat, or become stale before the Agent arrives;
5. one deterministic world can show event causality, absence, re-entry, bounded action, typed failure,
   and human limits in a memorable visual flow; and
6. the repository already contains a substantial real Host implementation and bounded evidence,
   reducing execution risk relative to starting another candidate from concept only.

The selection is intentionally narrower than the full multiplayer concept. The challenge target uses
one player, one shelter, one signal type, one standing Grant, one active bounded activation at a
time, and two sequential signal/effect/acknowledgement cycles without re-consent. A single v0.1 cycle
is compatibility evidence only. PvP, allied cascades, unconstrained autonomous play, spending,
migration, siege, and breach recovery are not part of the selected Re-entry proof.

## Why Re-entry Core and WebMCP are material

A notification or deep link would tell the player that cargo was lost but would still require the
player to reconstruct the mission and act. A backend job could recall automatically, but it would
remove the user-approved return, current page/session authority, fresh WebMCP tool discovery, and
visible human boundary. A one-shot Agent turn ends before the world event exists. A backend-only API
would bypass the live page state and its dynamically authorized action surface.

Re-entry Core therefore owns the governed time bridge: signed Manifest, Receiver-owned Consent and
standing Grant, ordered signed signal, durable pending Delivery, one-active backpressure,
target-scoped Connector claim, and one bounded activation per signal. WebMCP owns each resumed page
capability surface: fresh reads, conditional recall, and the same backend rules used by the human
application. The game server remains the only authority for world state and command legality. The
v0.1 one-run path remains a compatibility profile, not the final recurring-product proof.

## Agent-value claim boundary

The current G2 recall action is deliberately narrow and may often be chosen by a deterministic rule.
The selected prototype therefore proves governed temporal re-entry, fresh page grounding, dynamic
capability, and bounded execution; it does **not** yet prove that an LLM is economically or
strategically necessary for this one action.

The stronger game hypothesis is that later versions let players express bounded doctrine across
novel multi-factor states where several legal actions and human priorities compete. That hypothesis
must be validated against a transparent deterministic rule builder before it becomes a product or
competition claim. Failure of that test narrows the entry to a Re-entry/WebMCP mechanism demo; it
does not justify inventing more Agent authority.

## Continuation requirements profile

| Requirement | Selected first-slice value or current boundary |
|---|---|
| Event frequency | Repeated sequential `CargoLostToMonster` signals under one standing Grant; final proof requires two acknowledged cycles, while Game signals remain coalesced and subject to a 60-world-second product cooldown |
| Waiting window | Minutes are acceptable for the challenge slice; the effective Consent/Grant expiry must be selected and displayed before the external trace |
| Useful latency | Target is minutes, not seconds; exact maximum remains `UNKNOWN` and must be measured in a clean rehearsal |
| Offline behavior | The first slice may require the paired Mac and supported local runtime to be available; sleep/offline catch-up and expiry remain unverified |
| Execution topology | Hosted Game plus hosted Cloud Receiver v2 plus outbound macOS Local Connector plus one explicit Agent adapter; local fixture paths remain evidence only |
| Identity and privacy | Game identity, Receiver account/device identity, and Agent/browser session must remain separate; no cookie, bearer token, binding secret, Connector credential, or lease secret may enter the Event, URL, prompt, or public log |
| Concurrency | One player, one shelter, one target device, one standing Grant, at most one non-terminal activation, and one coalesced Game signal |
| Cost and no-op burden | `UNKNOWN`; measure Connector checks, Agent runs, failed/late activations, and operator recovery per successful continuation |
| Effect acknowledgement | Open until an independent Game effect authority proves the bounded action; Event `202`, Connector claim, process exit, or Agent narration is insufficient |

## Source and authority boundary

- The application-neutral Core remains under `reentry-core/` and `Docs/Core/`; Game code must not
  embed domain rules in Receiver or Connector modules.
- [`WebApp/Web-Game/AGENTS.md`](../../WebApp/Web-Game/AGENTS.md) and its scoped documents own Game
  product behavior, gameplay contracts, implementation, evidence, deployment, and task lifecycle.
- The Game must use the advanced Host SDK surface because its stable workflow identity, signal type,
  durable sequence, causal state version, canonical URL, standing Grant, one-active limit, and human
  boundary cannot be represented safely by ADR-0041's generic simple facade defaults.
- The current Local Connector fresh `codex exec` adapter remains a preview. It does not prove return
  to an existing task, Browser acquisition, authenticated Game session, page-bound WebMCP action, or
  Host-effect acknowledgement.
- RightSpot and other scenario implementations remain preserved alternatives or independent work;
  this decision neither deletes nor rewrites them.

## Evidence at selection time

The selected Game layer currently supports bounded evidence for:

- persistent authoritative gameplay, deterministic fixture/reset semantics, and browser-absent world
  progression;
- a real `CargoLostToMonster` causal chain to one coalesced Game signal;
- four canonical-page WebMCP reads and one genuine read-only invocation in one supported local
  Codex In-app Browser session; and
- one local worker-to-labelled-port-to-page-HTTP-to-provenance-bound-recall composition.

It does not yet prove Game Manifest enrollment, live Cloud Receiver v2 Event acceptance from the
Game, a compatible published Connector, a supported Agent-to-authenticated-Browser join, genuine
dynamic recall invocation after external Re-entry, default effect acknowledgement, hosted Game
continuity, independent browser identity, clean judge reproduction, demand, or submission.

## Alternatives considered

### RightSpot Rental Marketplace

Preserve as an unselected alternative. Its bilateral workflow and commercial language are credible,
but the current project has stronger first-party implementation and causal evidence in Sleepless
Kingdom, and the game makes absence, persistent change, and re-entry more visually immediate.

### Opportunity-to-Arrival, Greenlight, and TenderRelay

Preserve as historical or reference scenarios. They remain useful for testing business-workflow
generality, but selecting one now would reopen product and implementation work without improving the
current challenge critical path.

### Keep the Host application unselected

Rejected. It would preserve abstract optionality while continuing to block a coherent product demo,
runtime integration target, judge journey, and honest competition positioning.

## Consequences

- `TASK-001` may move to verification pending once the owning Core, Mechanism, scenario, and index
  documents are reconciled and local checks pass.
- Selected-app implementation and evidence continue only in the scoped Game layer; the closed
  application-neutral Core Program is not reopened.
- The next critical path is the exact advanced-SDK/Cloud-Receiver-v2/Connector handoff, Game
  Manifest/Consent enrollment, authenticated canonical-page return, genuine dynamic recall, and
  effect-backed acknowledgement.
- Product demand, Agent necessity, transport latency/cost, hosted identity, and judge reproduction
  remain explicit validation gates rather than assumed benefits of selection.

## Reversal

Reopen this decision if the Game cannot pass genuine dynamic WebMCP re-entry without transporting
credentials unsafely, cannot produce a clean deterministic judge run, fails the Agent-value test in a
way that makes the selected challenge thesis materially misleading, or another candidate offers a
substantially stronger complete proof before submission. Reversal requires a new ADR; it does not
delete this record or the Game implementation.
