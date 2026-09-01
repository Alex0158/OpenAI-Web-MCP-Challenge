# RIGHTSPOT-004: Define the external authentication boundary

**Type:** `decision`  
**Lifecycle:** `closed`  
**Priority:** `P1`  
**Owner:** Main RightSpot thread  
**Depends on:** `RIGHTSPOT-002` closed local MVP; [Logical System Design](../03-system-design.md);
[Domain and Data Model](../04-domain-and-data-model.md);
[API and Integration Contracts](../05-api-and-integration-contracts.md);
[ADR-RS-0003](../Decisions/ADR-RS-0003-implementation-stack-and-realtime-boundary.md);
[ADR-RS-0006](../Decisions/ADR-RS-0006-durable-workflow-and-application-boundary.md)

## Task Control

- Type: `decision`
- Lifecycle: `closed`
- Priority: `P1`
- Owner: Main RightSpot thread
- Current increment: Review and accept one bounded provider and identity-boundary proposal for third-party authentication with username and password as the primary sign-in path and Google as an optional additional provider.
- Next gate: The owner authorizes the external provider credential gate and the main thread dispatches the bounded implementation task.
- Dependencies: The backend remains the authority for RightSpot roles, permissions, workflow state, and privacy projections.

## Bounded objective

Define how RightSpot can replace the current bounded demo session with a third-party authentication
provider while preserving the existing `Actor`, tenant/agent role boundary, SQLite-backed domain
authority, and ordinary MVP workflow.

The proposal should evaluate Clerk as the leading candidate against the actual RightSpot scope. It
must distinguish authentication identity from application identity, role assignment, listing
assignment, and workflow authorization. This task does not install an SDK, configure credentials,
create an external account, or implement authentication.

## Current evidence and authority

- The current implementation uses a fixed demo-session cookie and server-resolved synthetic actors.
- The domain core expects stable application actors with `tenant` or `agent` roles and server-side authorization.
- RightSpot uses Next.js 16 App Router, React, TypeScript, Node.js 24, and SQLite.
- `GET /api/health` is intentionally neutral and public; workflow and role-specific reads and writes must remain protected.
- The MVP does not require organization management, enterprise SSO, payments, MFA, password recovery, or broad user administration unless a later decision explicitly adds them.
- The owner requirement is username plus password first, with Gmail/Google sign-in as an additional option.

## RS-WO-004-01 — External authentication architecture proposal

**Role:** Senior Authentication Architect  
**Status:** `ACCEPTED_WITH_IMPLEMENTATION_GATE`  
**Supporting task:** `01a05d47-7766-7d43-9e0b-7e59d0e9f9cf` on host `local`  
**Write policy:** Read-only. Return the proposal in the supporting task report; do not write it into the repository.  
**Source baseline:** RightSpot integrated source at `625048a74e4fa7d716dd0067b29467438c648940`; the shared tree also contains the owner-held untracked file `Docs/Reference/RIGHTSPOT-GOAL-PROMPT-HISTORY.md`, which must remain untouched.

### Required read set

- `/Users/alex/.codex/AGENTS.md`
- `/Users/alex/OpenAI-WebMCP/AGENTS.md`
- `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/AGENTS.md`
- RightSpot `RUNBOOK.md`
- RightSpot `Docs/00-current-status.md`
- RightSpot `Docs/01-product-definition.md`
- RightSpot `Docs/02-requirements.md`
- RightSpot `Docs/03-system-design.md`
- RightSpot `Docs/04-domain-and-data-model.md`
- RightSpot `Docs/05-api-and-integration-contracts.md`
- RightSpot `Docs/06-validation-and-evidence.md`
- RightSpot ADR-RS-0001 through ADR-RS-0008
- Current demo-session, HTTP adapter, domain actor, projection, route-handler, and test source
- Current official Clerk documentation for Next.js, username/password, Google connection, and application security

### Required proposal contents

1. Provider recommendation with a bounded comparison against the smallest credible alternatives. Explain why the selected provider fits or does not fit the current local MVP.
2. Exact identity model: provider user ID, local `AppUser` mapping, stable domain actor ID, role assignment, active status, and agent listing assignment.
3. Route and API protection matrix, including public health behavior, signed-out behavior, wrong-role behavior, and server-side role enforcement.
4. Migration strategy from `rightspot_demo_session` without weakening existing workflow authorization or privacy projections.
5. Username/password semantics, optional Google sign-in, identifier/recovery implications, local development origin requirements, and the in-app-browser testing limitation for Google OAuth.
6. Secret and environment-variable boundary, failure states, session lifecycle, sign-out, account deletion/revocation assumptions, and no-secret logging rules.
7. Minimal implementation Work Order decomposition with exact ownership, shared-file serialization points, rollback boundary, and verification matrix.
8. Explicit non-goals and unresolved decisions. Do not silently add email verification, password recovery, MFA, organizations, enterprise SSO, or user administration.

### Forbidden actions

- Do not install `@clerk/nextjs` or any other authentication package.
- Do not run `clerk init`, create or claim a Clerk application, create OAuth credentials, log in to an external provider, or modify `.env`/`.env.local` files.
- Do not edit code, schemas, tests, package manifests, lockfiles, or canonical documents.
- Do not inspect or print existing environment-variable files, secrets, cookies, browser storage, or credentials.
- Do not change the accepted domain actor model, role authority, workflow state machine, or public health contract.
- Do not claim authentication is implemented, secure, production-ready, or verified.

### Return gate

Return `READY_FOR_REVIEW` with verified facts, official documentation references, recommendation,
alternatives, assumptions, unknowns, risks, exact decision points, and the smallest implementation
sequence. The main thread owns the ADR, code, credentials, external setup, verification, and closure.

## Closure gate

The main thread reviewed the supporting proposal, accepted Clerk as the next external-auth
candidate and the local authority boundary in
[ADR-RS-0010](../Decisions/ADR-RS-0010-external-authentication-boundary.md), and registered the
separate pending implementation task `RIGHTSPOT-006`. No package, credential, external account, or
authentication source change is authorized by this closed decision task.
