# CLOUD-024: Connector Browser Capability Preflight

**Role:** DEVELOPMENT verification record  
**Status:** Fresh-process Browser capability `locally_verified`; authenticated Game route blocked  
**Date:** 2026-09-03  
**Task:** [TASK-034](../Tasks/TASK-034-verify-connector-browser-webmcp-route.md)

## Scope and falsifier

The user approved a bounded read-only Connector-to-Browser feasibility probe and preparation of
an until-revoked lifetime proposal. These are not permission to implement unaccepted public
controls, extend existing Grants, deploy, publish, change Game state, or select an alternate
production adapter. Parent baseline is `01c7c415d54358829d8abef252e074d0e9884186` on `main`;
unrelated Game/RightSpot work is preserved. Receiver source remains `9156e68...` with evidence-only
follow-up `8b8d08b...` on `Re-Entry`.

The falsifiable first question is whether the existing fresh CLI process seam can obtain a
supported Browser binding without another task's private Browser locator or credentials.
Current desktop Browser availability is a separate control, not the answer.

The Game owner must supply a safe canonical URL, navigation-side-effect boundary, disposable
player/session identity, and approved read-only Site Tool before any Game page interaction.

## Initial observations

- Local CLI version: `codex-cli 0.144.1`.
- `codex-exec-adapter.mjs` invokes `codex exec --cd <host-directory> <prompt>` with inherited
  environment and no explicit Browser attachment. Real activation discards child output and
  interprets exit success only as process dispatch acceptance.
- The exported `runCodexPrompt` is explicitly a manual smoke seam with no Receiver authority.
- This desktop session successfully acquired its default in-app Browser; its tab list was empty.
- No Game page has been navigated, no player created, and no Site Tool invoked by this increment.

## Fresh-child result

The existing `runCodexPrompt` seam was executed once through Node `v24.20.0` from the Game project
working directory. Discovery selected the installed `codex-cli 0.144.1`; no executable, model,
reasoning, sandbox, approval or authentication settings were overridden. The child inherited the
existing local configuration. The helper used its normal `exec --cd <directory> <prompt>` argv.

Observation-only differences from a real activation: a capability-only prompt, captured stdout
and stderr instead of discarded output, and a 180-second smoke timeout instead of the activation
adapter's 60-second maximum. Completion took 59,092 ms including startup/instruction work. This
is not a performance benchmark or proof that navigation/tool work fits the production timeout.
No Grant, Event, lease, Receiver claim, acknowledgement, or production activation was supplied.

The exact child tool transcript independently confirms:

1. The Browser skill was read and the current `node_repl js` tool was discovered.
2. The documented supported runtime was initialized through that tool, not a shell substitute.
3. Default selection returned Browser documentation naming **Chrome**, type **extension**.
4. A separate `(await browser.tabs.list()).length` call returned **0**.
5. No navigation or Site Tool invocation occurred. The child exited successfully.

The child's final summary agreed with these tool outputs, but is not the sole evidence. A parent
readback inspected only this child's recorded tool calls/results. Raw private process logs and
the observation driver remain local, outside Git. No raw session locator is copied into this record.
Startup emitted model-cache/plugin warnings and unrelated connector OAuth warnings; none prevented
the measured Browser selection. Those warnings are not repaired or treated as Game failures here.

The unchanged adapter SHA-256 is
`da643073360e81f935e3cc7cb3a31dac6a5377a7b663ad770c052dcb5abd05db`; the retained observation
driver SHA-256 is `6a3c84f451a5b389a3a567fb42ce2f970fe33c563cbb9b50496703e19539d41c`.
The driver and private captured log remain in the task-created temporary directory; nothing was
deleted or installed. Captured process output is not a shareable public artifact.

| Claim | Evidence | Disposition |
| --- | --- | --- |
| Parent desktop Browser | Default in-app Browser and empty tab list | Separate control only |
| Fresh CLI Browser capability | Actual Chrome-extension documentation and count-zero tool result | Locally verified for this executable/configuration |
| Fresh CLI in-app Browser | Not explicitly selected or tested | Unverified; no universal unavailability claim |
| Existing Game player/session reachable by child | No handoff evidence; Game owner confirms gap | Blocked |
| Genuine Game WebMCP read | Not invoked | Unverified |
| Real Connector delivery, Game effect and ACK | Not exercised | Unverified |

## Game-owner handoff and stop condition

The Game owner identifies [the canonical hosted page](https://game.sleepless-kingdom.com/) and
`inspect_shelter_state` as the intended read-only Site Tool. Top-level navigation and bootstrap
are admission reads, not gameplay commands, but normal page load opens realtime connectivity and
the server world clock continues. This is owner-provided scope, not a new hosted verification run.

Existing authenticated desktop contexts are not known to be reachable from the fresh child.
The owner explicitly requires a session-preserving handoff before this probe navigates. With
zero child-visible tabs and no approved handoff, the probe stops before page access. Do not create
a new player, copy cookies, inspect storage, use a different task's private Browser locator, or
substitute DOM/REST for WebMCP. The owner's separate Chrome/IAB limitations are not promoted into
an independently measured universal capability verdict.

TASK-034 remains blocked on that handoff. A future route-specific probe must independently show
the correct admitted player and a current tool handle, invoke only the approved read, and preserve
the Game human boundary. An alternate adapter or admission design needs an accepted decision.

## Reproduction and evidence limits

Use the existing exported `runCodexPrompt` manual-smoke helper, the intended Host working directory,
and the currently discovered executable. Prompt only for Browser skill/tool discovery, supported
default bootstrap, full documentation, and tab count. Prohibit navigation, file changes, services,
Git writes, page tools, credential/storage reads, delegation and fallbacks. Record actual calls,
not just the final model summary. The retained local driver contains the exact prompt and command.
Repeat only when the executable, inherited environment, Browser/session handoff or target contract
changes; unchanged repeated probes do not establish access.

ADR-0026 and Mechanisms 04/05 remain aligned: successful process exit is not page, effect or ACK
proof, and no production adapter is selected. Core/00 and Core/05 receive only bounded evidence
updates. TASK-007 stays closed. TASK-027 and Research 25 separately own the lifetime proposal;
current finite v0.2 and all executable code remain unchanged.

## Local verification

- One real manual child-process capability probe completed, with selected-browser and tab-count
  tool outputs inspected independently of the final summary.
- Observation driver syntax passed on Node 24.
- Governance validator unit tests passed 6/6; sensitive-scanner unit tests passed 3/3.
- All nine task-owned candidate documents passed scoped Markdown/link, English and sensitive
  checks with zero findings; direct CJK scan found no matches and whitespace checks passed.
- No application aggregate was rerun: no executable, schema, package or dependency changed, so
  the prior Receiver/Core results are retained with their original bounded claims, not new results.
- Full staged repository validation passed after correcting the new Task's required section
  headings; no validator was weakened. The full sensitive scan still reports the 21 existing
  Game artifact-name matches outside this increment; no whole-repository security pass is claimed.
- Independent proposal review found no remaining blocking finding after distinguishing ordinary
  offline tolerance from missing bound-Connector revocation/expiry checks.
- Local Git closure uses the separately approved exact nine-document window. No push, publication,
  deployment, production migration or full-chain success is claimed.
