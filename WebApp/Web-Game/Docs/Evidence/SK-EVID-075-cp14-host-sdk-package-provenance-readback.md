# SK-EVID-075: CP-14 Host SDK Package and Standing Protocol Readback

- Evidence ID: `SK-EVID-075`
- Evidence class: `static`
- Date: 2026-09-04
- Status: Historical package readback; current local implementation is tracked by `TASK-036` and
  `SK-EVID-078`/`SK-EVID-079`.
- Task: [`SK-TASK-076`](../Tasks/SK-TASK-076-cp14-cloud-receiver-v2-game-adaptation.md)
- Decision: [`ADR-GAME-0038`](../Decisions/ADR-GAME-0038-cp14-merged-source-and-runtime-adaptation-boundary.md)
- Audit: [`Validation/101`](../Validation/101-cp14-host-sdk-package-provenance-readback.md)

## Question

This record preserves the package state observed at the time of the probe. It must not be used to
describe the later team-owned standing implementation increment; the observations and claim limits
below remain valid only for the exact source/package identities named here.

Identify the SDK artifact the Game can consume and determine whether its public package surface
supports the accepted recurring protocol-v0.2 standing path.

## Source and runtime identity

- Repository root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge`.
- Outer branch: `main` at local commit `251b07a`; the source package files have unrelated
  collaborator worktree edits and were not changed by this probe.
- Local Host SDK manifest: `runtime/host-sdk/package.json`, package `@4xeoz/re-entry-sdk@0.3.1`.
- Local Core manifest: `reentry-core/package.json`, private package
  `@webmcp-challenge/reentry-core@0.1.0`.
- Registry Host SDK readback: `@4xeoz/re-entry-sdk@0.3.2`, `gitHead=928debcbe6ed8fda9d165ac17318fd30a57f0361`,
  integrity `sha512-daDtb2CRxkFxDMyvF374U67vWY5FwOUFo5wY0LizaPtlKT0RAS7di59kvju93ctYQAU7H5bbZjoKj9vzMY+Thg==`.
- Registry Connector readback: `@4xeoz/re-entry@0.2.20` remains a separate Local Connector release;
  it is not a Game dependency.

## Executed readback

1. `cat runtime/host-sdk/package.json` confirmed the checkout package, public exports
   `./server`, `./client`, and `./next`, and its bundled local Core dependency.
2. `npm view @4xeoz/re-entry-sdk version dist-tags gitHead --json` returned `latest=0.3.2` and the
   GitHub `gitHead` above.
3. `npm pack @4xeoz/re-entry-sdk@0.3.2 --pack-destination /tmp/reentry-sdk-registry-inspect-20260904`
   produced a self-contained tarball with `src/server.mjs`, `src/client.mjs`, `src/next.mjs`, and
   bundled Core source.
4. A clean import of the extracted registry server module reported exactly
   `HOST_SDK_CONTROL_ROUTES`, `HostSdkTransportError`, `ReentryFacadeError`, `createHostSdk`, and
   `createReentry`; no standing-named export was present.
5. `rg` over the local and extracted server modules found only v0.1 Receiver routes for the Host SDK.
   The local Core separately exports `StandingReentryHostSdk` and standing protocol helpers.
6. The active Receiver source readback exposes `/v0.2/events`, `/v0.2/delivery-claims`, and
   `/v0.2/delivery-acknowledgements`; its standing Consent enrollment remains service-only rather
   than a public Host SDK route.

## Result

**Verified:** NPM is a real public release surface for the v0.1 Host SDK, and the current checkout
contains the merged Game-facing Host SDK source. Neither surface is a public standing-v0.2 Host SDK
API. The Core standing signer is a reference implementation, not an automatically approved Game
dependency.

## Claim boundary and next gate

This evidence supports source/package discovery and identifies the CP-14 compatibility gap. It does
not prove Game adapter behavior, Receiver enrollment, Event acceptance, Connector claim, Agent
activation, page access, effect acknowledgement, hosted continuity, or judge reproduction.

The next gate is one of:

1. an exact, versioned `@4xeoz/re-entry-sdk` release that exposes the accepted standing Host API and
   matches the Receiver contract; or
2. an explicit outer decision authorizing a different Game-owned adapter boundary with a public
   standing enrollment contract.

Until that gate closes, `SK-TASK-076` remains pending and the verified local port/stub remains the
   honest Game transport boundary.
