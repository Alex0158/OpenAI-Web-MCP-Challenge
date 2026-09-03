# TASK-023: Build Connector Self-Disconnection

**Status:** `verification_pending` — locally and hosted-runtime verified; exact Git closure remains open
**Owner:** Cloud Receiver v2 and Local Connector lifecycle boundary
**Profile:** Assured
**Scope:** Active `saas-boilerplate/` Receiver and dashboard, `runtime/local-connector/`, and owning documentation only
**Authority:** [ADR-0040](../Decisions/ADR-0040-adopt-connector-self-disconnection.md)
**Evidence:** [CLOUD-021](../Development/CLOUD-021-connector-self-disconnection.md)

## Task Control

- Type: `implementation`
- Lifecycle: `verification_pending`
- Priority: `P1`
- Owner: Cloud Receiver v2 and Local Connector integration team.
- Current increment: The replay-safe self-disconnection route, remote-first CLI cleanup, and
  dashboard disconnected projection are locally verified; the same Receiver and dashboard snapshot
  has bounded hosted runtime evidence under CLOUD-021.
- Next gate: Separate and review the exact task-owned hunks in both collaborative dirty worktrees,
  rerun any checks invalidated by concurrent integration, and record the resulting commit identities.
- Dependencies: ADR-0032, ADR-0033, ADR-0039, and ADR-0040.

## 1. Problem and objective

Make `re-entry disconnect` remove the Mac's future Receiver authority before deleting its local
credential, while retaining the Connector row and showing the resulting state in the signed-in user
dashboard.

## 2. Authority and scope

- Add only `POST /v0.1/connectors/disconnect` with the exact ADR-0040 request and response.
- Reuse `Connector.revokedAt`; add no table, migration, token rotation, or remote delete.
- Keep the local credential after any remote failure; clear it only after a confirmed or duplicate
  disconnection response.
- Keep browser sign-out, account-owned revoke buttons, presence, WebSockets, the retired Receiver,
  public Grant control, and deployment outside this increment.

## 3. Verification evidence

| ID | Required proof |
|---|---|
| `DISCONNECT-001` | First request stamps `revoked_at`, returns the exact token-free response, appears in the account list, and blocks future claims. |
| `DISCONNECT-002` | Replay returns `duplicate: true`, preserves the first timestamp, and an unknown token returns `connector_identity_invalid`. |
| `DISCONNECT-003` | A disconnected Mac is absent from a later consent prompt while another eligible Mac remains selectable. |
| `DISCONNECT-004` | The CLI validates the exact response, calls remote before local cleanup, and preserves local credentials when remote revocation fails. |

## 4. Non-goals

- deleting the retained Connector row or changing its immutable delivery target;
- treating local cleanup as proof of remote revocation;
- adding account-controlled revoke, presence, token rotation, or another disconnection transport; or
- claiming an exact-source or complete hosted journey from bounded route probes.

## 5. Verification and closure

Close only after focused and aggregate local verification plus authority/evidence writeback.

The behavior and evidence gates pass locally, and the later authorized Vercel release has bounded
health, route, CORS, and public-page evidence. The Task remains `verification_pending` because this
increment has no isolated commit SHA: both repositories contain concurrent owner-held work,
including shared consent-test and UI surfaces. No commit, push, CI, credentialed hosted disconnect,
or full hosted end-to-end journey is claimed.

## 6. Reopen condition

Reopen for a different route, credential placement, row-deletion policy, account-controlled
revocation, or presence model.
