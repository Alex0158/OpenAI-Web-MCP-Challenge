# SK-TASK-053: CP-13 Page Tool Contract and Schema Preparation

## Task Control

- Lifecycle state: `verified`
- Closure type: `specified`
- Checkpoint: `CP-13`
- Owner: Game owner
- Current increment: The owner accepted the amended four-read CP-13 package. The side-chat `assign_soldier_mission` suggestion was reviewed and retained as a deferred page-command candidate; it is not part of the current CP-13 tool surface because target discovery, Agent grant semantics, and its exact page schema are not yet closed.
- Next gate: The bounded implementation in [`SK-TASK-061`](SK-TASK-061-cp13-page-read-tools-and-recall-action-implementation.md) and its canonical four-read capability are verified under [`SK-EVID-047`](../Evidence/SK-EVID-047-cp13-page-tools-local-runtime-verification.md), [`SK-EVID-049`](../Evidence/SK-EVID-049-cp13-canonical-page-webmcp-runtime-verification.md), and [`Validation/75`](../Validation/75-cp13-page-tools-runtime-cross-functional-audit.md). Keep dynamic recall grant delivery and the deferred Soldier dispatch candidate outside this package until their target-discovery and grant boundaries are closed.

## Identity

- Task ID: `SK-TASK-053`
- Date: 2026-09-03
- Risk profile: `Assured`
- Reason for profile: The task prepares the page-bound WebMCP surface, which touches identity scope, command authority, revisions, idempotency, human consequences, and the capability evidence boundary. It is documentation-only and reversible, but an imprecise proposal could authorize an unsafe implementation.

## Objective

Create and close a reviewable minimum CP-13 page-tool contract proposal that maps the current
server-owned gateway, projection, and history authorities to exact read responsibilities, bounded
arguments, typed results, registration lifecycle, failure behavior, and verification vectors. The owner
accepted the amended four-read package on 2026-09-03. A supported adapter has already proved discovery
and one read-only invocation on the disposable CP-02 page; that result does not prove the canonical game
page's future tool registrations.

## Success and non-goals

- Success: The linked Challenge covers the four bounded G2 read tools and the explicitly deferred recall
  seam, with server-derived scope, result boundaries, registration/readback lifecycle, bounded history
  pagination, typed failure classes, and the human consequence boundary.
- Success: The side-chat `assign_soldier_mission` suggestion is recorded as a deferred candidate with a
  bounded follow-up boundary. It does not silently widen the current CP-13 surface or authorize a page
  mutation before target discovery, Agent grant semantics, and exact schema are accepted.
- Success: Every proposed field is classified as a current verified fact, an implementation inference, or an owner decision; no proposed shape is presented as an accepted contract or runtime evidence.
- Success: The package preserves the existing `SK-MVP-0.2` version, `WorkerCommandGateway` authority, full-snapshot reconciliation, signal policy, and visible unsupported behavior.
- Success: The package names the positive adapter, records the satisfied owner-acceptance gate, and
  links the verified server recall seam that the CP-13 page implementation consumes; it maps every
  W13-01 through W13-08 vector to a concrete proof obligation.
- Non-goals: WebMCP runtime code, page registration, a polyfill, adapter installation, additional capability
  probing, production identity, external Receiver/Connector work, Re-entry delivery, Soldier dispatch
  page-tool implementation, coordinated siege-party runtime
  implementation, schema migration, new event vocabulary, new snapshot fields, or a new contract version.

## Deferred Soldier command candidate

The side-chat suggestion is directionally compatible with the existing server authority, but it is
deferred beyond the current CP-13 package for four concrete reasons:

1. The current local route is an exact tier-one GATHERER command with an explicit `target_id`; it has no
   `target_selector` and does not expose the broader mission-kind union proposed in the side chat.
2. The Agent-facing `agent_snapshot_v1` intentionally omits raw resource-node IDs. A dispatch command
   without a bounded target-discovery read would be a fixed-fixture shortcut rather than a useful Agent
   operation.
3. The accepted G2 continuation grant authorizes one bounded recall after `CargoLostToMonster`; it does
   not implicitly authorize Agent-initiated dispatch. A future command needs an explicit page/session
   grant rule and human-boundary treatment.
4. Adding the command requires its own W13 coverage for valid dispatch, stale/role-lock/active-mission,
   ownership, target/tool compatibility, duplicate replay, and full-snapshot reconciliation.

If the candidate is reopened, the smallest safe follow-up is one single-soldier GATHERER command that
reuses the existing `assign-soldier-mission` envelope and gateway, accepts only a server-visible Wood or
Rock `target_id`, returns the existing bounded acknowledgement, and keeps HUNTER, selectors, siege
parties, and automatic Re-entry dispatch outside that increment. It must be paired with a bounded target
read or an explicitly accepted equivalent before an Agent can choose a target.

`force_recall_soldier` remains a separate page seam even though its server transition is now runtime-
verified under [`SK-TASK-060`](SK-TASK-060-cp13-recall-transition-implementation.md). A page registration
still requires the accepted grant, live revision reread, and full-snapshot reconciliation boundary.
A multi-soldier siege-party command requires its own atomicity, partial-success, and human consequence
decision before it is added to any page surface.

## Scope and authority

- In scope: this task record and [`Validation/64`](../Validation/64-cp13-page-tool-contract-preimplementation-challenge.md), with current-status, roadmap, task-index, and validation-index links needed to keep navigation truthful.
- Out of scope: `src/`, `tests/`, `package.json`, `reentry-core/`, `mvp/`, RightSpot, browser adapter configuration, external services, and all runtime or generated files.
- Allowed actions: read current authorities, write the task-owned English proposal and navigation links, and run the documentation validators. Do not stage, commit, push, deploy, use credentials, or contact external parties.
- Revalidate when: the CP-13 scenario, `SK-MVP-0.2`, the page/session boundary, the command/read gateway, WebMCP capability result, or the external handoff contract changes.

## Owning authority

- Normative product and tool boundary: [`Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md) and [`Engineering/05-api-and-webmcp.md`](../Engineering/05-api-and-webmcp.md)
- Page and session predecessors: [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md), [`ADR-GAME-0029`](../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md), [`SK-TASK-051`](SK-TASK-051-cp12-autonomous-realtime-snapshot-publication.md), and [`SK-TASK-045`](SK-TASK-045-cp12-human-gatherer-dispatch-and-authoritative-reconciliation.md)
- CP-13 vectors and open fields: [`Scenarios/13-cp13-webmcp-fixtures.md`](../Scenarios/13-cp13-webmcp-fixtures.md) and [`SK-TASK-013`](SK-TASK-013-cp13-webmcp-preimplementation-pack.md)
- Capability gate, now met: [`SK-TASK-041`](SK-TASK-041-cp13-webmcp-capability-probe.md), [`SK-TASK-059`](SK-TASK-059-cp13-site-tools-capability-experiment.md), [`SK-EVID-045`](../Evidence/SK-EVID-045-cp13-site-tools-capability-experiment.md), and the resolved [`SK-ISSUE-001`](../Issues/resolved/SK-ISSUE-001-webmcp-agent-adapter-unavailable.md)
- Execution discipline: [`Session Runbook`](../00-Workflow/01-session-runbook.md)

## Evidence status

- Verified: The server owns world time, identity, revisions, mission authority, cargo/settlement, and the only command/read gateway. CP-12 exposes a server-derived local fixture scope and one full `client_snapshot` projection ingress.
- Verified: The accepted G2 contract requires fresh page state and history reread before a Re-entry action, typed stale and ownership failures, idempotent effects, visible unsupported capability, and a human boundary for migration, siege, and destructive actions.
- Verified: An eligible GPT-5.6 Sol session with site tools enabled discovered and read-only invoked the tool registered by the local disposable CP-02 page, so `SK-ISSUE-001` is resolved and the adapter gate no longer blocks this package. The earlier negative probe on `gpt-5.6-luna` is explained by model eligibility. A page-context `typeof document.modelContext` readback proved unreliable on the browser-control surface and must not be used as an injection falsifier.
- Verified by independent review: R-01 through R-05 are decided in [`Validation/69`](../Validation/69-cp13-page-tool-proposal-independent-review.md). The accepted package therefore carries the separately verified recall seam, uses typed `IN_COMBAT`, projects a fixed Agent snapshot summary, maps persistence `OWNERSHIP_DENIED` to tool-level `NOT_OWNER`, and includes an explicit W13-01 through W13-08 mapping.
- Verified: The current `WorkerCommandGateway` and local HTTP adapter expose a server-side GATHERER
  dispatch authority. This is predecessor evidence for the deferred candidate only; it is not evidence
  that a canonical page tool is registered, discoverable, or runtime-verified.
- Verified external reference (not game evidence): the current WebMCP draft distinguishes page-side `getTools()` from browser-Agent discovery and leaves the browser-Agent exposure format unspecified. Page registration/readback therefore cannot substitute for the supported-adapter gate.
- Inferred: Four bounded reads are the smallest useful first CP-13 surface; the permission-checked recall
  action is server-verified but remains a page/session implementation gate. A single server-derived
  envelope and opaque cursor keep the proposal extensible without adding an extra state authority.
- Unknown: The actual supported browser/model registration API, final JSON Schema dialect and
  registration/readback response, grant propagation, exact history pagination transport, and the page
  transport for the now-verified recall service seam. The deferred dispatch candidate additionally needs
  target discovery and Agent grant semantics.

## Smallest reversible action

Write the linked Challenge amendments as an accepted preparation package, reconcile navigation and
current-next-task references, and run the documentation validators. The server recall seam is already
runtime-verified; stop page registration or page-command implementation if the page/session grant,
canonical transport, or full-snapshot reconciliation boundary is missing. The deferred dispatch
candidate still has unresolved target/grant dependencies. The disposable-page capability evidence is
already recorded; if the model, client, settings, origin, or page contract changes, reopen the Challenge
rather than silently promoting a proposed field or fallback.

## Verification and closure target

- Minimum verification: English/document structure/link validation, task-control validation, and a manual cross-check that every W13 vector and every open implementation field is either mapped to the proposal or named as an unresolved owner/adapter gate.
- Closure target: `specified` for the accepted preparation package. This task does not close CP-13 or
  establish WebMCP, Agent, Re-entry, browser, production, hosted, or judge evidence.
- Rollback or remediation: Remove no existing records. If the owner reopens the package, add the rejection
  or scope-change reason to this task and keep the four-read contract intact; preserve the current
  contract and capability evidence.
- Reopen trigger: any change to identity, grant scope, tool arguments/results, page transport, history visibility, human review, adapter support, or the `SK-MVP-0.2` version.

## Verification record

- `python3 scripts/test_validate_game_docs.py` — 22/22 validator tests passed.
- `python3 scripts/validate_game_docs.py --root . --report` — PASS after the accepted package and its
  page implementation task registration; the queue contains one bounded CP-13 page increment.
- `git diff --check` — passed for the repository worktree.
- No runtime, browser, WebMCP, Agent, Re-entry, dependency, or contract-version behavior was changed or
  claimed by this amendment.

## Preparation note

The four-read package is now accepted as preparation, and the server recall transition has its own
runtime evidence under [`SK-EVID-046`](../Evidence/SK-EVID-046-cp13-recall-transition-runtime-verification.md)
and [`Validation/73`](../Validation/73-cp13-recall-transition-runtime-cross-functional-audit.md). The
page-tool surface remains a high-risk authority boundary: page registration still needs the accepted
grant, canonical transport, live reread, and full-snapshot reconciliation. The side-chat dispatch
candidate remains outside CP-13 until its target discovery, Agent grant, exact schema, and W13 proofs
are accepted. The existing positive adapter evidence is a prerequisite receipt, not CP-13 game-page
implementation evidence.
