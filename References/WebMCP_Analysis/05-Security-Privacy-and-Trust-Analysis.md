# WebMCP: Security, Privacy, and Trust Analysis

**Status:** Research dossier

**Snapshot:** 2026-08-28

## Security conclusion

WebMCP changes the security boundary from “what can an agent click?” to “which page-defined capabilities, descriptions, inputs, outputs, origins, and lifecycle events can the agent trust right now?” That is a more structured interface, but it is not automatically a safer one.

The current specification's security material is non-normative and explicitly leaves important mitigations to agents, user agents, site authors, and product policy. A WebMCP tool must therefore be treated as an untrusted or partially trusted capability until the application, origin, host, and user-consent layers establish otherwise.

## Assets at risk

- Authenticated session cookies and tokens available to the page.
- Personal, financial, health, location, organizational, and private document data.
- User intent and cross-site context supplied to the agent.
- Account state: purchases, messages, permissions, files, subscriptions, and deletions.
- Tool metadata and registry integrity.
- Application state consistency between user actions and agent actions.
- Trust in the brand, agent host, browser, and confirmation UI.

## Actors and trust boundaries

| Boundary | What can go wrong |
| --- | --- |
| Site and third-party scripts | A compromised dependency can register, overwrite, or race a tool; a page can also intentionally publish misleading metadata. |
| Tool metadata and model | Names, descriptions, schemas, titles, and annotations can steer model behavior or hide side effects. |
| Tool output and model | Reviews, comments, search results, and user-generated text can contain indirect prompt injection. |
| Browser and page | Origin, iframe, Permissions Policy, lifecycle, and navigation checks can fail or be configured too broadly. |
| Agent host and user | The host may carry cross-site context, credentials, or private history into a call; confirmation may be absent or misleading. |
| Client and server | Client-side WebMCP validation may diverge from authoritative server rules or be bypassed entirely. |
| Framework and lifecycle | Re-rendering, unmount, BFCache, or navigation can remove or change a tool during a user-visible workflow. |

## Threat catalogue

### 1. Tool metadata poisoning

The model sees a semantic surface designed to guide tool selection. A malicious or compromised page can put instruction-like text in a tool name, description, parameter description, title, or schema. This can cause the agent to prioritize a malicious operation, reveal context, or ignore a confirmation boundary.

The [WebMCP security analysis](https://webmachinelearning.github.io/webmcp/) identifies metadata and parameter descriptions as prompt-injection vectors. The right mental model is that tool metadata is untrusted input to an agent, not a system message.

## Inherited authentication is context, not authority

One practical attraction of WebMCP is that the page already has the user's live SSO, session cookies, and application context. This can avoid duplicating a session in a separate integration service. OpenAI describes Site tools as operating on the current signed-in page, and secondary analysis such as the [ScaleKit article](https://www.scalekit.com/blog/webmcp-the-missing-bridge-between-ai-agents-and-the-web) emphasizes browser-inherited SSO, cookies, and RBAC as a B2B benefit.

That convenience must not be confused with agent authorization. The browser session proves that the page is operating in an authenticated context; it does not prove that a particular model proposal is intended, safe, or within the user's confirmed scope. Treat inherited credentials as an expanded risk surface: minimize what tools can request, show the user the affected scope, require confirmation for consequential actions, and re-authorize the operation on the server.

### 2. Untrusted output injection

A tool may return content that originated from a review, forum post, document, email, search result, or another user. The output may contain instructions that the model mistakes for trusted control text. The `untrustedContentHint` annotation is intended to help the client handle such output, but it is a hint and cannot prove the provenance of every field.

### 3. Tool hijacking and registration races

Third-party scripts or competing registrations can manipulate a tool surface during a session. The [WebMCP Tool Surface Poisoning paper](https://arxiv.org/abs/2606.06387) reports controlled experiments involving AbortSignal-based hijacking, registration races, description injection, and long-description overflow. It reports average attack-success rates of 94% for one AbortSignal hijacking condition and 100% for one registration-race condition across its tested models and tasks. These are paper-specific laboratory results, not production prevalence estimates, but they demonstrate that the registry and lifecycle can be attack surfaces in their own right.

### 4. Intent and side-effect misrepresentation

A tool may claim to be read-only while mutating state, or may hide a consequential effect behind a benign-sounding verb. The current `readOnlyHint` is not enforcement. The formal security discussion notes that authenticated tools could trigger purchases, transfers, account changes, private-data disclosure, or deletion if agent intent is ambiguous or the site implementation is malicious or flawed.

This is why “the model called the right function” is not equivalent to authorization. The application must classify and gate side effects independently.

### 5. Over-collection and privacy leakage

Overly broad schemas can ask for age, pregnancy status, location, height, skin tone, purchase history, or other sensitive attributes even when the operation does not need them. A helpful agent may supply context from other sites or conversation history, producing silent profiling, cross-site leakage, or discriminatory behavior.

The lowest-risk tool asks for the minimum data needed to perform the current operation and makes data use obvious to the user.

### 6. Cross-origin and iframe confusion

The standard uses Permissions Policy, `exposedTo`, `fromOrigins`, and origin metadata to constrain cross-origin tools. Misconfiguration can still expose more than intended. Agent hosts must preserve origin provenance when aggregating tools from multiple documents; otherwise identical names can be mistaken for the same capability.

The current OpenAI Site tools implementation does not discover iframe tools, including same-origin or cross-origin iframe tools, which reduces its current surface but is a product limitation rather than a universal standard rule.

### 7. Lifecycle and race conditions

Navigation, BFCache, route changes, state-dependent registration, and in-flight unregistration can leave the agent with stale capabilities. A tool shown to the model may no longer be available when called, or the callback may run against a different state than the user reviewed.

The official repository tracks an open concern about unregistering a tool during an in-flight call. Current Chromium implementation discussion reports unconditional abort behavior in that case. Applications should design for cancellation and partial completion rather than assuming that unregister is harmless.

### 8. Private browsing and multi-origin context leakage

The browser may carry context across origins and profiles. The security questionnaire highlights private-browsing and multi-origin state as user-agent responsibilities that still require careful design. A product must not assume that because a tool is page-scoped, every value the agent knows is page-scoped.

## Existing controls and their limits

| Control | What it helps with | What it does not prove |
| --- | --- | --- |
| Secure context and origin-keyed agent cluster | Basic execution isolation | That the site or script is benign |
| `tools` Permissions Policy | Accidental broad iframe exposure | Safe tool intent or trustworthy content |
| `exposedTo` and `fromOrigins` | Explicit cross-origin discovery limits | Correct origin ownership or non-malicious code |
| `readOnlyHint` | Agent/UI policy signal | Read-only behavior or authorization |
| `untrustedContentHint` | Output handling and model-context hygiene | Complete content provenance |
| `AbortSignal` | Cancellation and lifecycle cleanup | Safe rollback after a committed mutation |
| Browser confirmation | Human review for selected sensitive actions | Correctness of the tool or absence of prompt injection |
| Server-side auth and validation | Authoritative permission and business rules | User intent, if the confirmation flow is weak |
| Deterministic and probabilistic evals | Detection of tool-selection and journey failures | Adversarial behavior outside the evaluated distribution |

## Secure implementation rules

1. **Keep server authority:** Treat the browser tool as an untrusted client. Re-authorize every sensitive operation on the server.
2. **Publish narrow capabilities:** Prefer `get_current_cart` and `add_item` with a validated variant ID over `manage_store` or raw JavaScript evaluation.
3. **Separate drafts from commits:** Use distinct tools for prepare, review, and commit. Make irreversible actions impossible without a visible confirmation step.
4. **Classify side effects:** Track read-only, reversible, consequential, financial, privacy-sensitive, and destructive behavior independently of current annotations.
5. **Minimize inputs:** Do not expose fields merely because the model could fill them. Collect only what the operation needs.
6. **Preserve provenance:** Carry origin, page, tool version, registration time, and user-visible state identifiers into logs and confirmation UI.
7. **Validate at call time:** Re-read current state, ownership, CSRF/session conditions, prices, permissions, and optimistic-concurrency versions.
8. **Use idempotency:** Mutations need operation IDs and safe retries. A canceled model call must not silently duplicate an order or message.
9. **Bound metadata and output:** Keep names, descriptions, schemas, and returned content concise; sanitize or label untrusted fields.
10. **Control third-party scripts:** A page cannot claim a trustworthy tool surface if any unreviewed dependency can register or replace tools.
11. **Design cancellation explicitly:** Define what cancellation means before commit, during network I/O, after commit, and after navigation.
12. **Retain the human path:** Accessible HTML and ordinary UI are part of the safety and recovery design, not optional decoration.

## Security design pattern for consequential actions

```text
Agent proposes structured operation
        |
        v
Page validates current state and prepares a preview
        |
        v
User sees target, scope, price/data, and side effects
        |
        v
Explicit confirmation creates a short-lived commit capability
        |
        v
Server re-authorizes and commits idempotently
        |
        v
Page displays receipt, audit ID, and recovery path
```

This is an architectural recommendation, not a current WebMCP requirement.

## Academic and community research signals

### WebMCP Tool Surface Poisoning

The [2606.06387 paper](https://arxiv.org/abs/2606.06387) introduces Mid-Session Tool Injection and distinguishes protocol-layer attacks such as registration hijacking/races from semantic attacks such as descriptions and framing. Its experiments report high attack-success rates under controlled conditions, while its proposed proxy defenses are not a standard requirement and have unmeasured production cost. The durable lesson is that tool-surface integrity deserves the same attention as prompt and output integrity.

### WebMCP-Phalanx

The [2608.24017 preprint](https://arxiv.org/abs/2608.24017), submitted on 2026-08-25, proposes a browser trust anchor plus a quarantine model/agent separation. It reports promising results in its own setup, including blocking 80/80 description-injection cases in one configuration, while noting that an adaptive attacker can exploit malicious tool names before inspection. It is very recent preliminary research, not evidence of a settled defense.

### Spotlighting

The [Spotlighting paper](https://arxiv.org/abs/2403.14720) studies provenance-preserving transformations for indirect prompt injection and reports large reductions in attack success in its GPT-family experiments. It is relevant as a defense pattern for untrusted tool output, but it does not solve tool ownership, lifecycle, or authorization.

## Production go/no-go gates

Do not expose a consequential action to an agent merely because the page can register it. Require, at minimum:

- authoritative server-side authorization;
- explicit tool and origin provenance;
- independent side-effect classification;
- a visible confirmation boundary for irreversible or sensitive actions;
- idempotency and audit logging;
- deterministic tests for the callback and state transitions;
- probabilistic evals for tool selection and argument generation;
- end-to-end tests across navigation, re-render, cancellation, and failure;
- a human fallback and recovery path; and
- monitoring for anomalous tool registration, call rates, arguments, and result patterns.

If any of these is unavailable, limit the tool surface to read-only or reversible operations until the gap is closed.

## Residual risks

Even with these controls, a user may intentionally grant a site too much authority, a trusted origin may be compromised, the model may misunderstand ambiguous intent, or a browser/agent host may implement safeguards differently. WebMCP improves the interface contract; it does not eliminate the general security problem of allowing a probabilistic agent to operate in an authenticated environment.
