# ADR-RS-0010: External Authentication Boundary

**Status:** Accepted — provider candidate and authority boundary; implementation gated  
**Decision date:** 2026-09-01  
**Decision owner:** Main RightSpot thread

## Context

The accepted local MVP uses `rightspot_demo_session` with two fixed synthetic roles. That is
deliberately sufficient for a deterministic local demonstration, but it is not a real identity
system. The Authentication Advisor returned `READY_FOR_REVIEW` in `RS-WO-004-01` and evaluated the
owner's requested username/password path with optional Google sign-in.

External authentication adds identity realism and credential dependency; it does not improve the
already-closed workflow-domain evidence. The local MVP must therefore retain a clear rollback
boundary while the provider decision is implemented separately.

## Decision

### 1. Select Clerk as the next external-auth candidate

Clerk is the preferred provider for the next RightSpot identity increment because it has a bounded
Next.js App Router integration surface and supports configurable username/password and optional
Google sign-in. Auth0 remains the credible alternative. The current demo session remains the
accepted local MVP baseline and rollback target.

This decision is not an account, plan, SDK-version, credential, or production-readiness claim. Exact
package compatibility, provider plan, callback configuration, and current provider behaviour must be
verified during the gated implementation task.

### 2. Keep provider identity separate from RightSpot identity

The provider answers who authenticated. RightSpot remains the authority for local actor identity,
role, active status, listing assignment, workflow authorization, and privacy projections.

The intended mapping is:

```text
(provider, providerUserId)
  -> unique local AppUser
  -> stable local Actor { id, role }
  -> existing tenant/agent assignment and workflow checks
```

The local `AppUser` boundary should contain a stable local ID, provider name, immutable provider
user ID, `tenant` or `agent` role, active/disabled status, and timestamps. Provider IDs must not
enter tenant DTOs, workflow audit content, or client-selected command fields. Existing local actor
IDs may be preserved for the two synthetic users.

Only an active, pre-provisioned `AppUser` may enter RightSpot. An unknown or disabled provider user
must fail closed; the client must never choose a role, assignment, or actor ID.

### 3. Preserve the existing route and API contract

`GET /api/health` remains public and neutral. Protected tenant and agent pages/API routes continue
to use server-side identity resolution, role checks, assignment checks, object-level checks, and the
existing `401`/`403`/`404`/`409` semantics. No workflow DTO, state transition, privacy projection,
or request version rule changes as part of auth integration.

The final provider implementation must not trust `rightspot_demo_session` concurrently with the
provider session. Rollback is a deliberate source/configuration change to the demo baseline, not an
automatic hidden fallback during provider outage.

### 4. Bound the first provider configuration

- Username plus password is the primary sign-in path.
- Google is optional and is not a mandatory acceptance gate for the first provider increment.
- No public registration, self-service role assignment, organizations, enterprise SSO, MFA,
  passkeys, broad profile management, custom account-linking engine, or webhook-driven authorization.
- Password recovery is excluded unless a later decision approves a verified email/phone recovery
  attribute and flow.
- One exact local origin must be used; `localhost:<port>` and `127.0.0.1:<port>` must not be mixed.
- Google OAuth must be verified in a normal external browser; an embedded/in-app browser limitation
  is not evidence that the core username/password path is broken.

### 5. Keep secrets and provider lifecycle outside source

Provider secrets, session cookies, JWTs, OAuth codes/tokens, reset codes, and webhook secrets must
remain in the approved local environment/secret boundary and never appear in source, logs, task
reports, or browser evidence. The server must resolve the current provider session on protected
requests and map it to current local `AppUser` state.

Fixture reset must reset workflow/listing/slot/audit state without deleting or recreating
`AppUser` mappings. Local disable is a soft authorization state; it must not silently reassign agent
work or delete historical workflow evidence.

## Alternatives considered

### Keep the demo session as the final identity solution

Rejected as the external-auth target, but retained as the local MVP baseline and rollback target. It
has no external dependency and remains the fastest deterministic judge rehearsal path.

### Auth0

Retained as a credible fallback if Clerk's verified package, plan, callback, or local-browser fit is
unsuitable. It is not selected for the first integration because its current setup surface is larger
for this small Next.js demo.

### Put role in provider metadata or client state

Rejected. This would move RightSpot authorization outside the local domain boundary and permit role
or assignment confusion.

## Consequences

- RightSpot gains a clear path to real user authentication without replacing the domain actor model.
- The implementation will require an external provider application, two pre-provisioned test users,
  exact local callback configuration, package installation, and secret handling.
- Auth integration is a separate risk boundary and must not block visual work or rewrite the closed
  local-MVP evidence.
- The provider task remains pending until the owner authorizes the external account/credential gate.

## Validation and reopen triggers

Before implementation, verify the exact Clerk SDK version against Next.js `16.3.4` and Node.js
`24.20.0`, provider plan/limits, callback/origin configuration, and secret storage path. After
implementation, verify signed-out `401`, wrong-role `403`, unmapped/disabled identities, object-level
privacy, session expiry/sign-out, no dual trust, reset survival of mappings, no-secret logging, the
unchanged workflow Happy Path, and rollback to the demo baseline.

Reopen if provider setup cannot satisfy the local credential/browser boundary, if role/assignment
authority would move outside RightSpot, or if the product requires registration, organizations,
recovery, or other excluded identity features.
