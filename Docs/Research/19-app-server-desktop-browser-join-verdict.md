# App Server to Desktop Browser/WebMCP Join Verdict

**Role:** SUPPORTING empirical platform-boundary verdict  
**Status:** Complete for the two tested current-build standalone App Server topologies  
**Evidence date:** 2026-08-30  
**Decision authority:** Core/00 and ADR-0004 remain controlling

## 1. Question

Can a Receiver use the documented Codex App Server continuation primitives to resume an
exact managed context and then regain the ChatGPT Desktop built-in Browser plus genuine
page-bound WebMCP Site Tools, without the private P0 relay, Scheduled Tasks, REST, DOM
automation, Chrome, generic MCP, or another substitute surface?

The test deliberately separates two topologies:

1. **Cold App Server ownership:** App Server creates and later resumes its own thread.
2. **Warm controlled input:** the controller supplies the exact task identifier from a
   Desktop-priming step, and a standalone App Server attempts to resume that exact task.

These are different platform joins and must not be combined into one ambiguous result.

## 2. Official contract boundary

The official [Codex App Server documentation](https://learn.chatgpt.com/docs/app-server)
documents exact `thread/resume`, later `turn/start`, item injection, skills, and MCP tool-call
items. It does not document a Browser or WebMCP endpoint on App Server.

The official [Site Tools documentation](https://learn.chatgpt.com/docs/webmcp) places Site
Tools in ChatGPT Desktop's built-in Browser. Tools are bound to the current page and must be
rediscovered after navigation or document replacement.

The missing join between those two documented surfaces was therefore an empirical question,
not a supported-platform assumption.

## 3. Control-page preflight

Before testing App Server, the current root Desktop task opened the official WebMCP
documentation page through the built-in Browser, fetched its current page-bound tool
inventory, and successfully invoked the genuine read-only `lookup_context` Site Tool. The
result returned `ok: true` and the current documentation path.

This control proves that the account, current ChatGPT Desktop build, selected model, Browser,
page, and official Site Tool were available in the same environment. It does not prove they
were available to another App Server-owned session.

## 4. Cold-join probe

### Method

- use ChatGPT Desktop's bundled `codex` binary, version `0.151.0-alpha.7.1`;
- create one App-Server-owned thread and complete one marker-only Stage-A turn;
- inject one bounded continuation receipt containing the official control-page URL;
- close the first App Server process;
- start a fresh App Server process and resume the exact thread;
- send a later trigger that contains no canonical URL, workflow ID, or Grant ID;
- require the Browser skill, exact `agent.browsers.get("iab")`, current WebMCP discovery,
  exactly one read-only `lookup_context` call, and no fallback surface.

### Result

Exact thread resume and Stage-A marker persistence passed. The later turn reported receipt
recovery and reproduced the unstated canonical URL, but the injected receipt is not exposed by
the pre-turn `thread/read`; treat that part as corroborating Agent output rather than an
independently inspectable receipt assertion. The required built-in Browser selection failed with:

```text
Browser is not available: iab
```

No Chrome, extension, REST, DOM, Computer Use, dynamic-tool, generic MCP, or manual fallback
counted. The cold join therefore failed before WebMCP discovery.

Evidence:
[cold join JSON](../../mvp/evidence/app-server-browser-join-probe-2026-08-30.json)

## 5. Warm-join probe

### Method

- fork one disposable task and, as a controller-side precondition, prime it in Desktop with the
  official control page and one genuine read-only `lookup_context` Site Tool call;
- supply that exact task identifier and a private marker to the standalone probe;
- use the same bundled standalone App Server to call `thread/resume` for that exact task;
- require reuse of the existing `iab` tab and forbid new tabs, navigation, browser fallback,
  substitute tools, mutation, or task archival.

### Result

The standalone App Server failed at `thread/resume` before it could start a later turn:

```text
thread already has an active writer
```

The controller did not detach a writer, close the app, or substitute a new App-Server-owned task
because any of those changes would test a different topology. It archived the disposable task
afterward through the normal recoverable task archive operation.

The public JSON directly proves only that exact `thread/resume` returned the active-writer error
for the supplied task. Because the rejection occurs before `thread/read`, that artifact does not
independently prove writer ownership, idle status, the marker, or the live Browser precondition.
Those facts remain controller-side setup attestations and are not promoted into self-contained
public evidence.

Evidence:
[warm join JSON](../../mvp/evidence/app-server-browser-warm-join-probe-2026-08-30.json)

## 6. Combined verdict

| Topology | Exact context | Desktop `iab` join | Verdict |
|---|---:|---:|---|
| App-Server-owned cold thread | Passed | Failed: `iab-unavailable` | **FAILED** |
| Exact task supplied by controlled Desktop priming | Active-writer rejection before `thread/read` | Not reached | **FAILED FOR THE SUPPLIED INPUT** |

Neither tested standalone App Server Desktop join succeeded on the current build:

```text
App Server owns the thread
-> exact resume works
-> Browser selector returns iab-unavailable before page access
-> absent Browser or session precondition is not identified

Controller supplies the exact task from Desktop priming
-> standalone App Server receives active-writer rejection
-> Browser join is not reached
```

This is sufficient to remove both tested standalone Desktop joins from current selection unless a
materially different supported contract or topology appears. It is not a self-contained proof of
the warm writer's owner or preconditions, and it is not a claim that App Server cannot operate
App-Server-owned agents, that a future supported platform join cannot exist, or that a hosted
Agent runtime cannot expose a separate browser surface.

## 7. Architecture consequence

1. Preserve App Server as verified Q3 evidence for exact context resume from the independent Q3
   probe; treat this cold probe's receipt report as corroborating rather than independently
   inspectable.
2. Do not select standalone App Server as the current Desktop Browser/WebMCP wake adapter.
3. Do not weaken the WebMCP requirement by counting App Server dynamic tools, generic MCP,
   REST, DOM automation, Chrome, or manual reconstruction.
4. Keep the Receiver responsible for authenticated durable pending work, not for claiming a
   direct Desktop wake that the platform does not provide.
5. Keep Scheduled pull as a bounded current-build compatibility adapter only. It is not a
   core mechanism dependency or production contract.
6. Evaluate Workspace Agents only as a distinct hosted runtime topology. It must independently
   prove external trigger, stable context, eligible browser, and genuine page-bound WebMCP.

## 8. Remaining unknowns

- whether a published Workspace Agent can expose genuine page-bound WebMCP Site Tools;
- whether a future supported local connector or platform-owned wake API can bridge to a
  Desktop task without writer conflict;
- whether the selected app can justify a bounded Scheduled-pull watch window;
- whether the selected deployment should preserve exact Desktop task history at all, or use
  a hosted context plus a bounded continuation capsule;
- portability across accounts, workspaces, machines, client builds, and judge environments.

## 9. Reproduction

From `mvp/`:

```bash
npm run probe:app-server-browser-join
```

For the warm probe, first prime an idle disposable Desktop task with the official control
page and one genuine `lookup_context` call, then provide its private task ID and marker only
through environment variables:

```bash
WEBMCP_DESKTOP_THREAD_ID='<private-id>' \
WEBMCP_DESKTOP_CONTEXT_MARKER='<private-marker>' \
npm run probe:app-server-browser-warm-join
```

Both commands intentionally exit non-zero for the recorded failed verdicts. Public evidence
hashes the task, session when exposed, and marker; it does not publish the raw task ID.
