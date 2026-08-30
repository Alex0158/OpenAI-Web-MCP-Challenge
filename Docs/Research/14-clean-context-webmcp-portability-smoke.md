# Clean-Context WebMCP Context-Isolation and Portability-Ladder Smoke

**Role:** SUPPORTING platform evidence and reproducibility ladder  
**Status:** C1 verified once per target in the current installed environment from app-held
source traces; the repo package is not a self-contained public audit artifact, and independent
account, workspace, machine, public deployment, and end-to-end judge reproduction remain untested  
**Observed:** 2026-08-30  
**Scope:** Whether genuine page-bound Site Tool discovery requires prior project conversation
turns, project-file access, an old tab, or a previously held tool handle

## Executive judgment

Two fresh internal Agent contexts, each created without prior conversation turns and
forbidden from reading project files, separately discovered and invoked genuine page-bound
Site Tools through the Codex in-app Browser:

1. the official `https://learn.chatgpt.com/docs/webmcp` control page; and
2. the local P0 canonical workflow page at `/workflows/WF-001`.

Both probes opened a fresh tab, fetched the current document's `webmcp` capability, read the
live tool manifest, and invoked exactly one tool whose manifest set `readOnlyHint: true`. The official
control returned `/docs/webmcp`; the P0 page returned authoritative `READY` state, state
version `2`, artifact revision `2`, and an uncommitted human boundary. Neither probe invoked
a mutation, continuation, registration, acknowledgement, or commit-like tool.

The bounded evidence grade is:

> **C1 VERIFIED ONCE PER TARGET — app-held source traces verify clean Agent-context Site Tool
> discovery and one bounded current-state invocation in two same-environment probes.**

The traces are evidence against prior project conversation, a retained tab, an old Site Tool
handle, or project-file access being necessary for these two calls. `readOnlyHint` is an
untrusted manifest annotation, not proof that a tool is safe; the bounded claim is that only
the two reviewed current-state readers were invoked and no mutating Site Tool invocation
appears in either trace. C1 does not prove portability to another account, workspace, machine,
Browser profile, client build, or judge environment, and it does not exercise the
enrollment-to-event-to-continuation loop.

## 1. Question and falsifier

The narrow question was:

> Can an Agent context with no inherited project turns and no project-file access discover
> current genuine Site Tools from a fresh page and invoke one bounded current-state reader?

The probe would fail if any of the following occurred:

- the Codex in-app Browser did not advertise the `webmcp` page capability;
- tool names had to be supplied as a hidden generic integration rather than discovered from
  the current document;
- the Agent required an existing project tab, old tool handle, project file, REST endpoint,
  DOM automation, generic MCP tool, Chrome extension, or Computer Use;
- the discovered origin or page path did not match the opened page;
- no allowlisted current-state tool with `readOnlyHint: true` could be invoked; or
- any mutating Site Tool or human-boundary action was invoked.

## 2. Controlled method

Each separate probe used a newly created internal Agent context with no inherited
conversation turns. Its bounded instruction supplied only the target URL, the read-only
objective, the required in-app Browser surface, explicit forbidden substitutes, and the
redaction boundary. The Agent was instructed not to read project files or prior task
history.

Both probes followed the same sequence:

1. initialize the documented Browser runtime;
2. select the Codex in-app Browser rather than an ordinary Chrome surface;
3. open the target in a fresh tab;
4. discover the current tab capabilities;
5. fetch the page-bound WebMCP manifest;
6. list tool names and `readOnlyHint` values without treating the annotation as trusted proof;
7. invoke exactly one allowlisted current-state reader whose manifest set
   `readOnlyHint: true`; and
8. report only a redacted result without task, Browser, session, opaque binding, or bearer
   identifiers.

No raw runtime identifiers are preserved in the experiment package.

## 3. Observed results

| Probe | Page | Discovered tools | Invoked tool | Returned state | Verdict |
|---|---|---|---|---|---|
| Official control | `https://learn.chatgpt.com/docs/webmcp` | `search_openai_docs`, `lookup_page`, `lookup_context`, `navigate_to_page`, `generate_custom_guide` | `lookup_context` | `ok: true`; current path `/docs/webmcp`; no selected text | VERIFIED ONCE |
| Local P0 Host | `http://127.0.0.1:4317/workflows/WF-001` | `get_workflow_context`, `continue_artifact` | `get_workflow_context` | `READY`; state version `2`; artifact revision `2`; not committed | VERIFIED ONCE |

The official manifest set `readOnlyHint: true` on the first three tools and `false` on the
last two. The local manifest set it to `true` for `get_workflow_context` and `false` for
`continue_artifact`. Only the two allowlisted current-state readers were invoked. These
annotations describe the manifest; they do not independently establish implementation safety.

The tested client remained ChatGPT Desktop `26.825.41651` (build `7345`). During the
controlling diagnostic, the Codex in-app Browser advertised the `webmcp` tab capability,
while the available ordinary Chrome extension surface did not. This is a current-session
observation, not a universal browser-product claim. It makes the built-in Browser an explicit
setup prerequisite for the present proof.

The capability-specific `documentation()` lookup returned unavailable in both separate
probes. The packaged Browser runtime documentation still exposed the governed public call
sequence: acquire `webmcp`, call `fetchTools()`, retain the returned handle for the current
page, and use `call(name, input)` only for a listed tool. This is a reproducibility and
developer-experience friction, not a failure of genuine Site Tool discovery.

### Evidence limitation

The app-held source task records preserve the Browser initialization, fresh-tab navigation,
failed capability-documentation preflight, live manifest fetch, exact Site Tool invocation,
and completion status for each probe. Those records were re-read before this evidence grade
was assigned. The repo package intentionally excludes raw task and runtime identifiers and
does not contain a capture-time prompt hash or machine-checkable redacted trace. It is enough
for the bounded same-environment C1 claim, but it is not a self-contained public audit package.
C2 or any public claim must freeze those fields before execution.

## 4. What this evidence changes

The following narrow dependency hypotheses are weakened by the observations:

- **Prior project conversation turns and project files:** not required for the tested
  discovery-and-read sequence.
- **Old page or tab:** not required; both probes used a fresh tab.
- **Old tool handle:** not required; both fetched a new document-bound handle.
- **Project source access:** not required for discovery or the selected authoritative reads.
- **Tender-specific context:** not required; the official control is domain-neutral and the
  local fixture exposed only current Host state.

The result also exposes one concrete judge-setup dependency: the evaluator must use an
eligible Codex in-app Browser surface with Site Tools enabled. Saying only "open the page in
a browser" is currently insufficient.

## 5. Reproducibility ladder

| Tier | Environment | Required proof | Current state |
|---|---|---|---|
| C0 | Existing controlled project task; fresh tab | Genuine manifest and one safe read | **PASSED previously and reconfirmed** |
| C1 | Fresh internal Agent context; same app, machine, account/workspace environment | Official control and local Host genuine discovery without prior project turns or project-file access | **VERIFIED ONCE PER TARGET** |
| C2 | Fresh user-visible Codex task; same eligible account/workspace | Public instructions alone discover and use the selected app's tools | **UNTESTED** |
| C3 | Different eligible account or workspace | Feature, permission, Browser, and Site Tool setup are reproducible | **UNTESTED** |
| C4 | Clean machine and public deployment | Full enrollment, event gate, re-entry, continuation, replay, and human boundary from public instructions | **UNTESTED; release gate** |

C1 is a verified context-isolation pass only in the same installed environment, not an
account, workspace, machine, public-deployment, or clean-room judge pass. Internal Agent contexts share
the same installed client and environmental capability rollout, and the local probe used a
builder-provided loopback URL. C2–C4 remain necessary to isolate user-visible task setup,
feature eligibility, account/workspace rollout, public deployment, and the entire workflow.

## 6. Remaining unknowns and next decision

This smoke does not change the current product and architecture order. The next major
decision remains app selection with Eddie. When advancing beyond C1, preserve a capture-time,
self-contained redacted evidence package. After one app is selected, the project should:

1. turn C2 into a public-instructions test for that app;
2. compare WebMCP with the strongest authenticated API control;
3. select the transport from real latency, offline, privacy, administration, and cost needs;
4. execute C3 when another eligible account or workspace is available; and
5. execute C4 only after public HTTPS deployment and a resettable selected-app scenario.

Detailed redacted evidence is preserved in the
[experiment package](../../Experiments/webmcp-clean-context-smoke/README.md).

## 7. Nonclaims

This result does not prove a supported unattended Browser SLA, exact-task portability,
Scheduled Task durability, another-account feature availability, Host authentication,
public deployment, product necessity, distributed delivery, or judge reproducibility. It
does not show that Chrome can never expose WebMCP; it records only the capabilities reported
on the tested current surfaces. The repo package is not a self-contained public audit record.
