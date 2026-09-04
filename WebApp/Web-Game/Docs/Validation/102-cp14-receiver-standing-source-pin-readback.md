# CP-14 Receiver Standing Source-Pin Readback

**Status:** VERIFIED SOURCE-PIN READBACK; RELEASE AND HOST SDK GATES OPEN  
**Date:** 2026-09-04  
**Task:** [`SK-TASK-076`](../Tasks/SK-TASK-076-cp14-cloud-receiver-v2-game-adaptation.md)  
**Evidence:** [`SK-EVID-076`](../Evidence/SK-EVID-076-cp14-receiver-standing-source-pin-readback.md)  
**Decision:** [`ADR-GAME-0038`](../Decisions/ADR-GAME-0038-cp14-merged-source-and-runtime-adaptation-boundary.md)

## Audit question

Does the selected Receiver candidate bind its standing-v0.2 conformance harness to one exact Core
source and reject source drift before runtime loading?

## Findings

| Surface | Verified readback | CP-14 implication |
| --- | --- | --- |
| Receiver ref | `saas-boilerplate` `Re-Entry` is clean at `0195a9846024c4f65c62d3922069970ad1b96b92`, also read back as `origin/Re-Entry`. | This is an attributable external candidate, not a Game merge or deployment promotion. |
| Fixed Core pin | `backend/conformance/standing-v0.2/core-pin.json` selects `1446d73aa3e66533547471728ad8fa5344d51f9e`. | The Receiver harness names a precise Core source instead of silently using a moving checkout. |
| Source verifier | Pinned verification returned `source_identity_verified: true` and SHA-256 `6210d7724417e0533c77d5989e8ffdd3c404af4063ac9d70d70db9b622f73d45`; `verifyUnchanged()` passed. | Source identity and post-run drift are fenced before the conformance runtime. |
| Negative vectors | The source-pin suite passed 16/16, including missing, floating, mismatched, modified, injected, symlink, and post-run mutation cases. | The harness is suitable as a handoff integrity check, but it is not release conformance. |
| Package boundary | The public `@4xeoz/re-entry-sdk` readback in [`SK-EVID-075`](../Evidence/SK-EVID-075-cp14-host-sdk-package-provenance-readback.md) remains v0.1-only on the reviewed server surface. | Receiver source identity does not close the standing-capable Host SDK or Game adapter gate. |

## Cross-functional impact

- The Receiver and Core can be compared against one immutable source identity, reducing protocol drift
  risk before a Game request is sent.
- The pinned harness is test-only and does not expose a public Consent/enrollment route or an
  installable standing Host API; importing the private Core signer directly into Game would still
  bypass the accepted package boundary.
- A clean external branch, source pin, or passing negative-vector suite cannot establish endpoint,
  deployment, persistence, Connector, Agent, browser-session, or Host-effect claims.

## Decision and next gate

Accept this as a supporting handoff-integrity result only. Keep `SK-TASK-076` pending. The next
implementation gate remains an exact external package/source packet containing a standing-capable
Host SDK, Connector compatibility, accepted Consent/session enrollment, and executable positive/
negative Event exchange against the designated Receiver ref.

## Claim limits

This audit is static/contract evidence at the source identity boundary. No Receiver database,
deployed endpoint, browser, Agent, Game adapter, or hosted trace was executed here.
