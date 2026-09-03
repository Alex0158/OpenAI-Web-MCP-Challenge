# SK-EVID-045: CP-13 Site Tools Capability Experiment

## Identity

- Evidence ID: `SK-EVID-045`
- Related task, issue, or decision: [`SK-TASK-059`](../Tasks/SK-TASK-059-cp13-site-tools-capability-experiment.md); [`SK-ISSUE-001`](../Issues/resolved/SK-ISSUE-001-webmcp-agent-adapter-unavailable.md); [`Validation/70`](../Validation/70-cp13-site-tools-capability-experiment.md); [`SK-EVID-044`](SK-EVID-044-cp13-site-tools-eligibility-research.md); [`SK-EVID-030`](SK-EVID-030-cp13-webmcp-capability-probe.md)
- Evidence class: `capability`
- Ladder level: `6` for the named positive discovery and read-only invocation outcome on one local disposable page
- Executor and date: Runtime execution by a supporting GPT-5.6 Sol side session in the Codex Desktop built-in browser, 2026-09-03, Europe/London; interpretation, cross-check, and closure by the primary session on the same date

## Exact identity under test

- Source state: `main`, `HEAD d0bd1d65f32d2b70ee618558063c26feda69b38a` plus the pre-existing working tree; no source file was changed to make the capability pass
- Source and build root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Contract version: `SK-MVP-0.2`; the CP-13 tool contract remains unimplemented and untested by this record
- Runtime versions: Node.js `v24.13.1`; Codex Desktop `26.803.41515` (build `6321`); model GPT-5.6 Sol; Codex In-app Browser
- Fixture world and seed: Stage A used the disposable CP-02 probe page, which is static and carries no world seed; Stage B used the accepted `sleepless-mvp-01` G2 fixture through the explicit non-production local fixture path
- Environment and configuration: Stage A `CP02_PORT=8787`, `CP02_DATA_FILE=/tmp/sleepless-kingdom-cp13-experiment.sqlite`; Stage B `NODE_ENV=test`, `LOCAL_FIXTURE_MODE=1`, `HOST=127.0.0.1`, `PORT=3187`, `GAME_DB_PATH=/tmp/sleepless-kingdom-cp13-experiment-game.sqlite`

## Objective and claim boundary

- Behavior under test: Check D6 of [`Validation/68`](../Validation/68-cp13-webmcp-capability-differential-diagnostic.md), executed through the procedure in [`Validation/70`](../Validation/70-cp13-site-tools-capability-experiment.md) — whether an eligible model with site tools enabled can discover a page-registered tool through the adapter's own discovery path and invoke it read-only.
- Claim this evidence may support: In this exact Codex Desktop, GPT-5.6 Sol, site-tools-enabled session, the adapter enumerated the `cp02_inspect_probe` tool registered by the local disposable CP-02 page with its exact declared schema and read-only annotation, and one read-only invocation with `{}` returned the page-owned state object. The model-eligibility hypothesis recorded in `SK-EVID-044` is confirmed, and the blocking condition recorded in `SK-ISSUE-001` is eliminated.
- Claims this evidence cannot support: Any CP-13 implementation, any tool registered by the canonical game page, the accepted or unaccepted CP-13 page-tool contract, `force_recall_soldier` or any state-changing tool, Agent Signal or Re-entry delivery, two independent browser contexts, default-world bootstrap, production identity, hosted continuity, or judge reproduction. It also does not prove that any other model, client version, account type, or hosted origin behaves the same way.

## Preconditions and fixture

- Starting state: The five preconditions of `Validation/70` section 2 were checked before execution and all passed — P1 GPT-5.6 Sol confirmed by the owner; P2 Codex Desktop current at `26.803.41515` (build `6321`); P3 the surface identified itself as `Codex In-app Browser`, with no external or headless browser used; P4 the owner supplied a current settings screenshot showing `Enable site tools` on; P5 a personal, non-Enterprise and non-Edu account.
- Synthetic identities and seeded actors: Stage A used no game identity. Stage B started the canonical page under the server-derived fixture identity through a fresh task-local database; no gameplay command was issued in either stage.
- Real, fake, and stubbed boundaries: The local probe HTTP server, the canonical game entrypoint, the Codex built-in browser, the host site-tools adapter, and the page's own `document.modelContext.registerTool` call were real. No polyfill, shim, simulated tool list, substitute browser, DOM automation, REST call, or generic MCP server was introduced, and no tool result was stubbed as success.

## Execution

| Replayable command or procedure | Result |
|---|---|
| `CP02_PORT=8787 CP02_DATA_FILE=/tmp/sleepless-kingdom-cp13-experiment.sqlite node --no-warnings probe/cp02/server.mjs` | **Passed**; the probe started on `127.0.0.1:8787` and `/health` returned `{"ok":true,"service":"cp02-probe","node":"v24.13.1"}`. |
| Open `http://127.0.0.1:8787/` in the Codex built-in browser | **Passed**; the page reported `Canvas: rendered (pixel 52,211,153,255)`, `Realtime: connected`, and `WebMCP: supported (cp02_inspect_probe registered)`. |
| Stage A page-side readback: `typeof document.modelContext` | **`undefined`** on the browser-control evaluation surface, contradicting the page's own successful registration readback in the same session. Recorded, not treated as a falsifier; see Analysis. |
| Stage A discovery through the adapter's own tool-listing path | **Passed**; the returned inventory contained exactly `cp02_inspect_probe`, with title `Inspect CP-02 probe`, description `Read the current disposable probe status.`, `inputSchema` `{"type":"object","properties":{},"additionalProperties":false}`, `annotations` `{"readOnlyHint":true}`, `origin` `http://127.0.0.1:8787`, and `pageUrl` `http://127.0.0.1:8787/`. |
| Stage A invocation: call `cp02_inspect_probe` with `{}` | **Passed**; the call returned the page-owned `probe` object reporting Canvas rendered with pixel `[52, 211, 153, 255]`, realtime connected with health `ok`, and WebMCP `supported`, `registered: true`, tool name `cp02_inspect_probe`, no registration error. No write-capable tool was exposed or invoked. |
| `NODE_ENV=test LOCAL_FIXTURE_MODE=1 HOST=127.0.0.1 PORT=3187 GAME_DB_PATH=/tmp/sleepless-kingdom-cp13-experiment-game.sqlite npx tsx src/server/entrypoint.ts`, then open `http://127.0.0.1:3187/` | **Passed as an observation, negative by design**; the tab advertised the `webmcp` capability and the adapter returned `No WebMCP tools are available in this document.` The canonical page registers no tool because CP-13 is unimplemented. Stage B page-side `typeof document.modelContext` also read `undefined`. |
| Shutdown and residue | Both servers were stopped and ports `8787` and `3187` were free on final readback. The two `/tmp` experiment databases were not deleted because the machine's global deletion guard rejected the attempt; the guard was not bypassed. No database file was written into the repository. |

- Output location: Full executed narrative in [`Validation/70`](../Validation/70-cp13-site-tools-capability-experiment.md) section 9.

## Assertions

- **Player-visible state:** Stage A left the disposable probe page rendering its own Canvas, realtime, and WebMCP diagnostics. Stage B left the canonical human projection usable while the adapter reported no page tools, which is the correct visible state for an unimplemented CP-13.
- **Command and failure contract:** Discovery and invocation were performed by the adapter itself and returned typed results. The Stage B negative was an explicit adapter message, not a silent fallback, and no synthetic tool name, callback, or success path was reported.
- **Persistence, event, and outbox state:** Both stages were read-only. No gameplay command, Domain Event, coin change, cargo change, snapshot mutation, or outbox row was produced.
- **Exactly-once settlement after duplicate delivery and replay:** Not applicable to this read-only capability experiment; no command or delivery was attempted.
- **Ownership denial, stale revision, restart, and reconnect:** Not exercised. The invoked tool is read-only and page-scoped, and no ownership or authorization path was opened.

## Analysis and closure

- Failure classification: `environment` for the previously recorded negative results — the blocking condition was model eligibility, exactly as `SK-EVID-044` inferred, and not a defect in the page registration implementation.
- Primary-session cross-check: The reported inventory matches the page's registration call in `probe/cp02/public/index.html` lines 77 to 86 field for field, including the read-only annotation and the empty closed input schema. The named source commit exists in this repository, and the two residual `/tmp` databases exist at exactly the reported sizes of `16,384` and `192,512` bytes. The primary session did not re-execute the adapter run and does not claim independent reproduction of the discovery result.
- Limitations and residual risk: This is one page, one tool, one client version, one model, one local origin, and one session, executed by a supporting session rather than reproduced independently. The `typeof document.modelContext === "undefined"` readback observed in both stages did not match the page's own successful registration, which means the browser-control evaluation surface does not observe the host-injected object in the page world used for registration. That readback must therefore not be used as an injection falsifier, and the analogous observation in `SK-EVID-030` is weaker than it appeared at the time; `SK-EVID-030` remains valid on its decisive point, which was the verbatim adapter error. The two `/tmp` databases remain on the machine and are safe to delete manually.
- Invalidation triggers: A change to the model, the Codex Desktop version, the site-tools setting, the account type, the probe page registration contract, the canonical origin, Node or the runtime versions, or the `SK-MVP-*` contract version invalidates this record.
- Exact conclusion: **`SK-TASK-059` is runtime-verified at ladder level 6 for the named positive outcome, and `SK-ISSUE-001` is resolved with the model-eligibility hypothesis confirmed. Page-bound WebMCP discovery and read-only invocation are reachable on an eligible model. CP-13 remains unimplemented and still requires owner acceptance of its page-tool contract package before any implementation task is admitted; this record is capability evidence only and is never CP-13 implementation evidence.**
