# Sleepless Kingdom — Agent Guide

## 1. Scope and authority

This guide is the self-contained contributor authority for the Sleepless Kingdom game application
under `WebApp/Web-Game/`. Product truth, development process, task and issue governance,
verification cadence, and closure claims for this application are owned here and by the documents
this guide routes to.

Work inside this folder does not follow the outer WebMCP Challenge product documentation, task
lifecycle, engineering runbooks, or claim vocabulary. Those govern the Re-entry Core program and the
RightSpot application, not this one. Do not import an outer rule into this folder without recording
it in an accepted `ADR-GAME-*`.

## 2. Inherited physical constraints

Four constraints are inherited because they are physical rather than stylistic. Everything else is
owned here.

1. **Git root.** The repository is `WebMCP_Challenge`. Every branch, stage, commit, and push acts on
   that repository. Stage exact `WebApp/Web-Game/` paths only and preserve unrelated tracked,
   untracked, and ignored work, including RightSpot and Re-entry Core.
2. **Read-only dependencies.** `reentry-core/` and `mvp/` are consumed, never modified, to satisfy
   this application. A needed change there is a separate outer decision, not a game increment.
3. **English artifacts.** Every project-authored file is English: documentation, code, comments,
   identifiers, tests, fixtures, configuration, evidence, and commit messages. Owner quotations may
   stay non-English inside fenced source blocks in
   `Docs/Blueprint/01-raw-discussion-reference.md` only. Conversation with the owner may use
   Traditional Chinese.
4. **Submission claims.** Any Devpost eligibility, deadline, or submission statement remains
   governed by the live Official Rules. This folder can produce evidence for such a claim; it cannot
   make one.

## 3. Current stage and implementation authority

The application has an accepted concept baseline, a historical `SK-MVP-0.1` gameplay baseline, and a
coherent `SK-MVP-0.2` G2 contract. CP-04's bounded process foundation, CP-05's local persistence
foundation, the CP-06 local clock/recovery boundary, the CP-07 deterministic fixture boundary, and
the first bounded CP-08 movement/snapshot increment under `SK-TASK-022` are runtime-verified. The
worker-serialized cadence, command/read gateway, transport-neutral realtime projection, and local
authenticated wire increments are runtime-verified under `SK-TASK-023` through `SK-TASK-026`; the
bounded CP-09 dispatch/role-lock and route-arrival increments are runtime-verified under
`SK-TASK-027` and `SK-TASK-028`; the CP-10 extraction/cargo, cadence/`RETURNING`, same-worker
contested-node, return-navigation/home-crossing, and deposit/settlement increments are now
runtime-verified under `SK-TASK-029` through `SK-TASK-033`. The CP-11 gatherer-loss increment is
runtime-verified under `SK-TASK-034`, and the seeded Hunter-victory/return increment is runtime-verified
under `SK-TASK-035`, each with its accepted Challenge/ADR, local evidence, and cross-functional audit.
Automatic reissue is runtime-verified under `SK-TASK-036`. Visibility expansion, broader gameplay,
default-world bootstrap, production identity, and hosted-world claims remain unverified. The CP-12
additive projection and deterministic local renderer boundary is runtime-verified under `SK-TASK-037`,
the explicit non-production fixture session/initial-frame composition is runtime-verified under
`SK-TASK-038` at its named local level-4 scope, and one browser-context hydration/Canvas readback is
    runtime-verified under `SK-TASK-040`, the two-tab limitation is recorded under `SK-TASK-042`, and
    explicit same-scope manual reconnect/stale fallback is runtime-verified under `SK-TASK-043` and
    `SK-EVID-032`, and one local discrete keyboard/button movement path is runtime-verified under
    `SK-TASK-044`, `SK-EVID-033`, and `Validation/53`; snapshot-gated held input and touch controls are
    runtime-verified for the named local client presentation scope under `SK-TASK-054`, `SK-EVID-042`,
    and `Validation/66`; the server-owned continuous-intent path is runtime-verified for the named
    local worker-to-page scope under `SK-TASK-057`, `SK-EVID-043`, and `Validation/71`. The CP-13 capability question is settled for the transport: the first probe
    is runtime-verified for an unavailable adapter outcome under `SK-TASK-041` and `SK-EVID-030`, and
    the cause was model eligibility, so `SK-TASK-059` and `SK-EVID-045` are runtime-verified for
    positive page-tool discovery and one read-only invocation on the local disposable CP-02 page and
    `SK-ISSUE-001` is resolved. The canonical game page now has the accepted local page-registrar
    implementation, while supported-agent discovery/invocation on that page, independent two-browser
    delivery, genuine Re-entry, and hosted-world claims remain unverified. The ordinary-UI GATHERER dispatch
    boundary is runtime-verified under `SK-TASK-045`, `SK-EVID-034`, and `Validation/55`. Boundary-safe
    gameplay phase composition is runtime-verified under `SK-TASK-046`, `SK-EVID-035`, and
    `Validation/57`; the B trusted-elapsed/autonomous-scheduler authority extension is runtime-verified
    for one explicitly enabled local world under `ADR-GAME-0012`, `ADR-GAME-0033`, `SK-TASK-047`,
    `SK-EVID-036`, and `Validation/59`. The isolated CP-15 trace-support increment is
    contract-verified under `SK-TASK-048` and `SK-EVID-037`; the named local CP-15 aggregate is
    runtime-verified under `SK-TASK-049`, `SK-EVID-038`, and `Validation/60`. The owner-accepted
    `SK-TASK-053` page-tool contract and local `SK-TASK-061` implementation remain gated only by
    canonical supported-agent discovery/invocation and the later Re-entry/external handoff evidence.

Implementation work is authorized under the locked G1/G2 route. **CP-04 durable code was created only
under the registered child task `SK-TASK-004`, and CP-05 persistence code under `SK-TASK-005`;** the disposable probe harness remains evidence only
and is described in
[`Docs/Engineering/08-development-roadmap-and-checkpoints.md`](Docs/Engineering/08-development-roadmap-and-checkpoints.md). Eddy's Game-facing `reentry-core`, Host SDK, Local Connector, and Cloud web frontend source is already present in the outer `main` history; no additional Eddy branch merge is pending. The Cloud Receiver backend remains a separate `saas-boilerplate` deployment boundary. CP-14 is therefore a Game adapter and cross-runtime verification gate, with no silent fallback permitted. See [`ADR-GAME-0038`](Docs/Decisions/ADR-GAME-0038-cp14-merged-source-and-runtime-adaptation-boundary.md).

A described feature is never implementation evidence. Do not infer that a documented mechanism is
built, deployed, or judge-verified.

## 4. Start and route work

For every non-trivial task:

1. read [`Docs/00-Workflow/README.md`](Docs/00-Workflow/README.md) to classify risk, evidence,
   registration, verification, and closure;
2. read [`Docs/00-current-status.md`](Docs/00-current-status.md) for current application truth;
3. read [`Docs/README.md`](Docs/README.md) to find the document that owns the question;
4. read the active [`Task`](Docs/Tasks/README.md), owning module document, and governing
   `ADR-GAME-*`; and
5. follow [`Docs/00-Workflow/01-session-runbook.md`](Docs/00-Workflow/01-session-runbook.md) for
   increment selection, verification selection, and Git closure.

Use the minimum sufficient current authority. Do not copy mutable status, task detail, or procedure
into this file.

[`CLAUDE.md`](CLAUDE.md) is a loader that imports this guide at session start. It owns no rule. Start
a session from this directory so it applies.

## 5. Registration and decision gate

- Register bounded implementation work as `SK-TASK-NNN` in [`Docs/Tasks/`](Docs/Tasks/README.md).
- Register a verified defect, contradiction, or blocking uncertainty as `SK-ISSUE-NNN` in
  [`Docs/Issues/`](Docs/Issues/README.md). An ordinary planned task is not an issue.
- Record a durable choice as an `ADR-GAME-*` in [`Docs/Decisions/`](Docs/Decisions/README.md).
- Record fresh verification results as `SK-EVID-NNN` in [`Docs/Evidence/`](Docs/Evidence/README.md).

Before changing world authority, identity semantics, cargo or coin settlement, event ordering or
idempotency, persistence or snapshot shape, the WebMCP tool surface, the Re-entry action authority,
the human consequence boundary, or the `SK-MVP-*` contract version, complete the Challenge gate and
obtain an owner decision. An owner request is intent, not an authority override; when it conflicts
with an accepted contract, stop at the decision boundary and present the current rule, the proposed
difference, the impact, and the alternatives.

## 6. Engineering non-negotiables

- The server is authoritative for world time, position, mission state, cargo ownership, combat,
  settlement, and visibility. The browser is a projection and command surface.
- One database transaction writes the state mutation, the event log entry, and the eligible outbox
  row together. Delivery is at-least-once; domain effects are exactly-once by `event_id` and
  idempotency key.
- Implement the smallest coherent outcome with one real consumer. Do not add speculative
  abstractions, fallbacks, compatibility layers, or dependencies.
- Unsupported capability fails visibly. A fallback may represent an explicit product state; it may
  never hide invalid state, an authorization failure, data loss, or false success.
- Keep combat values, spawn rates, prices, and visual assets as tunable configuration. Keep
  identity, event, settlement, authority, and human-boundary rules normative.

## 7. Verification

- Mechanical documentation closure, run from this folder:

  ```sh
  python3 scripts/test_validate_game_docs.py
  python3 scripts/validate_game_docs.py --root . --report
  ```

  Run the self-test after changing the validator. A passing validator covers document structure,
  links, language, and record shape only; it is never runtime or gameplay evidence.
- Code verification activates at CP-04 and follows the ladder and cadence in
  [`Docs/00-Workflow/README.md`](Docs/00-Workflow/README.md#8-verification-ladder). Node 24 is the
  reproducible baseline; name any other runtime actually executed.
- Separate verified facts, inferences, targets, and unknowns. A plan under an assumption is not an
  implementation.
- At the start of each increment and again before commit, check whether intent, authority, contract,
  status, or claims changed. Reconcile the owning document before closure, or record why no update
  was needed.

## 8. Completion claims

Use only the closure labels defined in
[`Docs/00-Workflow/README.md`](Docs/00-Workflow/README.md#12-closure). Report the level actually
achieved. A local green test, a commit, a push, and a hosted run are four different facts, and none
proves the next.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
