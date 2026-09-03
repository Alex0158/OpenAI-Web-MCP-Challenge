# CP-13 Page-Bound WebMCP Fixtures

**Status:** Local page implementation and canonical four-read capability are verified for named local scopes; dynamic recall and Re-entry remain open  
**Checkpoint:** CP-13  
**Contract:** [MVP contract sheet](../Engineering/09-mvp-contract-sheet.md)  
**Audit:** [CP-10/18 critical-path audit](../Validation/10-cp10-cp18-preimplementation-audit.md)  
**Task:** [SK-TASK-013](../Tasks/SK-TASK-013-cp13-webmcp-preimplementation-pack.md)  
**Implementation task:** [SK-TASK-061](../Tasks/SK-TASK-061-cp13-page-read-tools-and-recall-action-implementation.md)  
**Purpose:** Specify and verify a genuine page-bound WebMCP read surface and a bounded recall action with
visible unsupported behavior and human fallback. The local server, transport, registration lifecycle,
grant gate, and reconciliation implementation are verified at their named scope; canonical four-read
registration/readback and one supported read-only invocation are recorded under [`SK-EVID-049`](../Evidence/SK-EVID-049-cp13-canonical-page-webmcp-runtime-verification.md). Dynamic recall, Agent grant delivery, and Re-entry evidence remain open.

These vectors are preparation inputs and observable outcomes. They do not create a new rule, schema,
event, command, transport, host, or external service contract. A fake clock, network, browser, or
external stub is a test instrument only.

## Fixture and authority boundary

- Contract version: SK-MVP-0.2 unless the owning task explicitly records a later accepted version.
- Dependency: CP-12 and CP-02.
- Owning authority: Engineering/05-api-and-webmcp.md, Design/Capabilities/07-event-driven-agent-continuation.md, ADR-GAME-0006, and the page command contract.
- Cross-functional handoff: CP-12 provides page lifecycle and fallback; CP-09 provides mission and role locks; CP-10/11 provide current outcomes; CP-14 consumes the tool result; CP-02 supplies capability evidence only.
- Scope: Page registration lifecycle, four bounded inspect tools, the server-verified
  `force_recall_soldier` page seam, session ownership, revisions, idempotency, typed failures,
  capability readback, and human boundary.
- Non-goals: Backend authority, external Receiver/Connector, private Agent context, arbitrary prompts, migration/siege tools, destructive upgrades, authentication redesign, or a silent polyfill.

## CP-12 handoff constraints

- `LocalFixtureSessionContext` is server-owned. A page tool may not submit `player_id`, `shelter_id`, `binding`, position, or hidden-state values as authority.
- The entrypoint resolves the session and invokes the existing worker gateway. A Next route or page bundle must not construct a worker, persistence store, resolver, or second command queue.
- The accepted G2 starting surface is the four bounded reads `inspect_shelter_state`,
  `inspect_client_snapshot`, `inspect_missions`, and `inspect_mission_history`. The bounded mutation
  `force_recall_soldier` now has a runtime-verified server transition under
  [`SK-EVID-046`](../Evidence/SK-EVID-046-cp13-recall-transition-runtime-verification.md); its local
  page grant, transport, and reconciliation implementation are covered by [`SK-EVID-047`](../Evidence/SK-EVID-047-cp13-page-tools-local-runtime-verification.md).
  Other candidate tools remain outside CP-13.
- The local page suite proves implementation behavior and the fake model-context lifecycle only. It does
  not prove genuine browser WebMCP registration/readback, supported-agent invocation, or Re-entry delivery.

## Evidence classification

- Verified inputs: The page and Agent use the same command/read gateway; ownership, revision, role lock, idempotency, current state, and unsupported capability are required checks.
- Resolved implementation choices: Four bounded reads, fixed `agent_snapshot_v1`, server-derived scope,
  bounded history pagination, the entrypoint-owned page transport, semantic registration readback,
  continuation-gated recall, typed provenance failures, unsupported UX, and full-snapshot reconciliation
  are recorded in [`Validation/74`](../Validation/74-cp13-page-tools-implementation-preimplementation-challenge.md)
  and [`SK-EVID-047`](../Evidence/SK-EVID-047-cp13-page-tools-local-runtime-verification.md).
- Open evidence fields: dynamic recall grant delivery, external Signal/Receiver/Connector delivery,
  Re-entry continuation, independent browser contexts, and hosted behavior. Canonical same-page
  registration/readback and one supported GPT-5.6 Sol plus medium read-only invocation are verified in
  [`SK-EVID-049`](../Evidence/SK-EVID-049-cp13-canonical-page-webmcp-runtime-verification.md). The
  earlier Luna discovery limitation remains preserved as historical evidence in [`SK-EVID-048`](../Evidence/SK-EVID-048-cp13-canonical-page-browser-attempt.md).

## Vectors

### W13-01 — Registration readback

**Given:** The canonical page loads in a browser with document.modelContext support.  
**When:** The page registers the accepted tools.  
**Then:** The tool names and schemas are read back from the same page context with no second authority.

### W13-02 — Inspection read

**Given:** Player A requests inspect_shelter_state or inspect_missions.  
**When:** The tool executes under the current session.  
**Then:** Only Player A scope is returned with contract version, current revisions, and readable state.

### W13-03 — Valid recall action

**Given:** The server recall transition is runtime-verified under [`SK-EVID-046`](../Evidence/SK-EVID-046-cp13-recall-transition-runtime-verification.md), a current mission is field-active, and the user grant permits bounded recall.  
**When:** The Agent invokes `force_recall_soldier` with current attempt/revisions and idempotency key.  
**Then:** The server returns the causal result and the page reflects normal return; no teleport or coin
 is created. Page execution remains gated only for the dynamic grant and snapshot-to-recall path; the
 canonical registration and read-only capability path is verified under [`SK-EVID-049`](../Evidence/SK-EVID-049-cp13-canonical-page-webmcp-runtime-verification.md).

### W13-04 — Stale recall

**Given:** The page reads a current mission and the mission changes after the Agent reads it.  
**When:** The old recall arrives.  
**Then:** The server returns `STALE_REENTRY_CONTEXT` or `STALE_REVISION` and leaves the newer mission
 unchanged.

### W13-05 — Cross-shelter denial

**Given:** A tool call uses another shelter's soldier or history id.  
**When:** The page gateway validates ownership.  
**Then:** The result is typed `NOT_OWNER` with no hidden state or mutation; the persistence-layer
 `OWNERSHIP_DENIED` value is mapped at the tool boundary.

### W13-06 — Duplicate recall

**Given:** The same page recall call is delivered twice with the same idempotency key.  
**When:** The adapter handles the retry.  
**Then:** The original result is returned and no second return event is written.

### W13-07 — Capability unavailable

**Given:** The browser lacks document.modelContext or registration fails.  
**When:** The page initializes.  
**Then:** The capability is visibly unsupported and the human surface remains usable.

### W13-08 — Human boundary

**Given:** A request attempts a migration, siege, or destructive upgrade through the page tool surface.  
**When:** The adapter validates the command class.  
**Then:** The action stops at the documented human boundary rather than being silently approved.

## Shared assertions

- The owning server/worker authority remains the only state-changing authority.
- Revisions, idempotency, world identity, and causal event identity prevent duplicate effects.
- A projection, test stub, screenshot, or delivery envelope cannot replace durable game state.
- Cross-module handoffs use the owning mechanism's state and event boundary; no consumer invents a
  second role, mission, ledger, clock, route, or external delivery path.
- Recall cannot bypass an encounter in `CONTACT`, `LOCKED`, or `RESOLVING`; the selected G2 result is
  typed `IN_COMBAT` with no phase change.
- A valid continuation registers `force_recall_soldier` at most once per page registration generation,
  even when concurrent shelter reads return the same grant, and the action is ready only after its
  semantic schema readback succeeds.
- A partial registration, initial schema mismatch, or continuation recall readback failure aborts the
  active page generation, removes every page tool, exposes an `error` status, and keeps human controls
  available without inferring a domain request.
- A page response resolving after reconnect or stop is rejected as stale before it can register a
  continuation, invoke reconciliation, or return data from the old generation.
- The page transport rejects query-selected identity, non-JSON media, an oversized body, and unknown
  input fields before invoking the server gateway.
- Positive, negative, boundary, retry, restart, browser-absent, and unsupported-capability outcomes
  remain distinguishable in evidence.
- A run repeated with the same fixture, seed, event order, and command versions produces the same
  authoritative result, unless an explicitly open production policy is being measured.

## Remaining canonical evidence fields

- same-page `registerTool`/`getTools` behavior on the canonical game page in a supported browser;
- one supported GPT-5.6 Sol discovery and read-only invocation of a canonical page read;
- external Signal/Receiver/Connector delivery and Re-entry continuation (CP-14);
- hosted identity, continuity, and independent browser reproduction.

The local implementation choices are closed inside the checkpoint authority. Any later value that changes
the accepted contract, human consequence, external handoff, or settlement boundary requires a new
decision and task rather than an implicit edit to this fixture.

## Non-goals

This fixture is a planning aid. It does not prove runtime, slice, hosted, or judge reproduction and
does not authorize code outside its checkpoint.
