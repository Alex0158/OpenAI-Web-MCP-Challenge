# CP-13 Site Tools Capability Experiment

**Role:** Executable procedure for the one check that gates CP-13 and CP-14  
**Status:** EXECUTED — PASS; reconciled by the primary session as [`SK-EVID-045`](../Evidence/SK-EVID-045-cp13-site-tools-capability-experiment.md)  
**Date:** 2026-09-03  
**Answers:** Check D6 of [`68-cp13-webmcp-capability-differential-diagnostic.md`](68-cp13-webmcp-capability-differential-diagnostic.md)  
**Procedure owner:** The primary session, in a Desktop task that satisfies section 2  
**Runtime executor:** Supporting GPT-5.6 Sol side session; the primary session owns the evidence interpretation and closure recorded in [`SK-EVID-045`](../Evidence/SK-EVID-045-cp13-site-tools-capability-experiment.md)  
**Registers as:** [`SK-TASK-059`](../Tasks/SK-TASK-059-cp13-site-tools-capability-experiment.md)

## 1. What this experiment decides

`SK-ISSUE-001` has been open since CP-02 because no adapter could enumerate a page-registered tool.
[`SK-EVID-044`](../Evidence/SK-EVID-044-cp13-site-tools-eligibility-research.md) established from
vendor documentation that site tools are ChatGPT's implementation of WebMCP, that they require
**GPT-5.6 Sol or GPT-5.6 Terra**, and that **GPT-5.6 Luna currently has WebMCP disabled**. Both
recorded probes ran on `gpt-5.6-luna`.

This experiment answers one question with a runtime result rather than documentation:

> On an eligible model with site tools enabled, can an Agent discover a tool that a local page has
> registered, and invoke it read-only?

A positive result closes `SK-ISSUE-001` and unblocks CP-13 and CP-14. A negative result is equally
valuable: it means eligibility was not the cause and the investigation reopens with that eliminated.

## 2. Preconditions

Check all five before running anything. If any fails, stop and record which one; do not work around it.

| # | Precondition | How to confirm |
|---|---|---|
| P1 | The active model is **GPT-5.6 Sol** or **GPT-5.6 Terra** | The task's model selector. `gpt-5.6-luna` is documented as having WebMCP disabled and must not be used |
| P2 | ChatGPT Desktop is on its latest version | The app's update state |
| P3 | The page is opened in the Desktop app's **built-in browser** | Not an external browser, not a headless browser |
| P4 | Site tools are enabled at `Settings > Browser > Permissions` | The setting itself |
| P5 | The workspace is **not** Enterprise or Edu | Account type. Site tools are documented as unavailable there |

Record the exact model name and app version. Do not print or copy any private task identifier,
credential, or session value into the evidence record.

## 3. Stage A — adapter isolation, using the CP-02 probe page

Stage A deliberately uses the disposable CP-02 probe page rather than the game. That page is the only
surface in this repository already recorded as having registered a tool successfully, so a failure
here isolates the adapter from the game build.

### A1. Start the probe server

From the application root:

```sh
CP02_PORT=8787 CP02_DATA_FILE=/tmp/sleepless-kingdom-cp13-experiment.sqlite \
  /Users/alex/.nvm/versions/node/v24.13.1/bin/node --no-warnings probe/cp02/server.mjs
```

Expected: one `CP02_READY` line naming host, port, pid, and Node version. `GET /health` returns
`{"ok":true,"service":"cp02-probe",...}`.

### A2. Open the page in the built-in browser

Open `http://127.0.0.1:8787/`.

Expected on the page: `Canvas: rendered`, `Realtime: connected`, a snapshot id, and a WebMCP line.

Record the exact WebMCP line. The three possible values are defined in the page source:

- `WebMCP: supported (cp02_inspect_probe registered)` — the host injected the API and registration
  succeeded;
- `WebMCP: unsupported (visible diagnostic; human UI remains usable)` — `document.modelContext` or
  `registerTool` was absent; or
- `WebMCP: registration error (<reason>)` — the API was present and the call threw.

### A3. Read back the page-side API

In the page context, read `typeof document.modelContext`.

This is a page-side observation only. Under `SK-EVID-044` it is expected to follow from P1 and P4. It
is not on its own positive capability evidence.

### A4. Discovery — the decisive step

Ask the Agent to list the tools available on the current page, using the adapter's own tool-discovery
path.

The page registers exactly one tool:

| Field | Value |
|---|---|
| `name` | `cp02_inspect_probe` |
| `title` | Inspect CP-02 probe |
| `description` | Read the current disposable probe status. |
| `inputSchema` | `{ type: "object", properties: {}, additionalProperties: false }` |
| `annotations` | `{ readOnlyHint: true }` |

Expected on success: the inventory contains `cp02_inspect_probe` with that schema and read-only
annotation. Record the exact returned inventory.

On failure: record the **exact** error text and the exact model name, as
`SK-EVID-001` and `SK-EVID-030` did. That verbatim text is what made the eligibility diagnosis
possible.

### A5. Invocation — one read-only call

If and only if A4 returned the tool, invoke `cp02_inspect_probe` with `{}`.

Expected: a result containing the page's probe state object. The tool's `execute` returns
`{ probe: window.__cp02 }`, which holds the page's own Canvas, realtime, snapshot, and WebMCP
diagnostics. It reads page state and mutates nothing.

### A6. Stop and clean up

Stop the probe server. Remove the temporary database file. No database file may be written into the
repository.

## 4. Stage B — game page injection check, secondary

Run Stage B only after Stage A has a recorded result.

The canonical game page contains **no tool registration code**, because CP-13 is unimplemented.
Stage B therefore cannot test discovery or invocation. It can only observe whether the host injects
the page API on the real application shell, which is the observation `SK-EVID-030` recorded as
`undefined`.

```sh
NODE_ENV=test LOCAL_FIXTURE_MODE=1 HOST=127.0.0.1 PORT=3187 \
  GAME_DB_PATH=/tmp/sleepless-kingdom-cp13-experiment-game.sqlite \
  npx tsx src/server/entrypoint.ts
```

Open `http://127.0.0.1:3187/` in the same built-in browser and read `typeof document.modelContext`.

Expected under a positive Stage A: `object`. If Stage A passes and Stage B still reports `undefined`,
that is a new and separate finding about the application shell, and it should be recorded as such
rather than folded into `SK-ISSUE-001`.

Stop the server and remove the temporary database afterwards.

## 5. How to read the outcome

| Stage A4 | Stage A5 | Meaning | Next action |
|---|---|---|---|
| Tool listed | Invoked, result returned | **`SK-ISSUE-001` is closeable.** Eligibility was the cause | Record fresh `SK-EVID-*`, close `SK-ISSUE-001`, and let CP-13 proceed to its owner-decision gate |
| Tool listed | Invocation fails | Discovery works, execution does not | Record the exact error; keep `SK-ISSUE-001` open and narrowed to invocation |
| Not listed, page said `supported` | not reached | The page registered but the Agent cannot see it | Record verbatim error; this contradicts the eligibility hypothesis and reopens the investigation |
| Not listed, page said `unsupported` | not reached | The host did not inject the API | Recheck P1 and P4 before concluding anything |
| A precondition failed | not reached | The experiment did not run | Record which precondition and stop |

## 6. What to record

Create one `SK-EVID-*` with evidence class `capability` and ladder level 6, whatever the outcome.
Include:

- the exact model name and ChatGPT Desktop version;
- the five precondition results;
- the exact WebMCP status line from the page;
- the `typeof document.modelContext` readback for both stages attempted;
- the exact tool inventory returned, or the exact verbatim error text;
- the invocation result or the reason it was not attempted; and
- the claim boundary, stating what the result does and does not prove.

A negative result must be recorded with the same care as a positive one.

## 7. Prohibitions

These are carried from `SK-ISSUE-001` and the roadmap and are not relaxed by this procedure.

- Do not add a page polyfill, shim, or any code that simulates `document.modelContext`.
- Do not substitute a different browser, a headless browser, DOM automation, REST, or a generic MCP
  server for the adapter's own discovery path.
- Do not treat a page-side registration readback as discovery evidence.
- Do not report a tool as available unless the adapter itself returned it.
- Do not search for, copy, or reuse another task's private runtime values.
- Do not commit, push, or deploy anything as part of this experiment.

## 8. Claim boundary

A positive result proves that one eligible model, in one client version, with site tools enabled,
discovered and invoked one read-only tool on one local static page. It does not prove that the game
page works, that the game's future tools are correctly shaped, that Re-entry delivery works, that any
hosted environment behaves the same way, or that a judge can reproduce it. Those remain CP-13, CP-14,
CP-17, and CP-18.

## 9. Executed result — 2026-09-03

### 9.1 Outcome

**PASS.** On the eligible Sol model, the Codex built-in browser's Site Tools adapter discovered the
page-registered `cp02_inspect_probe` tool and invoked it read-only with `{}`. This is the decisive
positive branch in section 5. It eliminates the previously recorded Luna/model-eligibility blocker
and makes `SK-ISSUE-001` closeable by the primary session.

This run was executed in a supporting side session. Under the Session Runbook, the primary session
must still create the canonical `SK-EVID-*`, reconcile `SK-TASK-059` and `SK-ISSUE-001`, and make the
final closure claim.

### 9.2 Preconditions actually checked

| # | Result | Evidence |
|---|---|---|
| P1 | Pass | Active model confirmed by the owner as GPT-5.6 Sol |
| P2 | Pass | Owner confirmed Codex Desktop was current; installed Codex version read back as `26.803.41515` (build `6321`) |
| P3 | Pass | The selected surface identified itself as `Codex In-app Browser`; no external or headless browser was used |
| P4 | Pass | Owner supplied a current Settings screenshot showing `Enable site tools` switched on |
| P5 | Pass | Owner confirmed a personal Codex account rather than Enterprise or Edu |

Executed runtime: Node `v24.13.1`. Source state at the start of the run: repository `HEAD`
`d0bd1d65f32d2b70ee618558063c26feda69b38a` plus the pre-existing working tree. No source file was
changed to make the capability pass.

### 9.3 Stage A observations

The disposable probe started on `127.0.0.1:8787`, and `/health` returned:

```json
{"ok":true,"service":"cp02-probe","node":"v24.13.1"}
```

The built-in browser rendered the expected page state:

- `Canvas: rendered (pixel 52,211,153,255)`;
- `Realtime: connected`; and
- `WebMCP: supported (cp02_inspect_probe registered)`.

The adapter's own discovery path returned this tool inventory:

```json
[
  {
    "name": "cp02_inspect_probe",
    "title": "Inspect CP-02 probe",
    "description": "Read the current disposable probe status.",
    "inputSchema": {
      "additionalProperties": false,
      "properties": {},
      "type": "object"
    },
    "annotations": {
      "readOnlyHint": true
    },
    "origin": "http://127.0.0.1:8787",
    "pageUrl": "http://127.0.0.1:8787/"
  }
]
```

Calling `cp02_inspect_probe` with `{}` returned the page-owned `probe` object. The returned state
reported Canvas rendered with pixel `[52, 211, 153, 255]`, realtime connected with health `ok`, and
WebMCP status `supported`, `registered: true`, tool name `cp02_inspect_probe`, and no registration
error. No write-capable site tool was exposed or invoked.

### 9.4 Page-context readback discrepancy

The built-in browser's read-only page evaluation returned
`typeof document.modelContext === "undefined"` in both Stage A and Stage B. That result did not match
the page's successful registration readback in Stage A, and it coexisted with genuine adapter
discovery and invocation.

The bounded interpretation is that this evaluation surface does not expose the host-injected object
in the same page world used for registration. Consequently, the `typeof document.modelContext`
readback is not a reliable injection falsifier on this browser-control surface. The adapter-returned
inventory and successful callback execution remain the decisive level-6 evidence. Future runs should
record this readback, but must not use it to overrule an actual adapter discovery result.

### 9.5 Stage B observations

The canonical game page started on `127.0.0.1:3187` and loaded in the same built-in browser. The tab
advertised the `webmcp` capability, but the adapter returned:

```text
No WebMCP tools are available in this document.
```

This matches the known implementation boundary: the canonical game page has not yet registered the
CP-13 tools. Stage B therefore does not weaken the Stage A result and does not claim that the future
game tool contract works.

### 9.6 Shutdown, residue, and source impact

Both local servers were stopped, and ports `8787` and `3187` were free on final readback. The exact
cleanup attempt for the two experiment-created SQLite files was rejected by the machine's global
deletion guard, and the guard was not bypassed. These local `/tmp` files remained after the run:

- `/tmp/sleepless-kingdom-cp13-experiment.sqlite` — 16,384 bytes;
- `/tmp/sleepless-kingdom-cp13-experiment-game.sqlite` — 192,512 bytes.

No database was written into the repository. No game source, dependency, configuration, commit,
push, deployment, or external service was changed by the experiment.

### 9.7 Supported claim and next gate

This result supports one level-6 capability claim: in this exact local Codex Desktop/Sol/Site Tools
session, the Agent discovered and invoked one read-only tool registered by one local disposable page.
It does not prove the canonical game tool registrations, Re-entry delivery, hosted continuity, or
judge reproduction.

Primary-session reconciliation is complete:

1. Canonical capability evidence is recorded in SK-EVID-045.
2. SK-TASK-059 is marked runtime-verified at this bounded scope.
3. SK-ISSUE-001 is resolved with the model-eligibility hypothesis confirmed.
4. CP-13 is returned to its owner-decision and implementation gate; this result is not CP-13
   implementation evidence.
