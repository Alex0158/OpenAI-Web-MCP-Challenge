# CP-13 through CP-18 Implementation Seam Map

**Status:** CP-13 local page implementation, canonical four-read capability, and the CP-14 game-side local-stub port are verified for named local scopes; dynamic recall, live external delivery, independent browser contexts, hosted continuity, and judge reproduction remain gated
**Contract:** [SK-MVP-0.2 contract sheet](09-mvp-contract-sheet.md)  
**Roadmap:** [Development roadmap and checkpoints](08-development-roadmap-and-checkpoints.md)  
**Audit:** [CP-17/18 preparation audit](../Validation/51-cp17-cp18-preparation-cross-functional-audit.md)  
**Purpose:** Give the implementation session a file-level route from the CP-12 handoff through WebMCP,
Re-entry, local verification, hosted continuity, and reviewer reproduction without inventing a second
authority, contract, queue, clock, identity map, or external service.

This is a routing and handoff document. It does not authorize code, select a provider, define a new
schema, or upgrade a claim. The owning checkpoint task, contract, ADR, current code, and fresh evidence
remain authoritative.

## Current static readback

The following facts were read from the current game tree while preparing this map:

- [`WorkerCommandGateway`](../../src/server/worker-command-gateway.ts) exposes movement, snapshot,
  clock, mission-assignment, page-read, and `force_recall_soldier` boundaries through one FIFO.
- [`PersistenceStore`](../../src/server/persistence/store.ts) already contains the durable signal-slot,
  delivery-claim, acknowledgement, retry, and terminal-rejection transitions used by CP-14. The
  adapter must wrap these transitions rather than copy them into memory.
- The bounded CP-16 local slice now forwards an optional server-owned eligibility grant from the
  terminal gatherer combat path into that existing transaction. The default combat path remains
  history-only when no grant is supplied; this does not implement delivery or a page tool.
- [`package.json`](../../package.json) has focused CP-13 page-tools and recall scripts in addition to
  the predecessor suites; any future aggregate must be owned by its checkpoint and must not be invented
  as a hidden `npm test`.
- [`SK-TASK-013`](../Tasks/SK-TASK-013-cp13-webmcp-preimplementation-pack.md) defines the historical
  minimum page-tool intent, and the accepted schema package is [`SK-TASK-053`](../Tasks/SK-TASK-053-cp13-page-tool-contract-preparation.md).
  The bounded local implementation is [`SK-TASK-061`](../Tasks/SK-TASK-061-cp13-page-read-tools-and-recall-action-implementation.md)
  with [`SK-EVID-047`](../Evidence/SK-EVID-047-cp13-page-tools-local-runtime-verification.md); the
  supported adapter prerequisite is [`SK-EVID-045`](../Evidence/SK-EVID-045-cp13-site-tools-capability-experiment.md),
  and the canonical-page four-read registration/readback plus one supported read-only invocation are
  verified under [`SK-EVID-049`](../Evidence/SK-EVID-049-cp13-canonical-page-webmcp-runtime-verification.md).
- The game tree contains no Receiver or Local Connector implementation. CP-14 can prove a game-side
  mapping with a labelled local stub after the positive CP-13 gate; live integration requires Eddy's
  versioned handoff.
- [`SK-TASK-069`](../Tasks/SK-TASK-069-cp16-local-causal-page-recall-composition.md) now composes the
  successful worker/combat reissue path through that local port and the canonical page HTTP read and
  recall seams. It remains local process/page evidence; it does not create an external adapter or
  close the genuine WebMCP, independent-browser, hosted, or judge gates.
- [`SK-TASK-070`](../Tasks/SK-TASK-070-cp16-local-causal-restart-recall-continuity.md) now verifies
  the same durable loss/reissue, signal, page reread, and bounded recall state across a clean restart
  of two sequential local entrypoints. It remains ladder-level 4 process/page evidence and does not
  imply autonomous downtime catch-up, crash supervision, external delivery, Agent/WebMCP action,
  independent browser, hosted, or judge behavior.
- [`SK-TASK-071`](../Tasks/SK-TASK-071-cp16-real-event-burst-page-context.md) now verifies two real
  worker loss/reissue outcomes coalescing into one signal, paginated page history retaining both causal
  records, and a latest-event-provenance-bound recall. It remains ladder-level 4 process/page evidence
  and does not imply Connector/Thread backpressure, external delivery, Agent/WebMCP action, browser,
  hosted, or judge behavior.

These are static ownership and surface observations. They are not runtime, capability, hosted, or
judge evidence.

## Seam map

The first Red proof named in this table is the smallest contract-level failure to express when the
checkpoint becomes active. A future task may choose a different test filename, but it must preserve
the same observable boundary and claim limit.

| Seam | Current owner and surface | Later implementation increment | First Red proof | Transitive verification | Gate and forbidden shortcut |
|---|---|---|---|---|---|
| S13-A Page lifecycle and scope | `src/server/entrypoint.ts`, `src/server/fixture-session.ts`, `src/server/realtime-wire.ts`, `src/client/live-game-projection.tsx`, `src/client/projection-model.ts` | **Implemented locally:** entrypoint-owned page read/command boundary bound to the server-derived session; CP-12 stale/reconnect lifecycle preserved | W13-01, W13-02 | CP-12 projection, fixture, realtime, reconnect, and `SK-EVID-047` page suite | readback is verified under `SK-EVID-049`; page code cannot construct a worker, store, scope resolver, or second queue |
| S13-B Bounded recall | `src/server/worker-command-gateway.ts`, `src/server/mission-service.ts`, `src/server/persistence/store.ts` | **Implemented locally:** one permission-checked, signal-provenance-checked, revision-checked recall result over the existing transition | W13-03 through W13-06 | CP-09 dispatch/role lock, CP-10 return/navigation, CP-11 reissue, CP-12 projection, and CP13 recall/page suites | Canonical dynamic recall grant/readback remains open; no teleport, client-selected soldier, coin creation, or silent stale success |
| S13-C Capability boundary | `src/client/webmcp-page-tools.ts`, disposable `probe/cp02/`, `SK-ISSUE-001` | **Implemented locally:** register the accepted reads and continuation-gated recall with semantic same-page readback; capture canonical discovery/invocation separately | W13-01 and W13-07 | CP-02 evidence, `SK-EVID-047`, and a future canonical-page capability result | The supported adapter result is recorded under `SK-EVID-049`; dynamic recall remains a separate gate; no polyfill, fake tool list, or synthetic success |
| S14-A Event to delivery slot | `src/server/persistence/store.ts` and `src/server/persistence/types.ts` (`signalSlot`, `outboxDelivery`, claim/ack/retry/reject) | **Implemented locally under `SK-TASK-062`:** `ReentryDeliveryPort`/`pumpOnce` selects one existing durable record and maps one coalesced envelope | R14-01 through R14-05 | CP-05 persistence, CP-11 cargo-loss, CP-13 page reread, and [`SK-EVID-050`](../Evidence/SK-EVID-050-cp14-game-side-local-stub-delivery-port-runtime-verification.md) | Local stub evidence is verified; no second queue, timer, worker, world clock, or identity resolver; live external binding remains gated |
| S14-B External handoff and Thread backpressure | No game-side Receiver/Connector module; external ownership is outside this tree | [`SK-TASK-076`](../Tasks/SK-TASK-076-cp14-cloud-receiver-v2-game-adaptation.md) binds ordered Game signals to ADR-0043 protocol-v0.2 standing Event ingress, while Eddy retains one-active Connector claim/lease, fresh activation, Thread backpressure, and effect ACK ownership | R14-06 and R14-09 | CP-14 two-signal delivery trace and CP-16 causal evidence, plus [`Validation/89`](../Validation/89-cp14-cloud-receiver-v2-adaptation-cross-functional-audit.md) and outer RECORE-007 | Exact v0.2 external handoff required; queue acceptance is not claim/effect/ACK; Game retains a signal on retryable activation backpressure and never handles the Cloud lease |
| S15-A Contract/race matrix | `tests/` focused suites and [`package.json`](../../package.json) scripts through CP-12 | Add only the focused CP-13/14 suites and execute the row-complete CP-15 matrix with explicit outcomes | T15-01 through T15-10 | Affected predecessor suites, typecheck, docs validator, and one owned aggregate when due | CP-14 runtime and task-owned Verification Budget; no percentage gate, hidden retry, or invented aggregate |
| S16-A Local vertical slice | `src/server/fixture-session.ts`, `src/server/entrypoint.ts`, `src/client/live-game-projection.tsx`, CP-14/15 evidence | Execute the reset, two-player, browser-close, loss, signal, reread, recall, restart, burst, and trace runbook | S16-01 through S16-07 | CP-15 matrix, CP-12 projection/reconnect checks, [`SK-EVID-056`](../Evidence/SK-EVID-056-cp16-local-causal-page-recall-composition-runtime-verification.md), [`SK-EVID-057`](../Evidence/SK-EVID-057-cp16-local-causal-restart-recall-continuity-runtime-verification.md), [`SK-EVID-058`](../Evidence/SK-EVID-058-cp16-real-event-burst-page-context-runtime-verification.md), and [`SK-EVID-051`](../Evidence/SK-EVID-051-cp16-independent-browser-context-capability-probe.md) | The local HTTP composition, clean restart continuity, and real burst coalescing are verified at their named ladder-4 scopes; CP-15 closure plus two genuine browser contexts, external delivery/backpressure, hosted continuity, and judge proof remain open |
| S17-A Hosted continuity | `src/server/entrypoint.ts`, `src/server/runtime.ts`, `src/server/health.ts`, `src/server/config.ts`, `src/server/game-session.ts`, `src/server/production-bootstrap.ts`, [`06-operations-and-hosting.md`](06-operations-and-hosting.md) | **Local production-like boundary and bounded hosted entry surface implemented under [`SK-TASK-078`](../Tasks/SK-TASK-078-cp17-production-identity-and-hosted-admission.md):** one-time named-world bootstrap, Clerk-backed server identity, generic HTTP command/page-tool admission, and WebSocket scope reuse the one-process contract; [`ADR-GAME-0037`](../Decisions/ADR-GAME-0037-cp17-railway-single-service-sqlite-volume.md) fixes the first Railway Volume-backed SQLite topology | H17-01 through H17-08 | CP-16 trace, Node 24 build/typecheck, focused admission matrix, production-like process checks, [`SK-EVID-063`](../Evidence/SK-EVID-063-cp17-railway-resource-provisioning-preflight.md), [`SK-EVID-065`](../Evidence/SK-EVID-065-cp17-hosted-deployment-and-clerk-domain-runtime-verification.md), [`SK-EVID-066`](../Evidence/SK-EVID-066-cp17-player-one-hosted-session-command-runtime-verification.md), [`SK-EVID-067`](../Evidence/SK-EVID-067-cp17-player-two-hosted-session-command-runtime-verification.md), [`SK-EVID-068`](../Evidence/SK-EVID-068-cp17-independent-contexts-concurrent-hosted-runtime-verification.md), and [`SK-EVID-069`](../Evidence/SK-EVID-069-cp17-hosted-restart-backup-continuity-runtime-verification.md) | Railway deployment/health, custom Game TLS, Clerk DNS/SSL/JWKS, signed-out admission, sequential and concurrent scoped commands/settlement, hash-verified backup, in-place restart, authenticated reconnect, same-world readback, and post-restart WebSocket rejection are read back at bounded hosted levels 4–6; deliberate authenticated cross-player denial, a clean browser-absent interval, rollback/read-restore, and hosted closure remain open |
| S18-A Reviewer reproduction | [`Design/05-hackathon-demo.md`](../Design/05-hackathon-demo.md), CP-17/18 tasks and scenarios, closure template | Assemble clean-identity runbook, architecture view, causal timeline, capability/recovery receipts, artifact manifest, and claim table | J18-01 through J18-07 | CP-16/17 evidence, independent readback, redaction, and live submission rules | CP-17 hosted verification and required external handoff; no private context or judge claim from screenshots |

## Implementation order after the gates

1. CP-12 reconnect, page lifecycle, and scope boundaries are closed for their named local scopes.
2. CP-02 adapter capability is proven for the disposable page under `SK-EVID-045`; canonical game-page
   four-read registration/readback and one supported read-only invocation are verified under `SK-EVID-049`.
3. CP-13 local reads and the single bounded recall action are implemented under `SK-TASK-061`, using the
   existing gateway and persistence authority. Typed positive, stale, duplicate, cross-shelter, and
   unsupported outcomes are recorded under `SK-EVID-047`; canonical read capability is recorded under `SK-EVID-049`.
4. After positive canonical CP-13 evidence, the game-side CP-14 port is implemented and verified under
   `SK-TASK-062`/`SK-EVID-050` against a labelled local stub. Keep `signal_id`, event cursors, opaque
   binding, lease identity, and acknowledgement semantics intact; wait for Eddy's versioned handoff
   before live integration.
5. Before any live external adapter code, process [`SK-TASK-076`](../Tasks/SK-TASK-076-cp14-cloud-receiver-v2-game-adaptation.md)
   against Eddy's owner-declared exact v2 handoff. Keep the Game publication lease separate from the
   Cloud Connector lease, use a server-only binding/workflow/session map, and record `202` as queue
   acceptance only. Do not use the deprecated `runtime/cloud-receiver/` or guess the consent route.
6. Run the CP-15 row-complete matrix and record a Verification Budget. A green local suite cannot
   upgrade an external, hosted, two-session, or judge claim.
7. Execute the CP-16 local rehearsal with a fresh file-backed fixture, explicit worker/world-time
   advances, two independent contexts, browser absence, restart, and a timestamped redacted trace.
8. Use [`SK-TASK-077`](../Tasks/SK-TASK-077-cp17-host-decision-and-deployment-preflight.md) and the
   accepted [`ADR-GAME-0037`](../Decisions/ADR-GAME-0037-cp17-railway-single-service-sqlite-volume.md)
   to run the CP-17 deployment rehearsal. [`SK-TASK-078`](../Tasks/SK-TASK-078-cp17-production-identity-and-hosted-admission.md)
   owns the local production-like identity/bootstrap seam and focused matrix; the bounded hosted
   Railway/Clerk entry readback is recorded under [`SK-EVID-065`](../Evidence/SK-EVID-065-cp17-hosted-deployment-and-clerk-domain-runtime-verification.md),
   while authenticated continuity remains required before CP-18. CP-18 consumes the exact hosted
   evidence and cannot repair an earlier gap.

## Cross-boundary handoff fields

Every implementation session should carry these fields forward without renaming or reinterpreting
them:

| Field group | Required continuity |
|---|---|
| Contract | `SK-MVP-0.2` (or an explicitly accepted successor) and compatible schema/event/snapshot versions |
| Authority | Server/worker owns world time, mission, cargo, settlement, visibility, signal eligibility, and command effects |
| Identity | World, player, shelter, opaque binding, mission attempt, event, signal, delivery lease, and idempotency keys remain distinct |
| Time | Authoritative `world_time` decides game transitions; wall time is used only for transport lease/retry evidence |
| Delivery | One pending/in-flight signal per shelter/binding, coalesced eligible context, explicit ack/retry/terminal outcomes, and no per-event Thread wake |
| Page action | Fresh server-scoped reads precede the revision-checked bounded command; late outcomes are typed and visible |
| Evidence | Source/runtime/fixture identity, event ids/cursors, expected/actual readback, skipped/gated rows, claim limit, and redaction status |

## Reopen and stop conditions

Reopen the affected task and this map when CP-12 changes the page/session contract, CP-13 changes the
tool schema or transport, CP-14 changes signal identity/coalescing/acknowledgement, CP-15 changes the
test harness or evidence policy, CP-16 changes the causal story, or CP-17 changes host/storage
assumptions. Stop before implementation if any path requires a second authority, client-selected
identity, hidden retry, silent event loss, unowned external behavior, or a contract version change.

This map is complete for documentation-level routing. CP-13's local page implementation and canonical four-read capability are verified, and the CP-14 game-side local-stub port is verified under `SK-EVID-050`,
but this map does not close dynamic recall, CP-14 external delivery, CP-15 runtime
verification, CP-16 local slice, CP-17 hosted continuity, or CP-18 judge reproduction.
