# TASK-031: Release the Simple SDK Facade

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-09-03

## Task Control

- Type: `operations`
- Lifecycle: `pending`
- Priority: `P1`
- Owner: Host SDK release owner with the Cloud Receiver v2 developer-experience owner.
- Current increment: Reconcile the checkout-only simple facade and active developer-portal install
  guide with the published SDK package surface.
- Next gate: Approve an exact-source release increment that isolates the intended SDK changes,
  assigns a new immutable version, verifies package contents, and corrects the portal instruction
  before publication.
- Dependencies: ADR-0041, TASK-022, TASK-025, SDK-006, AUDIT-V2-007, and AUDIT-V2-011 in Core/09.

## 1. Problem and objective

The npm registry serves `@4xeoz/re-entry-sdk@0.3.1` with `gitHead` `9864ba0`. That commit does not
export the current working-tree `createReentry()` facade, while the active developer portal tells a
developer to install the registry package and then import that method. The README also presented the
same sequence before this reconciliation.

The objective is to make one versioned package and every active install guide describe the same
verified public API.

## 2. Authority and evidence

- ADR-0041 owns the accepted additive simple-facade behavior.
- TASK-025 and SDK-006 own the bounded implementation and separate-process evidence.
- TASK-022 owns the earlier v2 SDK contract and the already-published `0.3.1` boundary.
- Registry readback on 2026-09-03 returned latest version `0.3.1` and
  `gitHead=9864ba09b79a76641d8662502ccf918cd3fd4b3b`.
- `git show` at that commit contains no `createReentry` export; the current working tree does.
- `saas-boilerplate/frontend/components/developer/SdkDocumentation.tsx` pairs the registry install
  command with the checkout-only import.

## 3. Scope

Select and isolate the exact SDK source, reconcile its dependency and package surface, assign a new
immutable version, verify the packed artifact, update the active developer-portal instruction, and
perform read-only registry provenance plus clean-consumer import and behavior checks after an
authorized publication.

## 4. Non-goals

- publishing, committing, pushing, deploying, or modifying production code inside this audit;
- overwriting or republishing immutable version `0.3.1`;
- bundling unrelated Connector, Receiver, UI, or collaborator changes into the SDK release;
- treating package availability as Receiver deployment or full-chain production proof; or
- weakening the advanced SDK or protocol contracts.

## 5. Verification and closure

Close only when the new registry version resolves to the exact reviewed commit, the tarball exports
`createReentry`, a clean consumer installs and executes the documented facade, the portal names the
same version/API, Node 24 SDK and package checks pass, and provenance plus residual deployment limits
are recorded. Historical `0.3.1` remains described only at its actual API boundary.

## 6. Reopen condition

Reopen if the registry tag, `gitHead`, exports, package contents, portal install command, facade
contract, or clean-consumer result diverges.
