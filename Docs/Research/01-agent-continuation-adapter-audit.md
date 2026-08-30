# Agent Continuation Adapter Audit

**Role:** SUPPORTING runtime research  
**Status:** Controlled P0 capability continuity passed; production bridge unresolved  
**Last updated:** 2026-08-30  
**Controls:** [P0 Technical Validation MVP](../Core/07-p0-technical-validation-mvp.md)

## 1. Question

Can a later authenticated business event resume the exact Codex context and make an
eligible Browser plus genuine page-provided WebMCP Site Tools available to the resumed
turn?

This audit separates two requirements that prior concept material sometimes treated as
one:

1. **Instruction continuity:** the resumed Agent knows why it returned, which canonical
   page to open, which first action to take, and where to stop.
2. **Capability continuity:** the resumed runtime actually exposes an eligible Browser and
   can discover and invoke the current page's genuine Site Tools.

A context-carried continuation receipt is a credible mechanism for the first requirement.
It is not evidence for the second requirement.

## 2. Evidence classification

### Verified from current official OpenAI documentation

- Codex App Server exposes stored-thread continuation through `thread/resume` and new work
  through `turn/start`.
- App Server documents persisted history primitives including `thread/inject_items`.
- Workspace Agent triggers expose durable runs, an idempotency key, and a stable
  `conversation_key`.
- Site Tools are discovered from the live top-level page in the built-in Browser.
- Closing or navigating away from a page can make that page's Site Tools unavailable.
- The built-in Browser is a Desktop capability rather than a Codex CLI or IDE-extension
  capability.

### Verified from the current local installation

- Installed probe runtime: `codex-cli 0.144.1`, Node.js `v26.5.0`, and the running ChatGPT
  Desktop application.
- The generated App Server schemas for the tested and newer installed runtimes contain
  `thread/resume`, `turn/start`, and persisted-context primitives, but no Browser navigation,
  Browser attachment, Site Tool, or WebMCP method. In the newer bundled
  `0.151.0-alpha.7.1` schema, `BrowserUseRequirements` and `InAppBrowserRequirements` are
  configuration requirements rather than runtime Browser operations.
- Codex Desktop's supported task-control surface includes `send_message_to_thread`. Its
  local implementation resolves the target thread, resumes it when necessary, and starts
  a follow-up turn.
- The Desktop Browser implementation stores page state against a `conversationId` and
  `browserTabId`, persists a `browserStorageId`, and has a hidden Browser host capable of
  bootstrapping a conversation-bound tab while Browser Use is active.
- The Desktop Browser transport implements native `webmcp_list_tools` and
  `webmcp_invoke_tool` operations tied to a Browser and tab.
- On Desktop thread resume, the client deliberately resumes the App Server thread without
  rebuilding dynamic tools. This is consistent with the documented restoration of thread
  dynamic tools, but it does not itself prove that a released page's Site Tools reappear.

The Desktop implementation details above are local diagnostic evidence, not a public
integration contract. The MVP must not depend on undocumented internal IPC or bundle
symbols as its final adapter.

## 3. Candidate routes

| Route | Exact-context wake | Browser and Site Tools | Current verdict |
|---|---|---|---|
| Desktop-owned task plus `send_message_to_thread` | Available inside the Desktop app task-control surface | Browser state is conversation-bound; the private current-build bridge completed genuine Stage-B re-entry | Controlled P0 pass; unsupported as a production bridge |
| Standalone Codex App Server | Documented `thread/resume` plus `turn/start` | No Browser or WebMCP method in the current schema | Use to isolate Q3; cannot yet pass Q4 |
| Workspace Agent trigger | Durable trigger and stable conversation key are documented | No verified built-in Browser/Site Tool continuation contract | Credible remote trigger candidate; Q4 unknown |
| Custom browser or generic automation | Technically controllable | Fails the claim if it substitutes DOM automation, REST, MCP, or synthetic dynamic tools for Site Tools | Rejected as proof substitution |

No documented public external API found in the current official or local surfaces targets an
exact existing Codex Desktop task and restores that task's built-in Browser plus page-bound
Site Tools. App Server and the Codex SDK cover exact context continuation; Desktop task
control covers the Browser-hosted half but is available as an in-app Agent surface rather
than an external Receiver contract. Workspace Agent triggers continue their own published
Agent conversations and do not document Desktop thread or live-page attachment.

## 4. Context-carried continuation hypothesis

The website may offer a typed continuation intent through a WebMCP Site Tool. After
Receiver validation and user consent, the Receiver can persist a trusted continuation
receipt into the same managed context. A later accepted event can then use a fixed wake
input that tells the Agent to follow the already-authorized receipt.

This is suitable with four constraints:

1. The website supplies an untrusted offer, not an executable prompt or Grant.
2. Only the Receiver converts the offer into a trusted receipt after validation and
   consent.
3. The event contains typed state identifiers and no arbitrary Agent instruction.
4. The Agent re-reads current business state from the canonical page after re-entry.

The hypothesis passes only if the resumed runtime can then open the canonical page and
invoke a Stage-B-only Site Tool. Conversation memory alone cannot satisfy that test. The
clean 2026-08-30 run satisfied both instruction and capability continuity in the controlled
current-build environment.

## 5. Adapter decision gate

Do not select an adapter from architecture diagrams or API availability alone. Run these
tests in order:

1. Register a genuine Site Tool on a controlled top-level local page and invoke it from the
   current Desktop task.
2. Persist a validated continuation receipt in the same task and release or close the page.
3. Start a later turn in the exact task through the supported Desktop task-control surface.
4. Require that turn to open the canonical URL, re-read state, discover a Stage-B-only Site
   Tool, and invoke it.
5. Independently prove that a signed event can drive exact App Server resume and turn start.
6. Attempt to join the event Receiver to the Desktop task-control surface without private
   IPC. If no supported join exists, test the Workspace Agent trigger route against the
   same Browser requirement.

## 6. Passing and failing interpretations

### Pass

The exact prior task resumes, retains the validated receipt, obtains Browser capability,
opens the bound page, and invokes the current genuine Site Tool without a human rebuilding
the Stage-B instruction.

### Partial result

The exact task resumes and knows the plan, but Browser or Site Tools are absent. This proves
instruction continuity and Q3 only; it is not a closed-loop WebMCP proof.

### Fail for the strongest concept claim

All credible supported adapter routes require a human to reopen or reattach the page, or
require the Receiver to replace Site Tools with REST, DOM automation, MCP, or custom
dynamic tools.

## 7. Immediate implementation consequence

The P0 fixture created controlled conditions rather than assuming platform behavior. It
provides:

- a deterministic two-stage top-level WebMCP page;
- a signed event producer and Receiver;
- private context binding and a context-carried continuation receipt;
- separate Desktop and App Server adapter probes;
- evidence that labels each result as instruction continuity, capability continuity, or
  both.

## 8. Runtime update

The context-carried continuation hypothesis has now passed through the supported App Server
path. A fresh App Server process resumed the exact thread and recalled both an unstated
Stage-A marker and an unstated Grant ID from the injected validated receipt. A signed
Receiver event also drove the same exact-context resume once, while duplicate delivery
started no second run.

Capability availability and continuity now pass in the newer ChatGPT Desktop client for the
controlled P0. OpenAI's official control page exposed genuine Site Tools; the clean local
Stage-A page returned its signed Re-entry Manifest; one authenticated event appeared in the
same bound task; and the event-opened canonical page genuinely discovered and invoked the
Stage-B Site Tool. The same artifact advanced to revision 2 and remained uncommitted.

The App Server path still exposes no Browser or Site Tool operation. The successful Desktop
join uses an undocumented same-user local relay, so a supported external production join
remains unproven even though conceptual and current-runtime composability now pass. Changing
a fixture verdict flag or substituting DOM, REST, dynamic tools, or generic MCP would still
not count.

See [P0 Runtime Probe Log](02-p0-runtime-probe-log.md) and the
[clean-run verdict](../../mvp/evidence/p0-correlated-clean-run-2026-08-30-verdict.md).
See [Site Tools Runtime Availability Audit](03-site-tools-runtime-availability-audit.md) for
the completed client prerequisite gate and positive Stage-A control.
