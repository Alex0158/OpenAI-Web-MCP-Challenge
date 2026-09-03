# CP-12 Canvas and Dashboard Fixtures

**Status:** Local projection/renderer, named fixture session/first frame, one-browser-context hydration/Canvas readback, explicit same-scope manual reconnect/stale fallback, discrete keyboard/button movement, snapshot-gated held input, and server-owned continuous intent are verified at named local scopes; independent two-browser behavior, hosted/session identity, and final mobile quality remain open  
**Checkpoint:** CP-12  
**Contract:** [MVP contract sheet](../Engineering/09-mvp-contract-sheet.md)  
**Audit:** [CP-10/18 critical-path audit](../Validation/10-cp10-cp18-preimplementation-audit.md)  
**Preparation task:** [SK-TASK-012](../Tasks/SK-TASK-012-cp12-canvas-dashboard-preimplementation-pack.md)  
**Runtime task:** [SK-TASK-037](../Tasks/SK-TASK-037-cp12-client-projection-and-mission-row.md)  
**Runtime evidence:** [SK-EVID-026](../Evidence/SK-EVID-026-cp12-client-projection-runtime-verification.md)  
**Runtime audit:** [CP-12 runtime cross-functional audit](../Validation/42-cp12-client-projection-runtime-cross-functional-audit.md)  
**Session challenge:** [CP-12 local fixture session challenge](../Validation/43-cp12-local-fixture-session-preimplementation-challenge.md)  
**Session task:** [SK-TASK-038](../Tasks/SK-TASK-038-cp12-local-fixture-session-and-initial-frame.md)  
**Session evidence:** [SK-EVID-028](../Evidence/SK-EVID-028-cp12-local-fixture-session-runtime-verification.md)  
**Session audit:** [CP-12 local fixture session runtime cross-functional audit](../Validation/45-cp12-local-fixture-session-runtime-cross-functional-audit.md)  
**Browser tasks:** [SK-TASK-040](../Tasks/SK-TASK-040-cp12-browser-hydration-and-two-session-smoke.md), follow-on isolation task [SK-TASK-042](../Tasks/SK-TASK-042-cp12-independent-two-session-browser-isolation.md), reconnect task [SK-TASK-043](../Tasks/SK-TASK-043-cp12-browser-reconnect-and-stale-fallback.md), and movement task [SK-TASK-044](../Tasks/SK-TASK-044-cp12-keyboard-movement-and-authoritative-reconciliation.md)  
**Browser challenge:** [CP-12 browser hydration and two-session challenge](../Validation/46-cp12-browser-hydration-and-two-session-preimplementation-challenge.md)  
**Browser evidence:** [SK-EVID-029](../Evidence/SK-EVID-029-cp12-browser-hydration-runtime-verification.md)  
**Browser audit:** [CP-12 browser hydration runtime cross-functional audit](../Validation/47-cp12-browser-hydration-runtime-cross-functional-audit.md)  
**Reconnect evidence and audit:** [SK-EVID-032](../Evidence/SK-EVID-032-cp12-browser-reconnect-runtime-verification.md); [Validation/50](../Validation/50-cp12-browser-reconnect-runtime-cross-functional-audit.md)  
**Movement evidence and audit:** [SK-EVID-033](../Evidence/SK-EVID-033-cp12-keyboard-movement-runtime-verification.md); [Validation/53](../Validation/53-cp12-keyboard-movement-runtime-cross-functional-audit.md)  
**Held-input task, decision, evidence, and audit:** [SK-TASK-054](../Tasks/SK-TASK-054-cp12-held-movement-and-touch-input.md); [ADR-GAME-0035](../Decisions/ADR-GAME-0035-cp12-snapshot-gated-held-movement.md); [SK-EVID-042](../Evidence/SK-EVID-042-cp12-held-movement-runtime-verification.md); [Validation/65](../Validation/65-cp12-held-movement-preimplementation-challenge.md); [Validation/66](../Validation/66-cp12-held-movement-runtime-cross-functional-audit.md)  
**Server-owned intent decision, implementation, evidence, and audit:** [SK-TASK-055](../Tasks/SK-TASK-055-cp12-server-owned-continuous-intent-preparation.md); [ADR-GAME-0036](../Decisions/ADR-GAME-0036-cp12-server-owned-continuous-intent.md); [Validation/67](../Validation/67-cp12-server-owned-continuous-intent-preimplementation-challenge.md); [SK-TASK-057](../Tasks/SK-TASK-057-cp12-server-owned-continuous-intent.md); [SK-EVID-043](../Evidence/SK-EVID-043-cp12-server-owned-continuous-intent-runtime-verification.md); [Validation/71](../Validation/71-cp12-server-owned-continuous-intent-runtime-cross-functional-audit.md) — Option B accepted and runtime-verified for the named local scope  
**Purpose:** Prepare the minimal Canvas and React/HTML presentation that renders authoritative projections, explains causal state, and remains usable without WebMCP.

These vectors are preparation inputs and observable outcomes. The named local projection/renderer
vectors are runtime-verified under SK-TASK-037, the process-level bootstrap/first-frame vector is
runtime-verified under SK-TASK-038, one browser context is runtime-verified under SK-TASK-040, and the
named manual reconnect/stale-fallback vector is runtime-verified under SK-TASK-043, and one discrete
focused keyboard/button command path is runtime-verified under SK-TASK-044, and the snapshot-gated
held-input path is runtime-verified under SK-TASK-054. The server-owned continuous-intent contract is
accepted under SK-TASK-055/ADR-GAME-0036/Validation-67 and runtime-verified under SK-TASK-057,
SK-EVID-043, and Validation-71. Pixel-quality, a silent no-settle acceptance deadline, and
two-browser/session vectors remain open even though the named browser readbacks are recorded.
They do not create a new rule, schema,
event, command, transport, host, or external service contract. A fake clock, network, browser, or
external stub is a test instrument only.

## Fixture and authority boundary

- Contract version: SK-MVP-0.2 unless the owning task explicitly records a later accepted version.
- Dependency: CP-08 through CP-11.
- Owning authority: Design/06-visual-ui-and-asset-spec.md, Design/02-map-fog-and-exploration.md, Design/03-dashboard-and-operations.md, ADR-GAME-0007, and the client_snapshot contract.
- Cross-functional handoff: CP-08 defines snapshot scope and positions; CP-09/10/11 define mission/cargo/combat records; CP-13 requires the canonical page; CP-14 requires a readable return surface; CP-16 needs a human path.
- Scope: Canvas layer order, React controls/HUD, mission rows, event history, connection state, visual asset IDs/placeholders, accessible equivalents, interpolation/reconciliation, and CP-13/14 handoffs.
- Non-goals: Authoritative state, persistence, movement logic, combat logic, WebMCP registration, external delivery, final illustration, elaborate animation, mobile optimization, or measured production FPS claims.

## Evidence classification

- Verified inputs: Canvas/React split, projection-only rendering, 60 FPS interpolation ceiling, stable asset/state vocabulary, placeholder allowance, visible stale/reconnect status, and text equivalents.
- Preparation inference: A small atlas plus geometric placeholders and one readable dashboard will produce more judge value than a broad asset library before the causal trace works.
- Open fields: camera and interpolation correction policy, final asset atlas format, text equivalent detail and focus order, reduced-motion presentation, snapshot size and draw budget, and the owner decision on server-owned intent lifecycle and transport.

## Vectors

### V12-01 — Initial projection

**Given:** A full player-scoped client_snapshot contains terrain, fog, nodes, shelter, avatar, and allowed actors.  
**When:** The page renders the first frame.  
**Then:** Canvas draws the accepted layer order and React shows world time, connection state, and shelter context without inventing state.

### V12-02 — Discrete authoritative movement reconciliation

**Given:** The focused map or a labelled direction button submits one typed adjacent movement command.  
**When:** HTTP acknowledges a committed revision and the next matching full WebSocket snapshot is accepted.  
**Then:** The acknowledgement does not move the avatar; the prior projection remains visible until the
full snapshot reaches the acknowledged revision and replaces position/fog together. A blocked result
changes no position, fog, revision, or event.

### V12-02b — Snapshot-gated held input

**Given:** A ready focused map or labelled direction button remains held for one direction.
**When:** The existing discrete move settles through a matching authoritative full snapshot.
**Then:** The controller waits at least 180 ms, may issue one next move, and stops on release, blur,
hidden visibility, disabled/stale/closed state, definitive rejection, scope change, or teardown. No
queued command, predicted position, browser-world clock, or generated-click duplicate is permitted;
detail-zero assistive activation still performs one discrete move.

### V12-03 — Remote interpolation

**Given:** A permitted remote actor moves between two accepted snapshots.  
**When:** The browser renders between frames.  
**Then:** Interpolation is visually smooth while the authoritative event, visibility, and collision remain server-owned.

### V12-04 — Mission row readability

**Given:** A soldier projection includes role, tool, target, route, phase, cargo, encounter, revision, and next action.  
**When:** The dashboard renders the row.  
**Then:** A player can distinguish locked, returning, lost, respawned, and waiting states without relying on color or animation.

### V12-05 — Fog and hidden state

**Given:** The snapshot contains explored cells and permitted visible actors but omits hidden terrain and private cargo.  
**When:** Canvas and text layers render.  
**Then:** No hidden value appears through artwork, labels, placeholder geometry, or error details.

### V12-06 — Stale and reconnecting view

**Given:** A snapshot base is missing or the realtime channel drops.  
**When:** The client changes connection state.  
**Then:** The page shows STALE/RECONNECTING, disables state-changing controls until full resync, keeps
same-scope mission/history/map state readable, hides stale sensed-resource counts, and exposes one
explicit reconnect action after prompt failure or close. A changed bootstrap scope clears the retained
snapshot before the new frame.

### V12-07 — WebMCP unavailable

**Given:** The browser does not expose the page capability.  
**When:** The dashboard initializes.  
**Then:** Human controls and evidence remain usable and the UI does not claim Agent support.

### V12-08 — Reduced motion and missing asset

**Given:** A required asset or animation is absent and reduced-motion is enabled.  
**When:** The page renders the state.  
**Then:** A deterministic placeholder/text state preserves causal meaning without blocking the trace.

## Shared assertions

- The owning server/worker authority remains the only state-changing authority.
- Revisions, idempotency, world identity, and causal event identity prevent duplicate effects.
- A projection, test stub, screenshot, or delivery envelope cannot replace durable game state.
- Cross-module handoffs use the owning mechanism's state and event boundary; no consumer invents a
  second role, mission, ledger, clock, route, or external delivery path.
- Positive, negative, boundary, retry, restart, browser-absent, and unsupported-capability outcomes
  remain distinguishable in evidence.
- A run repeated with the same fixture, seed, event order, and command versions produces the same
  authoritative result, unless an explicitly open production policy is being measured.

## Open implementation fields

- camera and interpolation correction policy;
- final asset atlas format;
- text equivalent detail and focus order;
- reduced-motion presentation;
- snapshot size and draw budget;
- production cadence, prediction, and interpolation correction policy;

These fields may be filled only inside the checkpoint authority, with rationale and verification.
A value that changes an accepted contract, human consequence, external handoff, or settlement boundary
requires an explicit decision before implementation.

## Non-goals

This fixture records the CP-12 presentation and local-session boundary. The named browser evidence
proves only one local browser context; it does not prove a two-browser slice, hosted continuity,
production identity, WebMCP, Re-entry, or judge reproduction, and it does not authorize code outside
its checkpoint.
