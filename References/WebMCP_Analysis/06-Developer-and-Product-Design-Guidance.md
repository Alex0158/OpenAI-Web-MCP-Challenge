# WebMCP: Developer and Product Design Guidance

**Status:** Research dossier

**Snapshot:** 2026-08-28

## Design principle

Design WebMCP tools as a small, explicit product surface for agents—not as a dump of internal functions. The best tools express user-meaningful operations, reuse authoritative application logic, return enough information to verify the result, and make consequential behavior visible.

## Do not build two business engines

Human and agent workflows may be different, but the business truth should not fork:

```text
Human UI  -> human interaction flow  -\
                                      +-> shared domain and policy layer
WebMCP   -> agent interaction flow  -/             |
                                                   v
                                             backend authority
```

The WebMCP adapter belongs in the web application's agent-facing integration layer. It should translate structured agent input into an application command or an agent-specific use case. The command or use-case layer can handle orchestration, previews, state transitions, and recovery. The backend/domain layer must remain authoritative for permissions, pricing, inventory, ownership, payment, and irreversible commits.

This gives the product two surfaces without duplicating its core rules:

| Surface | Optimized for | Typical shape |
| --- | --- | --- |
| Human UI | discovery, visual context, manual control, accessibility, and fine-grained review | Forms, buttons, menus, direct manipulation |
| Agent tools | intent resolution, structured inputs, batching, comparison, preparation, and verification | Domain-level tools, previews, checkpoints, concise results |

An agent-only tool can be a valid new affordance, but it should not be a hidden backdoor. Keep it observable, bounded, auditable, and subject to the same server-side policy as the human path. If a workflow needs different permissions for an agent, express that difference as explicit policy and consent—not as a second unreviewed implementation.

## The agent contract

Every tool should be reviewable as a contract with six parts:

1. **Purpose:** What user goal does this operation serve?
2. **Preconditions:** What page, route, selection, permission, or state must exist?
3. **Inputs:** What is the minimum structured data required?
4. **Effects:** What changes, what remains reversible, and what requires consent?
5. **Result:** What evidence proves success, partial success, or failure?
6. **Recovery:** What can the user or agent do after a timeout, cancellation, navigation, or partial commit?

If the team cannot answer all six, the tool is not ready for a consequential workflow.

## Choose the right granularity

| Granularity | Example | Advantage | Risk |
| --- | --- | --- | --- |
| Too broad | `manage_account` | Few tools to register | Ambiguous intent, hidden side effects, large blast radius |
| Too low-level | `set_input_value`, `click_button` | Easy to map to DOM code | Recreates UI automation and exposes implementation details |
| Domain-level | `add_variant_to_cart`, `create_comment_draft` | Clear intent and useful state boundary | Requires deliberate schema and business rules |
| Journey-level | `prepare_trip_itinerary` | Can reduce orchestration overhead | Harder to review, more stateful, and may hide consequential steps |

Start with domain-level tools. Add journey-level tools only when the journey has clear checkpoints, failure semantics, and user review boundaries.

## Description and schema guidance

Descriptions and schemas are part of the model's operating environment. They should be precise without becoming an instruction-injection channel.

- Use a verb and a concrete object: `search_catalog`, `get_product_details`, `prepare_checkout_preview`.
- State whether the operation reads, drafts, changes, sends, purchases, deletes, or grants.
- Explain prerequisites and whether the current page selection is used.
- Use enums for finite choices and explicit formats for dates, IDs, currencies, and quantities.
- Mark required fields and reject unknown fields where possible.
- Give every field a short semantic description; do not rely on internal database names.
- Keep descriptions stable across state changes unless the meaning really changes.
- Avoid embedding hidden policy, unrelated instructions, or requests for secrets in metadata.

The [Chrome eval guidance](https://developer.chrome.com/docs/ai/webmcp/evals) specifically recommends testing whether the model understands a tool's purpose, chooses the correct tool, supplies correct parameters, chains outputs correctly, and completes the intended user journey.

## Tool taxonomy for product design

Separate tools by action class. This helps both UX and policy even though the current standard does not fully encode all categories.

| Class | Example | Default interaction |
| --- | --- | --- |
| Read | `get_current_cart` | May execute automatically if privacy scope is clear |
| Search or inspect | `search_orders`, `inspect_chart_data` | Automatic with bounded inputs |
| Draft | `draft_email`, `prepare_checkout_preview` | Show result and request review |
| Reversible write | `add_item_to_cart`, `apply_filter` | Automatic if state and scope are clear; provide undo |
| Consequential write | `send_email`, `submit_application` | Explicit confirmation |
| Financial or destructive | `place_order`, `delete_file`, `change_permission` | Strong confirmation, server authorization, audit trail |

This taxonomy is a product recommendation. The current `readOnlyHint` covers only a narrow hint and does not express all these distinctions.

## State-safe implementation

The callback should read the latest state at execution time, then validate a state version or entity ownership before committing. A useful mutation result includes:

```json
{
  "status": "applied",
  "operationId": "op_123",
  "entityId": "item_456",
  "stateVersion": "v_9",
  "summary": "Added one black jacket, size M, to the cart.",
  "nextReviewStep": "Review the cart before checkout."
}
```

The exact shape is an application choice. The important properties are status, identity, state evidence, concise user-facing summary, and an explicit next step. Never return a success-looking string after a server-side failure.

## Errors that support recovery

Classify errors so the agent can stop, retry, ask the user, or correct its input:

- `invalid_input`: the schema or business rule rejects the arguments;
- `stale_state`: the user changed the page or the entity version no longer matches;
- `not_authorized`: the current user or session lacks permission;
- `requires_confirmation`: the operation is prepared but not committed;
- `temporary_failure`: a dependency may be retried safely;
- `partial_commit`: some side effect happened and needs reconciliation; and
- `canceled`: execution stopped before or after a defined commit point.

The application should never ask the model to infer whether a payment or message was committed from an ambiguous network timeout.

## Framework lifecycle pattern

Frameworks should own a stable registry at a page or feature boundary rather than registering a new function on every render. A useful pattern is:

```text
Route or feature mounts
  -> register stable tool names
  -> execute reads current store/state
  -> state changes update the app, not necessarily the registry
  -> capability changes trigger a deliberate toolchange
  -> unmount aborts only tools owned by that feature
```

For React, Vue, Svelte, and similar systems, test both stale closure and teardown behavior. A callback that captures an old selection can perform a valid operation on the wrong item. A cleanup callback that unregisters too early can abort a user-approved operation.

## Human-in-the-loop experience

The visible UI should make the agent's operation legible:

- show the active tool and target object;
- show inputs that matter to the user, not only opaque IDs;
- distinguish preview from commit;
- explain why a confirmation is requested;
- allow edits before commit;
- provide stop and takeover controls;
- show progress for multi-step work; and
- show a receipt, audit identifier, or undo action after success.

The agent should not be able to make a confirmation meaningless by changing the page state between preview and commit. Bind the confirmation to a short-lived, server-validated state snapshot.

## Evaluation program

Use three layers of testing, following the [Chrome WebMCP eval guidance](https://developer.chrome.com/docs/ai/webmcp/evals):

### Deterministic unit and integration tests

Test input validation, dependencies, state transitions, UI updates, permissions, error classification, idempotency, and returned values without involving a model.

### Probabilistic tool-selection evals

Provide direct and ambiguous user requests, the full relevant tool list, realistic state, and expected tool/argument sequences. Measure:

- correct tool selection;
- valid argument rate;
- correct ordering and output chaining;
- unnecessary tool calls;
- refusal or clarification when required; and
- unsafe escalation to a consequential tool.

### End-to-end journey evals

Run realistic flows through navigation, state changes, user takeover, tool failure, re-render, cancellation, and confirmation. Include a UI-only baseline and, where relevant, a backend-MCP baseline.

## Metrics that matter

Do not judge WebMCP only by whether a tool call returned `200`.

| Metric | Definition | Why it matters |
| --- | --- | --- |
| Journey completion | Percentage of intended tasks completed correctly | Primary user outcome |
| Tool selection accuracy | Correct tool chosen for the stated intent | Measures semantic contract quality |
| Argument validity | Calls accepted without correction or unsafe coercion | Measures schema quality and model fit |
| Verification rate | Successful calls whose result and UI state are independently confirmed | Detects false success |
| Time to completion | User request to verified outcome | Captures latency benefit |
| Model/token cost | Observation and reasoning cost per completed task | Tests the economic case |
| Human takeover rate | Journeys requiring manual intervention | Indicates UX friction and safety load |
| Unintended side-effect rate | Actions outside user intent or confirmed scope | Release-blocking safety metric |
| Stale-state failure rate | Calls invalidated by state/lifecycle mismatch | Measures page-scoped reliability |
| Recovery success | Failed or canceled journeys safely resumed or reversed | Measures operational resilience |

Compare these metrics across tool versions, browser hosts, model families, page states, and user cohorts. A lower token count is not a win if unintended side effects increase.

## Progressive-enhancement rollout

1. Keep standard HTML and accessible controls as the baseline.
2. Add read-only and inspection tools first.
3. Add reversible writes with visible state and undo.
4. Introduce preview tools before commit tools.
5. Gate consequential actions behind explicit user confirmation and server authorization.
6. Instrument registration, discovery, invocation, errors, state versions, cancellations, and confirmations.
7. Compare supported WebMCP agents with ordinary UI and fallback paths.
8. Expand browser/agent coverage only after the journey is stable in each target environment.

## Developer checklist

Before shipping a tool, confirm:

- The tool has one clear user goal.
- Its description matches actual behavior and side effects.
- Its schema is narrow, typed, bounded, and validated at runtime.
- The callback re-reads current state and enforces authorization.
- The server remains authoritative for sensitive changes.
- The result is concise, structured, and independently verifiable.
- Cancellation and partial commit semantics are documented.
- Tool registration survives ordinary re-renders without stale state.
- Origin and iframe exposure are intentionally scoped.
- Deterministic, probabilistic, and end-to-end tests exist.
- The user can review, stop, take over, and recover.
- The normal UI works when WebMCP is unavailable.
