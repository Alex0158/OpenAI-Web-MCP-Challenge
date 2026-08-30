# Site Tools Runtime Availability Audit

**Role:** SUPPORTING client and platform evidence  
**Status:** Newer-client prerequisite plus genuine Stage-A and Stage-B P0 passed  
**Last updated:** 2026-08-30  
**Controls:** [P0 Technical Validation MVP](../Core/07-p0-technical-validation-mvp.md)

## 1. Decision

The older-client WebMCP failures were environment-specific negative controls, not evidence
that the P0 concept was technically impossible. After a clean handoff to the newer ChatGPT
Desktop client, OpenAI's official control page and the local Stage-A page both exposed the
genuine `webmcp` Browser capability.

Q1 and Q4 now pass in one controlled run. The exact event-driven task regained the Browser,
loaded Stage B, and invoked the new-stage Site Tool through the private current-build bridge.
A documented external production join remains unproven.

## 2. Supported availability contract

Current [official OpenAI Site Tools documentation](https://learn.chatgpt.com/docs/webmcp)
establishes the following prerequisites and boundaries:

- Site Tools run in the built-in Browser in the ChatGPT desktop app.
- GPT-5.6 Sol and GPT-5.6 Terra support Site Tools; GPT-5.6 Luna currently does not.
- The desktop app must be current.
- Enterprise and Edu workspaces currently do not receive Site Tools.
- Availability depends on rollout and on tools registered by the current page.
- Users can disable or enable the permission at
  `Settings > Browser > Permissions > Enable site tools` when the feature is available.
- Tools belong to the page that registered them; closing or navigating away can make them
  unavailable.
- The current built-in Browser supports top-level imperative JavaScript registration, but
  not declarative form tools or tools registered inside iframes.

The fixture already follows the supported registration shape:
`document.modelContext.registerTool(...)` runs in the top-level page. Therefore, a failed
official control page is stronger evidence of a client-side availability gate than of a
fixture implementation defect.

The [official Browser documentation](https://learn.chatgpt.com/docs/browser) also confirms
that the built-in Browser is a ChatGPT desktop capability, not a Codex CLI or IDE-extension
capability. A CLI-only or headless browser substitute cannot prove Q1 or Q4.

## 3. Current local client evidence

The machine currently has two signed OpenAI desktop bundles with the same
`com.openai.codex` bundle identifier:

| Bundle | Version | Runtime state | Site Tools observation |
|---|---:|---|---|
| `/Applications/Codex.app` | `26.803.41515` / build `6321` | No longer running; used for the preserved negative control | The local fixture and official control page exposed only `pageAssets`; `webmcp` was absent |
| `/Applications/ChatGPT.app` | `26.825.41651` / build `7345` | Running for the passing probe | The official control exposed five Site Tools and local Stage A exposed and invoked four genuine page-defined Site Tools |

Both clients use the same normal application data and task storage. The clean handoff
preserved the current task without running both normal profiles concurrently.

Read-only packaged-client inspection is consistent with two separate controls:

1. a rollout or effective feature gate that determines whether WebMCP is available; and
2. a user permission that defaults to enabled in the newer rendered settings surface when
   no stored preference exists.

This packaged-code observation remains diagnostic only. The runtime pass proves effective
availability but does not isolate which account, workspace, permission, or rollout condition
enabled it. The MVP does not depend on an internal experiment identifier, undocumented
override, patched client, or second isolated profile.

## 4. App Server boundary

The newer installed client's bundled Codex App Server reports
`0.151.0-alpha.7.1`. Its generated version-specific JSON schema contains 154 client request
variants, including `thread/resume`, `turn/start`, thread queues, remote control, and
configuration-requirement reads.

No client request method is a Browser, Browser attachment, Site Tool, or WebMCP operation.
The schema's `BrowserUseRequirements` and `InAppBrowserRequirements` values occur inside
configuration and managed-requirement structures. They do not expose a Browser runtime
bridge.

The newer App Server also provides a managed daemon and a stdio-to-control-socket proxy.
No managed daemon control socket was running during this audit, and the daemon is a separate
App Server host rather than a documented way to attach an external Receiver to the Desktop
task's built-in Browser. The [official App Server documentation](https://learn.chatgpt.com/docs/app-server)
documents exact thread resume and new turns, but no Browser or Site Tools lifecycle.

Therefore, the supported surfaces still solve two different halves:

- App Server can prove authenticated exact-context continuation for Q3.
- ChatGPT Desktop can host the page-bound Browser and genuine Site Tools needed by Q1 and Q4.

A supported external bridge that joins both capabilities in one task remains unproven.

## 5. Completed newer-client migration

The runtime test used a clean handoff, not a concurrent second instance:

1. `/Applications/Codex.app` exited.
2. `/Applications/ChatGPT.app` `26.825.41651` build `7345` started as the sole normal client.
3. The same project and task remained available.
4. The official Site Tools page exposed the `webmcp` capability and five page-defined tools.
5. The local Stage-A page exposed four page-defined tools.
6. Genuine calls to `get_workflow_context` and `get_reentry_offer` succeeded.
7. The returned manifest ID matched the Receiver's `issue_reentry_manifest` trace entry.
8. In the later clean correlated run, one authenticated event reached the bound task and
   opened the exact canonical page.
9. The resumed page exposed genuine `webmcp`, returned fresh `READY` state, discovered only
   the Stage-B tools, and invoked `continue_artifact`.

## 6. Decisive interpretation

| Result in the newer client | Interpretation | Next action |
|---|---|---|
| Official control exposes Site Tools | The environment prerequisite passes | Run genuine Stage-A and Stage-B fixture tests |
| Official control still has no Site Tools and the permission is absent | Account, workspace, build, or rollout gate | Record current platform unavailability; do not blame the fixture |
| Official control works but the local fixture fails | Local registration or origin defect | Debug fixture against the supported imperative API |
| Local Stage-A works but resumed Stage-B cannot attach | Task-to-Browser capability continuity failure | Test all supported Desktop and App Server join routes before changing the concept claim |

The observed result follows the first branch for the environment prerequisite and resolves
the final branch for resumed Stage B in the controlled current-build P0. It does not make the
private relay a documented platform contract.

The full P0 is complete: one correlated run proved genuine Stage-A delivery,
Receiver-controlled authorization, exact event-driven task continuation, genuine Stage-B
Site Tool invocation, and continuation of the same artifact to the human decision boundary.
Production bridge support and clean-room judge reproducibility remain separate gates.
