# CP-14 Host SDK Package Provenance Readback

**Status:** VERIFIED HISTORICAL STATIC READBACK; V0.2 HOST SDK GATE OPEN FOR HOSTED RELEASE  
**Date:** 2026-09-04  
**Task:** [`SK-TASK-076`](../Tasks/SK-TASK-076-cp14-cloud-receiver-v2-game-adaptation.md)  
**Evidence:** [`SK-EVID-075`](../Evidence/SK-EVID-075-cp14-host-sdk-package-provenance-readback.md)  
**Decision:** [`ADR-GAME-0038`](../Decisions/ADR-GAME-0038-cp14-merged-source-and-runtime-adaptation-boundary.md)

## Audit question

This audit is a time-stamped package snapshot. The later team-owned standing implementation and
Receiver composition seam are recorded in `TASK-036`, `SK-EVID-078`, and `SK-EVID-079`; they do not
retroactively change the package identities read here.

Which SDK is available to the Game, where is it located, and does the public package support the
accepted recurring protocol-v0.2 standing integration?

## Findings

| Surface | Verified readback | CP-14 implication |
| --- | --- | --- |
| Merged checkout | `runtime/host-sdk/package.json` is `@4xeoz/re-entry-sdk@0.3.1`; its server implementation signs and sends v0.1 Events and exposes v0.1 control routes. | This is the Game-facing source baseline, but its current public server API is not standing-v0.2. |
| NPM registry | `@4xeoz/re-entry-sdk@0.3.2` is `latest`, with `gitHead=928debcbe6ed8fda9d165ac17318fd30a57f0361`; a clean tarball import exposes `createHostSdk` and `createReentry` but no standing API. | NPM is real and public, but `latest` must not be assumed to match the checkout or recurring standing semantics. |
| Private Core reference | `reentry-core` exports `StandingReentryHostSdk` and standing protocol helpers. | Reference signing is available for contract evidence; direct Game use would be a new dependency boundary and is not silently substituted. |
| Receiver (at the snapshot date) | Active `saas-boilerplate` routes exposed `/v0.2/events`, `/v0.2/delivery-claims`, and `/v0.2/delivery-acknowledgements`; standing Consent enrollment was not a public route in that source identity. | That historical readback cannot complete a Game standing binding or full trace; use the current TASK-036 candidate and hosted gate for present behavior. |

## Cross-functional impact

- A local Game signal is not a v0.1/v0.2 wire Event. The adapter still needs a server-only mapper,
  durable binding/sequence context, and exact protocol signing.
- Installing NPM `latest` would provide a v0.1 Host SDK. Using it for recurring signals would either
  exhaust a one-shot Grant or require an undocumented downgrade.
- Importing the private Core standing signer directly would bypass the accepted Host SDK package
  boundary and still would not solve Receiver-owned Consent enrollment.
- The existing Game publication lease remains separate from any Receiver delivery lease. No local
  stub result is upgraded by this readback.

## Decision and next gate

The readback closes the “where is the SDK?” question but leaves the behavior gate open. CP-14 should
wait for an exact standing-capable Host SDK artifact and accepted Receiver enrollment contract before
the Game adapter Red test. The local `ReentryDeliveryPort` and labelled transport stub remain the
current verified boundary.

## Claim limits

This audit proves package/source topology only. It does not prove dependency installation in the Game,
signed Event acceptance, binding creation, Connector claim, Agent wake, WebMCP invocation, Host effect,
acknowledgement, hosted continuity, or hackathon judge reproduction.
