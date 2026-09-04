# SK-EVID-076: CP-14 Receiver Standing Source-Pin Handoff Readback

- Evidence ID: `SK-EVID-076`
- Evidence class: `static` and `contract`
- Date: 2026-09-04
- Task: [`SK-TASK-076`](../Tasks/SK-TASK-076-cp14-cloud-receiver-v2-game-adaptation.md)
- Decision: [`ADR-GAME-0038`](../Decisions/ADR-GAME-0038-cp14-merged-source-and-runtime-adaptation-boundary.md)
- Audit: [`Validation/102`](../Validation/102-cp14-receiver-standing-source-pin-readback.md)

## Question

Determine whether the selected Receiver candidate identifies one exact standing-v0.2 Core source and
enforces that identity before loading its runtime or creating database state.

## Source and runtime identity

- Receiver checkout: `saas-boilerplate`, branch `Re-Entry`, local and `origin/Re-Entry` at
  `0195a9846024c4f65c62d3922069970ad1b96b92` (`feat(receiver): add pairing claim abuse fence`).
- Receiver worktree status: clean at readback time. This branch is an external candidate and is not
  an accepted Game source or deployment promotion.
- Fixed Receiver pin: `backend/conformance/standing-v0.2/core-pin.json` selects Core commit
  `1446d73aa3e66533547471728ad8fa5344d51f9e`.
- Pinned Core identity: source SHA-256
  `6210d7724417e0533c77d5989e8ffdd3c404af4063ac9d70d70db9b622f73d45`.
- Runtime: Node `v26.5.0`. The readback used the retained detached Core checkout at the exact pinned
  commit and did not use the dirty outer Game checkout as the pinned source.

## Executed readback

1. `node --test backend/conformance/standing-v0.2/source-pin.test.mjs` passed **16/16**. The suite
   exercises missing, floating, unavailable, mismatched, modified, injected, symlinked, and
   post-run-mutated source/pin cases, plus the explicit non-release development mode.
2. `verifyConformanceSource({ coreRoot: '/private/tmp/webmcp-core-pin.CLf4C2', receiverRoot: '.', mode: 'pinned' })`
   returned `source_identity_verified: true`, the pinned Core commit above, and the source hash above.
   Its post-run `verifyUnchanged()` check passed.
3. `git -C saas-boilerplate status --porcelain=v2` returned no changes, and the Receiver commit and
   fixed pin were read back directly from Git.

## Result

**Verified:** the selected Receiver candidate has a clean exact ref and a working pinned-source
fence. The fence verifies the Core/spec inventory and bytes before the conformance runtime proceeds;
it does not turn the candidate into a released or deployed Receiver.

## Claim boundary and next gate

This evidence supports source identity, drift rejection, and the existence of a test-only standing
v0.2 compatibility harness. It does not prove the public Host SDK has a standing API, Receiver
release conformance, public consent enrollment, database migration success, deployed endpoint
behavior, Event acceptance, Connector claim, Agent activation, page action, Host effect,
acknowledgement, hosted continuity, or judge reproduction.

The CP-14 handoff remains open until the external owner designates this exact Receiver ref (or a
newer exact ref), supplies a versioned installable standing-capable Host SDK and Connector artifact,
and publishes the accepted enrollment/session contract for the Game's server-only adapter.
