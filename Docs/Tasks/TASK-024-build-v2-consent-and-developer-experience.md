# TASK-024: Build the Cloud Receiver v2 Consent and Developer Experience

**Status:** `verification_pending`  
**Owner:** Cloud Receiver v2 web experience  
**Profile:** Assured  
**Scope:** Active `saas-boilerplate/` consent presentation, its Receiver-origin decision guard,
frontend session UX, and owning evidence  
**Authority:** [ADR-0035](../Decisions/ADR-0035-adopt-cloud-receiver-v2-consent-targeting.md), [Core/09](../Core/09-business-flows-and-ux.md), and [TASK-022](TASK-022-prepare-sdk-v2-full-chain-integration.md)

## Task Control

- Type: `implementation`
- Lifecycle: `verification_pending`
- Priority: `P1`
- Owner: Cloud Receiver v2 web-experience implementation.
- Current increment: The active v2 consent page, safe authentication return, route-specific
  Receiver-origin decision protection, exact signed Host-origin completion target, consent-only
  opener preservation, session-aware landing/auth entry actions, and interactive Host SDK guidance are
  implemented, locally verified, and serving from the stable Receiver alias.
- Next gate: Establish exact Git/source identity and run one complete deployed popup-flow
  verification with an authorized production test organization before claiming production release
  end to end; also make the public Guide actions session-aware under `AUDIT-V2-010`.
- Dependencies: ADR-0035, the current Host SDK public contract, and the Primary Development Runbook.

## 1. Problem and objective

Complete the visible account-first handoff without changing its authority or wire contract:

1. a Host-created consent URL survives user login and renders a clear Receiver-owned decision page;
2. a signed-in visitor sees the correct dashboard or developer-portal action instead of another
   sign-in prompt;
3. the developer portal explains the current server, browser, consent-confirmation, and later Event
   integration as an interactive, copyable flow; and
4. each path is verified in a local browser and recorded with current screenshots.

## 2. Authority and scope

- Preserve all ADR-0035 consent, targeting, privacy, and completion-message fields.
- Keep organization credentials, Host private keys, Connector credentials, and private bindings out
  of browser code and rendered content.
- Treat Event `202` as accepted and queued only.
- Change no API path, request/response body, database schema, Grant rule, Connector lifecycle,
  delivery contract, or deployment configuration. The account decision route remains
  Receiver-owned and now accepts only its configured Receiver origin rather than the frontend
  origin.
- Do not modify the retired `runtime/cloud-receiver/` implementation.
- Do not edit the Connector self-disconnection files owned by TASK-023.

## 3. Verification evidence

| ID | Required proof |
|---|---|
| `WEB-V2-001` | Pending consent renders escaped Host details, eligible Mac choices, approve/decline controls, and no raw consent token. |
| `WEB-V2-002` | A consent URL without a user session redirects through `/user-login` and returns to the exact safe consent URL after authentication. |
| `WEB-V2-003` | Approval is disabled without an eligible Mac; terminal consent states cannot issue another decision; failed decisions emit no completion message. |
| `WEB-V2-004` | Landing and matching auth routes detect existing user/developer sessions and expose the correct destination without requiring another login. |
| `WEB-V2-005` | The developer portal presents the current SDK lifecycle, copyable code, credential boundaries, and truthful queued-only Event result. |
| `WEB-V2-006` | Local browser QA records the consent, returning-session landing, and interactive SDK documentation states with no blocking console or request error. |
| `WEB-V2-007` | The Receiver-hosted consent page can submit its same-origin JSON decision; the frontend origin is rejected and no failed request changes consent state. |
| `WEB-V2-008` | Successful approval or decline targets only the signed Host origin; the SDK still requires the exact Receiver sender, exact popup source, and Host-server status confirmation. |
| `WEB-V2-009` | Only the Receiver consent document preserves its cross-origin opener; a real popup stays open through review, closes after a terminal decision, and causes the Host to confirm status before reporting approval. |

## 4. Non-goals

- changing a protocol route, payload, Grant rule, Connector lifecycle, or delivery contract;
- treating popup completion messaging as consent or Host authority;
- broadening opener policy beyond the Receiver consent document; or
- claiming production release without exact committed source and one complete deployed flow.

## 5. Verification and closure

All implementation gates above are green locally and recorded in
[CLOUD-022](../Development/CLOUD-022-v2-consent-and-developer-experience.md). Red-first tests
reproduced both the Receiver-self-target mismatch and Helmet's global `same-origin` opener severing.
The accepted implementation now targets the exact signed Host origin without a wildcard and returns
`Cross-Origin-Opener-Policy: unsafe-none` only from `/consent`. Receiver tests, SDK tests, a real
cross-origin popup, durable approval, Host-server confirmation, and one later Event are green.

The task remains `verification_pending` because no exact Git identity contains the final source and
no authorized production Host credential was available for a complete deployed consent creation,
popup decision, Host-server confirmation, and later Event run. The route-scoped opener policy is
deployed in `dpl_AVGD8hA7bNwhcEykUQ8BMDbEX2sd`; local browser functionality and deployed route,
database-readiness, CORS, opener-policy, authenticated dashboard, and active Connector probes are
green. Commit attestation and the complete deployed popup flow remain open.

The public `/docs` Guide still presents signed-out actions to an authenticated user. This is the
separate, locally reproduced `AUDIT-V2-010` frontend inconsistency; it remains owned here and does
not weaken the narrower Receiver-origin consent evidence above.

Close only when the evidence record contains exact source identity, commands, runtime, screenshots,
and residual risks. The current lifecycle remains `verification_pending` until then.

## 6. Reopen condition

Reopen for any changed consent authority, credential placement, redirect allow-list, completion
message, SDK export, Event-status meaning, or session-aware Guide behavior.
