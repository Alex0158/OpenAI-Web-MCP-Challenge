# P0 Controlled Desktop Reproduction Runbook

This runbook reproduces the frozen Q1–Q5 technical-feasibility flow. It is intentionally
specific to a same-user local ChatGPT Desktop runtime and the disposable domain-neutral
fixture. It is not a production deployment guide.

## 1. Preconditions

- ChatGPT Desktop `26.825.41651` (build `7345`) or a later compatible build.
- A task and model eligible for Site Tools. Verify the effective capability on OpenAI's
  official Site Tools page before testing the fixture.
- `Settings > Browser > Permissions > Enable site tools` enabled when that setting is
  available.
- Node.js 24 or newer.
- The Desktop task environment supplies `CODEX_SESSION_ID`, `CODEX_APP_TOOLS_PIPE_PATH`, and
  an executable `CODEX_MCP_NODE_PATH`. Do not print, persist, or copy these values into
  project evidence.
- The canonical URL is `http://127.0.0.1:4317/workflows/WF-001`.

Stop if the official control or the local page does not expose genuine `webmcp`. Do not
replace it with REST, DOM automation, generic MCP, or a headless browser.

Verify only the presence of the private Desktop variables without printing their values:

```sh
node -e 'for (const name of ["CODEX_SESSION_ID", "CODEX_APP_TOOLS_PIPE_PATH", "CODEX_MCP_NODE_PATH"]) { if (!process.env[name]) throw new Error(`${name} is unavailable`); } console.log("Desktop task runtime variables are present")'
```

If any variable is absent, this current-build bridge is unavailable in that task. Stop; do
not search for, glob, or copy another task's native pipe.

## 2. Private relay and Receiver

Provision a new private temporary directory with mode `0700`, a fresh Unix socket path, a
fresh relay bearer of at least 32 characters stored in a `0600` file, and a separate fresh
Receiver-client bearer. Never place either bearer in the repository, terminal transcript,
evidence, or task message.

From the bound Desktop task context, set these process variables without printing their
values:

```text
WEBMCP_P0_DESKTOP_RELAY_SOCKET
WEBMCP_P0_DESKTOP_RELAY_TOKEN
WEBMCP_P0_DESKTOP_RELAY_CANONICAL_URL=http://127.0.0.1:4317/workflows/WF-001
```

Start the narrow relay:

```sh
./scripts/launch-codex-app-tools-relay
```

The ready record must report the fixed canonical URL and socket mode `0600`. The relay must
remain in the accepted task-launched process context; a detached process that merely copies
the native pipe is not an accepted substitute.

In a second local process, set the same relay socket and bearer plus:

```text
WEBMCP_P0_ADAPTER=desktop-task
WEBMCP_P0_RECEIVER_CLIENT_TOKEN=<separate fresh bearer>
```

Then reset while the fixture is stopped and start it:

```sh
npm run reset
npm start
```

Confirm `/health` identifies `codex-desktop-task-adapter` and trusted context capture as
configured without recording any secret or raw task identifier.

## 3. Clean correlated sequence

Use the built-in Browser and genuine page-bound Site Tools for all page reads and writes.
The Agent should record structured results in a redacted evidence draft as it proceeds.

1. Open the canonical page and fetch the Site Tool inventory. It must contain exactly
   `get_workflow_context`, `prepare_artifact`, `get_reentry_offer`, and
   `register_reentry_binding`.
2. Call `get_workflow_context`. Require `INITIAL`, state version 1, artifact revision 0,
   `committed=false`, and no host binding.
3. Call `prepare_artifact` with expected revision 0 and a recognizable Stage-A marker.
4. Call `get_reentry_offer`. Preserve the returned signed Manifest in managed task context;
   do not replace this call with the REST offer route.
5. Write the exact JSON object returned by `get_reentry_offer` to a private temporary file
   outside the repository, without changing key values. Through the authenticated Receiver
   client, ask the adapter to capture the current task and submit that exact Manifest:

   ```sh
   npm run enroll:genuine -- /absolute/private/path/reentry-manifest.json
   ```

   The caller supplies no task identifier. The command must report
   `enrolled_from_supplied_manifest=true`, the same Manifest and correlation IDs,
   `managed_context_id_exposed=false`, and a Receiver consent URL. It must not print the
   one-time capture handle or raw task identity.
6. Open the Receiver-owned consent URL. Confirm workflow, origin, exact event type, one-run
   limit, expiry, and human boundary. The user must explicitly authorize approval. Approval
   must return to this same task as an enrollment receipt containing only the opaque Agent
   binding for page registration.
7. Call the genuine Stage-A `register_reentry_binding` Site Tool with that exact opaque
   value, then stop. Do not infer or simulate the future event.
8. Confirm the Receiver has one approved challenge, one active Grant, one persisted receipt,
   one host binding, zero events, and zero runs. Public evidence must contain no raw task ID,
   opaque binding value, or bearer.
9. End the Stage-A turn. Run `npm run trigger` once. This performs the deterministic
   `READY` transition and delivers one authenticated `WORKFLOW_READY` event.
10. The event must appear in the same bound Desktop task. Follow its validated receipt,
    claim only the newly opened canonical Browser tab, and fetch its genuine Site Tools.
11. Require exactly `get_workflow_context` and `continue_artifact`. Stage-A tools and any
    commit tool must be absent.
12. Call `get_workflow_context`. Require `READY`, state version 2, artifact revision 1, the
    exact Stage-A content, and `committed=false`.
13. Call `continue_artifact` with expected state version 2 and expected revision 1. Continue
    the complete prior artifact instead of starting a replacement.
14. Read state again. Require artifact revision 2, the Stage-A marker plus Stage-B content,
    `committed=false`, and `COMMIT_ARTIFACT` with `agent_callable=false`.
15. Capture the visible page showing `READY`, revision 2, the two Stage-B Site Tools, the
    continued artifact, and the human Commit control. Do not click Commit.
16. Run `npm run replay`. Require `duplicate=true`, the original run ID, one database event,
    one run, artifact revision 2, and no second task continuation.
17. Run `npm test` and require the entire current suite to pass. Record the exact total in
    the evidence package instead of hardcoding a historical count.

## 4. Required evidence and redaction

Freeze one correlation into:

- environment and client snapshot;
- exact Stage-A and Stage-B inventories and genuine call results;
- Receiver consent, Grant, and binding verdict;
- downstream Browser verifier record;
- final database counts and bounded delivery verdict;
- redacted correlated trace;
- test report;
- usable human-boundary screenshot; and
- concise Q1–Q5 verdict.

Never record the raw Desktop task ID, the full opaque binding, relay or Receiver bearers,
native pipe path, or secret-bearing process environment. Dispatch-time adapter fields cannot
observe the downstream Browser; keep them conservative and use the resumed task's separate
Browser verifier record for Q4 and Q5.

## 5. Pass and stop conditions

Pass only if all five questions occur under one correlation and exact replay produces no
second run or write. Preserve failures as separate diagnostic runs; never merge their trace
with the clean acceptance trace.

Stop if the event reaches another task, the canonical URL differs, `webmcp` is absent, fresh
state does not match, the tool inventory is wrong, the artifact revision conflicts, or the
Agent is offered a commit tool. Do not add fallback behavior to force a pass.

The resulting verdict is limited to current-build local technical composability. A separate
gate must select and prove a supported production bridge, public deployment, and clean-room
judge flow.
