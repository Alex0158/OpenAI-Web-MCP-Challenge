# Workspace Agents Trigger and WebMCP Boundary

**Role:** SUPPORTING official-capability audit  
**Status:** Trigger and conversation continuity externally verified; Browser/WebMCP join unknown  
**Research date:** 2026-08-30  
**Decision authority:** Core/00 and any later adapter ADR remain controlling

## 1. Question

After the standalone App Server Desktop joins failed, can Workspace Agents provide a
supported external-event continuation route that still reaches a genuine page-bound WebMCP
surface?

This is a different topology from resuming an arbitrary local Codex Desktop task. It must be
evaluated as a published ChatGPT Workspace Agent conversation.

## 2. Documented Workspace Agents contract

Official [trigger documentation](https://learn.chatgpt.com/workspace-agents/trigger-runs)
documents the following API-channel behavior for a published Workspace Agent:

- `POST /v1/workspace_agents/{id}/trigger` accepts an external backend or automation trigger;
- the service durably queues the run and returns `202 Accepted`;
- caller-provided `conversation_key` can continue the same Workspace Agent conversation
  across multiple trigger events;
- `Idempotency-Key` supports safe trigger retries;
- beta run status reports `queued`, `in_progress`, `suspended`, `completed`, or `failed`;
- the Agent's response content cannot currently be retrieved through the trigger API.

Official [authentication documentation](https://learn.chatgpt.com/workspace-agents/authentication)
requires a published API channel, an admin-enabled Workspace Agents feature, permission to
create personal access tokens, and a Workspace Agents-scoped token.

These are supported event-to-Agent-conversation capabilities. They do not bind a Codex
Desktop task, Browser tab, or local thread ID.

## 3. Browser and WebMCP boundary

Official [Browser documentation](https://learn.chatgpt.com/docs/browser) describes Browser
surfaces for ChatGPT and Codex, including Desktop and cloud Browser contexts. It does not
state that an API-triggered Workspace Agent run receives either Browser surface.

Official [Site Tools documentation](https://learn.chatgpt.com/docs/webmcp) places genuine
Site Tools in ChatGPT Desktop's built-in Browser. The tools belong to the currently open page
and its live registration. The Workspace Agents trigger documentation does not define a
join from an API-triggered run to that page-bound Desktop surface.

Therefore, the following chain is not currently documented:

```text
Workspace Agent API trigger
-> same conversation_key
-> eligible Browser
-> canonical page
-> fresh page-bound WebMCP Site Tools
```

A `conversation_url` is not a Browser-tab binding. MCP or connector tools attached to a
Workspace Agent are also not evidence of genuine page-bound WebMCP.

## 4. Current local boundary

The current machine has ChatGPT Desktop `26.825.41651`, the Browser plugin, and the local
Browser tool transport. No local configuration or installed documentation proves that the
current account and workspace can publish a Workspace Agent API channel or create the
required scoped token. Entitlement and administration are server-side workspace controls;
the installed app version cannot establish access.

No Workspace Agent token, published channel, or triggered run was created in this audit.

## 5. Verdict

| Capability | Status | Meaning |
|---|---|---|
| External event trigger | **EXTERNALLY VERIFIED** | Supported API for a published Workspace Agent |
| Durable trigger queue and retry identity | **EXTERNALLY VERIFIED** | `202 Accepted`, run status, and `Idempotency-Key` are documented |
| Stable Agent conversation | **EXTERNALLY VERIFIED** | Reused `conversation_key` continues the Workspace Agent conversation |
| Current account entitlement | **UNKNOWN** | Requires live workspace/admin verification |
| Browser in API-triggered run | **UNKNOWN** | Not stated in the trigger contract |
| Genuine page-bound WebMCP | **UNKNOWN** | No documented Workspace Agent trigger-to-Site-Tools join |
| Same arbitrary Codex Desktop task | **NOT THE TOPOLOGY** | Workspace Agent conversation continuity is a different product claim |

Workspace Agents are a credible candidate for supported event delivery and conversation
correlation. They are not yet a verified WebMCP re-entry adapter.

## 6. Minimum adoption gate

Before selecting this topology:

1. verify that the project workspace can enable Workspace Agents and issue the scoped token;
2. publish one minimal API channel;
3. trigger twice with one `conversation_key` and prove conversation continuity;
4. determine whether the API-triggered run receives an eligible Browser;
5. if a Browser exists, prove fresh `fetchTools()` and one genuine page-bound read-only Site
   Tool call on the canonical page;
6. define completion observation because API response content is unavailable;
7. keep the test separate from claims about local Desktop task continuation.

If the genuine Site Tool gate fails, Workspace Agents may still be useful for event-to-Agent
conversation delivery, but they do not satisfy this project's final WebMCP re-entry claim.

## 7. Architecture implication

- Keep the Receiver event and durable-delivery contract platform-neutral.
- Keep Workspace Agents behind the same replaceable continuation-adapter boundary.
- Do not add a second Agent merely to forward into Desktop; that preserves the original
  unsolved join and increases identity, cost, and failure surfaces.
- Do not block app selection on this entitlement-dependent route. The selected app's latency,
  privacy, lifecycle, and watch-window economics should determine whether to test Workspace
  Agents, bounded Scheduled pull, or a future supported connector next.
- Do not claim production or judge portability until the chosen adapter completes a genuine
  WebMCP run in a clean environment.
