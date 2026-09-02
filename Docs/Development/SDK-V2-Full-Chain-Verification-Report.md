# SDK v2 Full-Chain Verification Report

**Date:** 2026-09-02  
**Owner:** SDK development team  
**Status:** `verification_pending` — the ACK-003 mapping and component gates are green, but the full chain and package release remain open pending a clean Cloud SHA, real browser/runtime evidence, and npm authentication.

## 1. What was built

- Kept SDK production code unchanged in this increment. The shared root worktree currently has
  separate uncommitted edits in `runtime/host-sdk/src/client.mjs`, `src/next.mjs`, and
  `src/server.mjs`; those edits are outside this evidence increment, were not staged by the SDK
  work, and were not modified.
- Verified the existing Host-side SDK integration for Host-key registration, Consent sessions,
  Consent status, browser handoff, signed Event ingress, and `sendEvent()` acceptance.
- Prepared the SDK-to-Receiver contract matrix covering Host setup, Event ingress, Claim, lease,
  Host-effect verification, acknowledgement, replay, timing, durable state, and secret boundaries.
- Added the isolated SDK-owned `SDK-V2-E2E-001` contract test for the complete Host-key, Consent,
  browser handoff, signed Event, Claim/lease, effect-authority, acknowledgement, durable-state, and
  replay sequence. It is explicitly gated until the approved mapping flag, exact counterpart SHAs,
  and effect-authority/runtime prerequisites are available.
- Added the detailed integration document:
  [SDK-005](SDK-005-cloud-receiver-v2-full-chain-contract.md).
- Added and updated the tracking record:
  [TASK-022](../Tasks/TASK-022-prepare-sdk-v2-full-chain-integration.md).
- Added no polling, fallback route, alternate transport, public Grant inspection/revocation, or
  response coercion.

## 2. Tests passed and failed

All tests below used Cloud Receiver commit `300bce02` unless stated otherwise.

| Test group | Result |
|---|---:|
| `SDK-V2-001`–`SDK-V2-004` Host-key, Consent, status, browser handoff | **4/4 passed** |
| `SDK-V2-EVENT-001`–`SDK-V2-EVENT-007` signed Event contract | **7/7 passed** |
| `CONNECTOR-V2-CLAIM-001`–`CONNECTOR-V2-CLAIM-005` Claim/lease contract | **5/5 passed** |
| Cloud Feature 5 acknowledgement tests | **5/5 passed** |
| Cloud Feature 6 HTTP/operations tests | **5/5 passed** |
| Received Local Connector ACK matrix after mapping decision | **5/5 passed** on Local test commit `4b821515` |
| Normal SDK suite | **18/18 passed** against the current shared working tree; the separate source edits noted above are not part of this evidence increment |
| Normal Local Connector clean-counterpart baseline | **34/34 executed passed; 10 opt-in tests skipped** |
| Current shared-tree Local Connector aggregate | **34/45 passed; 11 opt-in tests skipped** (includes a collaborator E2E gate; not clean-counterpart evidence) |
| Prepared SDK full-chain gate `SDK-V2-E2E-001` | **Syntax passed; 1 gated test skipped; not run** because Cloud has no clean final SHA yet |
| SDK package release checks | `npm pack --dry-run` passed with 21 files; `npm whoami` returned `401 Unauthorized`; no publish attempted |
| SDK validators and sensitive-data scans | **6/6 validator tests; 3/3 sensitive-scan tests; sensitive-pattern scan passed** |
| Repository validation | **Blocked by one pre-existing collaborator-owned finding: LOCAL-001 has no H1** |

Commands used for the final focused runs:

```sh
CLOUD_RECEIVER_V2_CONTRACT=1 CLOUD_RECEIVER_V2_ROOT=/Users/mac/Desktop/OpenAI-Web-MCP-Challenge/saas-boilerplate \
  DATABASE_URL=postgresql://mac@127.0.0.1:55440/sdk_receiver_300bce_sdk \
  CLOUD_RECEIVER_RUNTIME_DATABASE_URL= DIRECT_URL= NODE_ENV=test \
  node --test runtime/host-sdk/test/cloud-receiver-v2.contract.mjs
CLOUD_RECEIVER_V2_EVENT_CONTRACT=1 CLOUD_RECEIVER_V2_ROOT=/Users/mac/Desktop/OpenAI-Web-MCP-Challenge/saas-boilerplate \
  DATABASE_URL=postgresql://mac@127.0.0.1:55440/sdk_receiver_300bce_event \
  CLOUD_RECEIVER_RUNTIME_DATABASE_URL= DIRECT_URL= NODE_ENV=test \
  node --test runtime/host-sdk/test/cloud-receiver-v2.event.contract.mjs
CLOUD_RECEIVER_V2_CLAIM_CONTRACT=1 CLOUD_RECEIVER_V2_ROOT=/Users/mac/Desktop/OpenAI-Web-MCP-Challenge/saas-boilerplate \
  DATABASE_URL=postgresql://mac@127.0.0.1:55440/sdk_receiver_300bce_claim \
  CLOUD_RECEIVER_RUNTIME_DATABASE_URL= DIRECT_URL= NODE_ENV=test \
  node --test runtime/local-connector/test/cloud-receiver-v2-claim.contract.mjs
CLOUD_RECEIVER_V2_ACK_CONTRACT=1 CLOUD_RECEIVER_V2_ROOT=/Users/mac/Desktop/OpenAI-Web-MCP-Challenge/saas-boilerplate \
  DATABASE_URL=postgresql://mac@127.0.0.1:55440/sdk_receiver_300bce_ack \
  CLOUD_RECEIVER_RUNTIME_DATABASE_URL= DIRECT_URL= NODE_ENV=test \
  node --test runtime/local-connector/test/cloud-receiver-v2-ack.contract.mjs
DATABASE_URL=postgresql://mac@127.0.0.1:55440/sdk_receiver_300bce_http \
  CLOUD_RECEIVER_RUNTIME_DATABASE_URL= DIRECT_URL= NODE_ENV=test \
  npm --prefix /Users/mac/Desktop/OpenAI-Web-MCP-Challenge/saas-boilerplate/backend test -- --runInBand \
  src/modules/acknowledgements/test/acknowledgement.test.ts \
  src/modules/system-health/test/http.test.ts
cd /Users/mac/Desktop/OpenAI-Web-MCP-Challenge/runtime/host-sdk && npm run verify
cd /Users/mac/Desktop/OpenAI-Web-MCP-Challenge/runtime/local-connector && npm run verify
cd /Users/mac/Desktop/OpenAI-Web-MCP-Challenge/runtime/host-sdk && node --check test/cloud-receiver-v2.full-chain.contract.mjs
cd /Users/mac/Desktop/OpenAI-Web-MCP-Challenge/runtime/host-sdk && node --test test/cloud-receiver-v2.full-chain.contract.mjs
cd /Users/mac/Desktop/OpenAI-Web-MCP-Challenge && python3 scripts/test_validators.py
cd /Users/mac/Desktop/OpenAI-Web-MCP-Challenge && python3 scripts/test_sensitive_scan.py
cd /Users/mac/Desktop/OpenAI-Web-MCP-Challenge && python3 scripts/validate_repository.py --root .
cd /Users/mac/Desktop/OpenAI-Web-MCP-Challenge && python3 scripts/scan_sensitive_patterns.py --root .
```

These are the final command forms; the two Local Connector commands required permitted loopback
access. The SDK and Connector contract commands used the exact Cloud checkout path and separate
fresh database URLs. The test runs used Node.js `v26.8.1`, npm `11.19.0`, and PostgreSQL `14.18`.
The full-chain command is intentionally gated on the now-approved ACK-003 mapping, exact clean
Cloud/Local counterpart SHAs, fresh PostgreSQL, and the effect-authority/runtime prerequisites; it
reported `1` skipped test and was not executed against the Receiver.

The exact pre-decision red ACK-003 command was also run against fresh database
`sdk_receiver_300bce_ack_red_20260902` and returned exit `1`, with `0` passed and `1` failed. The
observed response was `403 host_effect_invalid`; the received test expects
`403 host_effect_time_invalid`. Durable Delivery state remained leased and unchanged.

After the project-manager decision, the received ACK matrix was rerun against fresh database
`sdk_receiver_300bce_ack_green_20260902` and Local test commit `4b821515`; exit `0`, `5` passed,
`0` failed, `0` skipped.

The SDK-owned Task Control validation passes. The normal SDK suite ran against the current shared
working tree; no source edit from this increment was included. The full repository validator currently reports only
the pre-existing collaborator-owned `Docs/Development/LOCAL-001-cloud-receiver-v2-claim-ack-integration.md`
finding (`expected one H1, found 0`); the SDK team did not modify that file.

Received Local Connector acknowledgement results: `ACK-001` through `ACK-005` passed **5/5** after
the approved mapping. The historical pre-decision mismatch is retained below for traceability.

The required combined flow was not run:

```text
Host SDK -> Cloud Receiver -> Local Connector -> Host effect -> acknowledgement
```

No whole-system completion claim is made.

## 3. Exact commit SHA

- Previous finalized verification-report commit: `e1beae65019ad85af120ee5126d45df48407ea5f`.
- Root evidence-closure HEAD readback before the current mapping update: `6ebb421cc7c30320627a6e15303ce5b2c80a5514` on
  `codex/eyad-reentry-core-foundation`. The root worktree remains dirty with pre-existing
  collaborator changes; no push or deployment is claimed.
- Root remote readback at that check: `77c9cbcd7d2dbb71ba62308c0b3a5e0e47805dac`. The local
  branch was 35 commits ahead at the readback; no push or deployment is claimed here.
- SDK production-code baseline: `77c9cbcd7d2dbb71ba62308c0b3a5e0e47805dac`, the last commit
  touching `runtime/host-sdk/src` before this evidence increment. SDK production code is unchanged.
- Cloud Receiver exact test checkout: `300bce02e6a6f9b643a6de95a3596691304749b7`.
- Cloud Receiver remote readback: `b851c320fae0505e3cf098f979d149e04ab44310`. The Cloud checkout
  was clean at the historical readback and three commits ahead of its remote; it is local-only
  evidence, not deployed evidence. The current Cloud worktree is dirty.
- SDK evidence update: `99def9f392db041c19741ea52593a79db9415c4c`.
- SDK evidence-index update: `0b32eac2c6ee81aa67495ea56b2f721ca92069ad`.
- SDK-owned full-chain test prepared in this increment:
  `runtime/host-sdk/test/cloud-receiver-v2.full-chain.contract.mjs`.
- SDK full-chain test/evidence increment commit: `315c2a3c473e85365adaea5927a40e9a6a10062e`.
- Latest report-clarification commit at the evidence-closure readback:
  `c1e84f79b6a4e3fe369cd0abb145b0c2d19ceb9e`.
- SDK mapping-evidence update commit: `6ebb421cc7c30320627a6e15303ce5b2c80a5514`.
- The subsequent report-metadata commit is `d8f74af9241a93cdd31f53209369c0c72aadd3ca`.
  It also contains six pre-existing staged collaborator-file changes from the shared index; the
  SDK team did not edit those files, and no SDK production source changed.
- Initial verification report commit: `3d90820dda3ea327d5324d8baf478628d768aad1`.
- Verification-report link commit: `2233c5214fae2a23908d4f36c6757f7440169ac5`.
- Local Connector acknowledgement test harness: `ac62e724a010b855df8494ec6f57c071f614212d`.
- Local Connector post-decision ACK test commit: `4b8215156d814551f8da06dad16319deaff549d7`.
- Local Connector source/test integration counterpart: `81e51a6b2299fa1f63c2b06180febebaab9ded04`.
- Cloud was clean at the historical tested SHA; the current Cloud worktree is dirty in frontend
  dashboard/pairing files and is not yet an exact clean release counterpart.

## 4. Runtime and database evidence

- Node.js: `v26.8.1`.
- npm: `11.19.0`.
- PostgreSQL: `14.18`, `127.0.0.1:55440`.
- Fresh disposable databases:
  `sdk_receiver_300bce_sdk`, `sdk_receiver_300bce_event`,
  `sdk_receiver_300bce_claim`, `sdk_receiver_300bce_ack`,
  `sdk_receiver_300bce_ack_green_20260902`, and
  `sdk_receiver_300bce_http`.
- Six migrations were applied to each database: auth, pairing, Consent/targeting, signed Event
  ingress, delivery claim/lease, and delivery acknowledgement.
- Prisma Client was regenerated from the exact Cloud checkout and the Cloud backend build passed.
- The disposable PostgreSQL process is currently running for the Cloud-side gate and must be
  stopped before SDK closure.
- `python3 scripts/test_sensitive_scan.py` passed `3/3`; `python3 scripts/scan_sensitive_patterns.py
  --root .` reported no high-confidence sensitive patterns. The report and committed evidence use
  synthetic identifiers/redacted values; no raw organization keys, Connector tokens, lease tokens,
  or effect tokens were persisted.

## 5. Required changes from the other teams

1. **Cloud Receiver owner** — commit the replacement dashboard/pairing work, provide an exact clean
   tested SHA, and return runtime/health/readiness and database evidence. Current Cloud HEAD is
   `300bce02`; its worktree is dirty.
2. **Local Connector owner** — preserve the clean post-decision ACK counterpart
   `4b8215156d814551f8da06dad16319deaff549d7` and provide any required remote readback for E2E.
3. **Cloud Receiver, Local Connector, and SDK integration owners** — provide a configured
   independent Host-effect authority and run SDK-005 E2E-001 with real browser/runtime evidence,
   durable state assertions, and identical acknowledgement replay.
4. **Release owner** — restore npm registry authentication (`npm whoami` currently returns `401`)
   before any publication decision. No publish was attempted.

## 6. Integration test document

The complete SDK-to-Receiver integration-test document is
[SDK-005](SDK-005-cloud-receiver-v2-full-chain-contract.md). It contains:

- exact HTTP requests and successful response envelopes;
- bounded error status/code expectations;
- duplicate and replay behavior;
- lease, Grant, revocation, and timing rules;
- durable PostgreSQL assertions;
- organization-key, Host-key, Connector-token, lease-token, and effect-token boundaries; and
- exact commands for the SDK and received Claim/Acknowledgement/HTTP matrices.
- `SDK-V2-E2E-001` is prepared at
  [`cloud-receiver-v2.full-chain.contract.mjs`](../../runtime/host-sdk/test/cloud-receiver-v2.full-chain.contract.mjs);
  its execution is gated on the approved mapping flag, exact counterpart SHAs, real browser/runtime
  reachability, fresh PostgreSQL, and an independent Host-effect authority.

## 7. Any unresolved mismatch

The ACK-003 protocol mismatch is resolved by the project-manager decision and the Local `5/5`
rerun: `host_effect_invalid` covers malformed/far-future normalization, while
`host_effect_time_invalid` covers a normalized effect outside the valid lease/Grant/revocation
window. Remaining unresolved release blockers are the dirty Cloud worktree/no exact clean SHA,
unverified real browser/runtime reachability for the full chain, and npm registry authentication
(`401 Unauthorized`). The combined flow and publication remain unclaimed.
