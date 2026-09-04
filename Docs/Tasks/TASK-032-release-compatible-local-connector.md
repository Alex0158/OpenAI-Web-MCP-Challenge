# TASK-032: Release a Compatible Local Connector

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-09-03

## Task Control

- Type: `defect`
- Lifecycle: `pending`
- Priority: `P1`
- Owner: Local Connector release owner with the Re-entry Core and Cloud Receiver v2 integration
  owners.
- Current increment: Reconcile the published Connector artifact, its reported Git provenance, and
  the active instruction-bearing delivery-claim contract.
- Next gate: Approve one exact-source release increment that assigns a new immutable Connector
  version, verifies the packed bundle and a clean install against active v2, and publishes only
  after separate authorization.
- Dependencies: ADR-0037, ADR-0041, TASK-022, TASK-025, TASK-026, TASK-029, SDK-006, AUDIT-V2-007,
  and AUDIT-V2-012 in Core/09.

## 1. Problem and objective

The npm registry serves `@4xeoz/re-entry@0.2.20` with
`gitHead=733d77f97cca34429e2784dcf39663256dd3544b`. That commit records Connector package version
`0.2.14`, while the published tarball records `0.2.20`; the artifact therefore cannot be reproduced
from its reported commit. The tarball also bundles an earlier Core Connector client whose strict
delivery shape has no `continuation.instruction`. Active Cloud Receiver v2 now always returns that
consented field, and the current adapter requires it. A Node 24 package-level probe of the registry
artifact against a representative active-v2 response failed with `connector_response_invalid`.

The objective is to publish one exact, reviewable Connector artifact that accepts the current
instruction-bearing lease, preserves the fixed instruction-safety frame, and matches every active
install instruction.

## 2. Authority and evidence

- ADR-0037 owns active-v2 Claim and lease semantics; ADR-0041 owns immutable consented instruction
  propagation into the Connector safety boundary.
- Mechanism 03 owns the outbound Connector transport contract, and TASK-029 separately owns the
  absent default Host-effect-to-acknowledgement composition.
- Registry readback on 2026-09-03 returned version `0.2.20`, the full `gitHead` above, integrity
  `sha512-bOLfKdrW91x8qVNIMDxTGWHKYldMld+y0OohdChTfGi0MLINg50q4d0FFQfSFyK0WDluU9nu+WyIi80UqSAfBA==`,
  and publication time `2026-09-03T04:45:38.009Z`.
- The immutable registry tarball's bundled
  `@webmcp-challenge/reentry-core/src/local-connector-client.mjs` omits `instruction` from its exact
  continuation fields; current `reentry-core` includes and validates it.
- Active v2 `delivery.service.ts` derives `instruction` from the stored validated Manifest and
  includes it in every claimed lease.
- The PM-approved `CONNECTOR-V2-E2E-001` run used the current checkout, not a clean registry install.

## 3. Scope

Select and isolate the exact Connector and bundled Core source, assign a new immutable package
version, verify the packed files and provenance, install the tarball into a clean consumer, and run
the current active-v2 Claim plus coordinated local integration at the exact intended source. Consume
the accepted TASK-026 pairing contract, including its route/version policy and strict
`pairing_id`-plus-code request shape, before claiming the Connector release is compatible. Update all
active install guides to name only an artifact proven compatible with that contract.

## 4. Non-goals

- publishing, committing, pushing, deploying, or changing production code inside this audit;
- overwriting or republishing immutable version `0.2.20`;
- treating package installation, claim acceptance, adapter dispatch, or process exit as Host-effect
  proof or delivery acknowledgement;
- folding TASK-029's product effect-authority decision into a package-release repair;
- claiming production, external Browser/WebMCP, or cross-machine verification from a local package
  test; or
- deleting the registry artifact or historical release evidence.

## 5. Verification and closure

Close only when the new registry version resolves to the exact reviewed commit; that commit contains
the same package version and bundled Core source as the tarball; the tarball accepts and preserves a
valid active-v2 instruction-bearing lease while rejecting malformed instruction; the fixed adapter
safety frame remains present; a clean install passes Node 24 package tests and the current active-v2
Claim/full-chain scope; the client submits the accepted TASK-026 pairing fields and rejects the old
body according to the recorded route policy; and registry integrity, `gitHead`, install guidance,
and residual TASK-029 boundary are recorded. Publication requires separate owner authorization.

## 5.1 Current checkout artifact recheck — 2026-09-04

The current project checkout was verified without changing its version or publishing an artifact.
`cd runtime/local-connector && npm run verify` passed syntax for 36 modules and 61 discovered tests
(`49` passed, `0` failed, `12` opt-in active-v2 tests skipped without a disposable Cloud database).
`npm pack --json --pack-destination <temporary-directory>` produced
`4xeoz-re-entry-0.2.20.tgz`; a clean temporary consumer installed that tarball with scripts
disabled. The installed package reported name `@4xeoz/re-entry`, version `0.2.20`, loaded all root
exports, and contained the bundled Core client with both the `continuation.instruction` field and
its `requireInstruction(value.instruction)` validation.

This proves the current checkout can produce a self-contained instruction-compatible local artifact.
It does not repair the immutable registry `0.2.20` provenance mismatch, assign a new release
version, prove registry integrity, or close the TASK-026 hosted claim gate. No publish, commit,
push, deployment, or production effect was performed. The next gate remains an approved exact-source
new immutable version, followed by clean-consumer and active-v2 Claim/full-chain verification before
any separately authorized publication.

## 6. Reopen condition

Reopen if the registry tag, `gitHead`, package version, bundle contents, active Receiver response,
instruction validation, safety frame, clean-consumer result, pairing contract or route policy, or
install guide diverges.
