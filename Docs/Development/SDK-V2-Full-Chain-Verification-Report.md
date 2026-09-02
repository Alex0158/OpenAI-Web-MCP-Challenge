# SDK v2 Full-Chain Verification Report

**Date:** 2026-09-02  
**Owner:** SDK development team  
**Status:** `verification_pending` — the SDK and Cloud Feature 4–6 evidence is recorded, but the full chain remains open because of one acknowledgement contract mismatch.

## 1. What was built

- Kept SDK production code unchanged.
- Verified the existing Host-side SDK integration for Host-key registration, Consent sessions,
  Consent status, browser handoff, signed Event ingress, and `sendEvent()` acceptance.
- Prepared the SDK-to-Receiver contract matrix covering Host setup, Event ingress, Claim, lease,
  Host-effect verification, acknowledgement, replay, timing, durable state, and secret boundaries.
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
| Normal SDK suite | **18/18 passed** |
| Normal Local Connector suite | **34/34 executed passed; 10 opt-in tests skipped** |
| Repository validators and sensitive-data scans | **Passed** |

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
```

These are the final command forms; the two Local Connector commands required permitted loopback
access. The SDK and Connector contract commands used the exact Cloud checkout path and separate
fresh database URLs.

Received Local Connector acknowledgement results:

- `ACK-001`, `ACK-002`, `ACK-004`, and `ACK-005`: passed.
- `ACK-003`: failed on the exact error-code mismatch documented below.
- Overall received acknowledgement matrix: **4/5 passed**.

The required combined flow was not run:

```text
Host SDK -> Cloud Receiver -> Local Connector -> Host effect -> acknowledgement
```

No whole-system completion claim is made.

## 3. Exact commit SHA

### Commits

- Cloud Receiver exact test checkout: `300bce02e6a6f9b643a6de95a3596691304749b7`.
- Cloud Receiver remote readback: `b851c320fae0505e3cf098f979d149e04ab44310`.
  The Cloud checkout is clean and three commits ahead of its remote; it is local-only evidence,
  not deployed evidence.
- SDK evidence update: `99def9f392db041c19741ea52593a79db9415c4c`.
- SDK evidence-index update: `0b32eac2c6ee81aa67495ea56b2f721ca92069ad`.
- Verification report commit: `3d90820dda3ea327d5324d8baf478628d768aad1`.
- Verification-report link commit: `2233c5214fae2a23908d4f36c6757f7440169ac5`.
- Local Connector acknowledgement test harness: `ac62e724a010b855df8494ec6f57c071f614212d`.
- Root SDK branch HEAD before this report revision: `2233c5214fae2a23908d4f36c6757f7440169ac5` on
  `codex/eyad-reentry-core-foundation`. The root worktree contains pre-existing collaborator
  changes; these report commits do not include them. The Cloud worktree itself is clean.

## 4. Runtime and database evidence

- Node.js: `v26.8.1`.
- npm: `11.19.0`.
- PostgreSQL: `14.18`, `127.0.0.1:55440`.
- Fresh disposable databases:
  `sdk_receiver_300bce_sdk`, `sdk_receiver_300bce_event`,
  `sdk_receiver_300bce_claim`, `sdk_receiver_300bce_ack`, and
  `sdk_receiver_300bce_http`.
- Six migrations were applied to each database: auth, pairing, Consent/targeting, signed Event
  ingress, delivery claim/lease, and delivery acknowledgement.
- Prisma Client was regenerated from the exact Cloud checkout and the Cloud backend build passed.
- The disposable PostgreSQL process was stopped after verification.

## 5. Required changes from the other teams

1. Cloud Receiver and Local Connector owners must reconcile the `ACK-003` future-effect error code
   against `reentry-core/` and ADR-0038. Do not weaken or bypass the received test.
2. Cloud must provide the exact pushed/read-back SHA for Features 5–6, or explicitly identify the
   local-only status of `300bce02`.
3. Local Connector must provide the exact clean commit used for acknowledgement integration and
   rerun `ACK-001`–`ACK-005` after the contract decision.
4. The teams must provide a configured test Host-effect authority and run the combined flow with
   durable database assertions and identical acknowledgement replay.

No SDK production change is required for the current mismatch.

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

## 7. Any unresolved mismatch

`CONNECTOR-V2-ACK-003` sends a future Host-effect attestation.

- Received Local Connector contract expects: `403 host_effect_time_invalid`.
- Cloud Receiver `300bce02` returns: `403 host_effect_invalid`.
- `reentry-core/src/receiver-delivery.mjs` classifies a future `confirmed_at` as
  `host_effect_time_invalid`.
- Cloud’s own Feature 5 test expects `host_effect_invalid` for the future case.
- ADR-0038 reserves `host_effect_invalid` for invalid effect-authority output.

This is an unresolved protocol/test-authority conflict. The task stays open until the project
manager and owning teams select the authoritative mapping, align the implementation/tests, rerun
the acknowledgement matrix, and pass the combined flow.
