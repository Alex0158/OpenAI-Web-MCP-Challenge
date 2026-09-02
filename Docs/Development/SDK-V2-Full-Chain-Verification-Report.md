# SDK v2 Full-Chain Verification Report

**Date:** 2026-09-02  
**Owner:** SDK development team  
**Status:** `verification_pending` — the SDK, Cloud, Local Connector, and local full-chain contract gates are green against pinned commits; publication is blocked by npm authentication, and separately spawned production-style browser/Connector evidence is not claimed.

## 1. What was built

- Under the project-manager-authorized source-owner fix, completed the Host-side SDK integration
  surface for Host-key registration, Consent-session creation/status, browser handoff, and the
  Next.js route adapters. The signed Manifest/Event boundary and `sendEvent()` acceptance remain
  explicit SDK APIs.
- Added focused SDK tests for the Host, Consent, browser, Event, and Next.js surfaces. The
  production source change is isolated in SDK commit `1f308cfdcadc09b99aa16741ccc362542bc6f186`;
  no Cloud Receiver, Local Connector, Core, or protocol fallback was changed.
- Prepared the SDK-to-Receiver contract matrix covering Host setup, Event ingress, Claim, lease,
  Host-effect verification, acknowledgement, replay, timing, durable state, and secret boundaries.
- Added the isolated SDK-owned `SDK-V2-E2E-001` contract test for the complete Host-key, Consent,
  browser handoff, signed Event, Claim/lease, effect-authority, acknowledgement, durable-state, and
  replay sequence. It is pinned to exact counterpart SHAs and the approved ACK-003 mapping.
- Added the detailed integration document:
  [SDK-005](SDK-005-cloud-receiver-v2-full-chain-contract.md).
- Added and updated the tracking record:
  [TASK-022](../Tasks/TASK-022-prepare-sdk-v2-full-chain-integration.md).
- Added no polling, fallback route, alternate transport, public Grant inspection/revocation, or
  response coercion. Event `202` remains acceptance/continuation only; it is not a claim or
  acknowledgement.

## 2. Tests passed and failed

The final cross-repository runs used a disposable clean Cloud worktree at Receiver commit
`29cdfa4ab4af329d39af361fa3a0a1dc33eab919`, Local Connector test commit
`4b8215156d814551f8da06dad16319deaff549d7`, and fresh PostgreSQL databases. Historical `300bce02`
and `6f4b35fc` runs remain in the linked evidence documents for traceability.

| Test group | Result |
|---|---:|
| `SDK-V2-001`–`SDK-V2-004` Host-key, Consent, status, browser handoff | **4/4 passed** against clean Cloud `29cdfa4` |
| `SDK-V2-EVENT-001`–`SDK-V2-EVENT-007` signed Event contract | **7/7 passed** against clean Cloud `29cdfa4` |
| `CONNECTOR-V2-CLAIM-001`–`CONNECTOR-V2-CLAIM-005` Claim/lease contract | **5/5 passed** against built clean Cloud `29cdfa4` |
| `CONNECTOR-V2-ACK-001`–`CONNECTOR-V2-ACK-005` Acknowledgement contract | **5/5 passed** against clean Cloud `29cdfa4` |
| Cloud Receiver backend regression | **42/42 passed** across 11 suites after building the exact checkout |
| SDK full-chain gate `SDK-V2-E2E-001` | **1/1 passed** against clean Cloud `29cdfa4` and Local `4b821515` |
| Independent PM full-chain rerun | **1/1 passed** on `sdk_receiver_pm_full_chain_20260902_1` against the same pinned SHAs |
| Normal SDK suite | **18/18 passed** from SDK commit `1f308cfd` |
| SDK package dry-run | **Passed**, 21 files bundled in `@4xeoz/re-entry-sdk@0.3.0` |
| npm registry authentication | **Failed**, `npm whoami` returned `401 Unauthorized`; no publish attempted |
| Cloud backend first unbuilt attempt | **39/41 passed; 2 failed** because the clean worktree lacked generated `backend/dist`; rerun after `npm run build` passed 41/41, then final SHA `29cdfa4` passed 42/42 |
| Final-SHA Claim first attempt | **4/5 passed; `CLAIM-002` failed** because `backend/dist/index.js` was absent; after the exact checkout was built, the fresh-database rerun passed 5/5 |
| Separately spawned real browser approve/decline popup | **Not run**; local tests use the fake browser harness and real consent HTTP response |
| Separately spawned Local Connector process | **Not run**; `SDK-V2-E2E-001` uses the real Connector implementation in-process |
| SDK validators and sensitive-data scans | **6/6 validator tests; 3/3 sensitive-scan tests; sensitive-pattern scan passed** |
| Repository validation | **Passed** (`validate_repository.py --root .`) |

Commands used for the final focused runs:

```sh
CLOUD_RECEIVER_V2_CONTRACT=1 CLOUD_RECEIVER_V2_ROOT=/private/tmp/cloud-v2-release-29cdf \
  CLOUD_RECEIVER_V2_CLOUD_SHA=29cdfa4ab4af329d39af361fa3a0a1dc33eab919 \
  DATABASE_URL=postgresql://mac@127.0.0.1:55440/sdk_receiver_29cdf_host_20260902 \
  CLOUD_RECEIVER_RUNTIME_DATABASE_URL= DIRECT_URL= NODE_ENV=test \
  node --test runtime/host-sdk/test/cloud-receiver-v2.contract.mjs
CLOUD_RECEIVER_V2_EVENT_CONTRACT=1 CLOUD_RECEIVER_V2_ROOT=/private/tmp/cloud-v2-release-29cdf \
  CLOUD_RECEIVER_V2_CLOUD_SHA=29cdfa4ab4af329d39af361fa3a0a1dc33eab919 \
  DATABASE_URL=postgresql://mac@127.0.0.1:55440/sdk_receiver_29cdf_event_20260902 \
  CLOUD_RECEIVER_RUNTIME_DATABASE_URL= DIRECT_URL= NODE_ENV=test \
  node --test runtime/host-sdk/test/cloud-receiver-v2.event.contract.mjs
CLOUD_RECEIVER_V2_CLAIM_CONTRACT=1 CLOUD_RECEIVER_V2_ROOT=/private/tmp/cloud-v2-release-29cdf \
  DATABASE_URL=postgresql://mac@127.0.0.1:55440/sdk_receiver_29cdf_claim_built_20260902 \
  CLOUD_RECEIVER_RUNTIME_DATABASE_URL= DIRECT_URL= NODE_ENV=test \
  node --test runtime/local-connector/test/cloud-receiver-v2-claim.contract.mjs
CLOUD_RECEIVER_V2_ACK_CONTRACT=1 CLOUD_RECEIVER_V2_ROOT=/private/tmp/cloud-v2-release-29cdf \
  DATABASE_URL=postgresql://mac@127.0.0.1:55440/sdk_receiver_29cdf_ack_20260902 \
  CLOUD_RECEIVER_RUNTIME_DATABASE_URL= DIRECT_URL= NODE_ENV=test \
  node --test runtime/local-connector/test/cloud-receiver-v2-ack.contract.mjs
DATABASE_URL=postgresql://mac@127.0.0.1:55440/sdk_receiver_29cdf_cloud_built_20260902 \
  CLOUD_RECEIVER_RUNTIME_DATABASE_URL= DIRECT_URL= NODE_ENV=test \
  npm --prefix /private/tmp/cloud-v2-release-29cdf/backend test -- --runInBand
cd /private/tmp/sdk-v2-release.DkDWZl/runtime/host-sdk && npm run verify
CLOUD_RECEIVER_V2_FULL_CHAIN=1 CLOUD_RECEIVER_V2_ACK_MAPPING_APPROVED=1 \
  CLOUD_RECEIVER_V2_ROOT=/private/tmp/cloud-v2-release-29cdf \
  CLOUD_RECEIVER_V2_CLOUD_SHA=29cdfa4ab4af329d39af361fa3a0a1dc33eab919 \
  CLOUD_RECEIVER_V2_LOCAL_CONNECTOR_SHA=4b8215156d814551f8da06dad16319deaff549d7 \
  DATABASE_URL=postgresql://mac@127.0.0.1:55440/sdk_receiver_29cdf_e2e_20260902 \
  CLOUD_RECEIVER_RUNTIME_DATABASE_URL= DIRECT_URL= NODE_ENV=test \
  node --test /private/tmp/sdk-v2-release.DkDWZl/runtime/host-sdk/test/cloud-receiver-v2.full-chain.contract.mjs
cd /private/tmp/sdk-v2-release.DkDWZl/runtime/host-sdk && \
  npm_config_cache=/private/tmp/sdk-v2-npm-cache-20260902 npm pack --dry-run --json
cd /Users/mac/Desktop/OpenAI-Web-MCP-Challenge && python3 scripts/test_validators.py
cd /Users/mac/Desktop/OpenAI-Web-MCP-Challenge && python3 scripts/test_sensitive_scan.py
cd /Users/mac/Desktop/OpenAI-Web-MCP-Challenge && python3 scripts/validate_repository.py --root .
cd /Users/mac/Desktop/OpenAI-Web-MCP-Challenge && python3 scripts/scan_sensitive_patterns.py --root .
```

These final command forms used Node.js `v26.8.1`, npm `11.19.0`, and PostgreSQL `14.18` on
`127.0.0.1:55440`. The contract commands used the exact Cloud `29cdfa4` worktree and separate fresh
database URLs. The full-chain test was enabled with the approved ACK-003 mapping and exact Local
Connector SHA; it passed rather than skipping.

The exact pre-decision red ACK-003 command was also run against fresh database
`sdk_receiver_300bce_ack_red_20260902` and returned exit `1`, with `0` passed and `1` failed. The
observed response was `403 host_effect_invalid`; the received test expects
`403 host_effect_time_invalid`. Durable Delivery state remained leased and unchanged.

At the final Cloud SHA, the first Claim run failed only in `CONNECTOR-V2-CLAIM-002` with
`v2 Receiver did not become live within the restart test deadline`; the clean Cloud worktree had
no generated `backend/dist/index.js`. Building the exact checkout resolved that setup condition,
and the fresh-database rerun passed `5/5`. No SDK/Receiver response mismatch was observed.

After the project-manager decision, the received ACK matrix was rerun against fresh database
`sdk_receiver_300bce_ack_green_20260902` and Local test commit `4b821515`; exit `0`, `5` passed,
`0` failed, `0` skipped.

The SDK-owned Task Control validation passes. The normal SDK suite ran from the clean SDK worktree
at commit `1f308cfd`; it passed `18/18`. The repository validators and sensitive-data scans also
passed in the final read-only run; no SDK team change was made to collaborator-owned files.

Received Local Connector Claim and Acknowledgement results passed **5/5** each against the final
Cloud commit. The historical pre-decision mismatch is retained below for traceability.

An independent project-manager rerun also passed `1/1` on fresh database
`sdk_receiver_pm_full_chain_20260902_1` against the same Cloud and Local SHAs, including Receiver
restart and exact acknowledgement replay.

The required combined contract flow passed:

```text
Host SDK -> Cloud Receiver -> Local Connector -> Host effect -> acknowledgement
```

This is local contract evidence. It does not claim a deployed service or a separately spawned real
browser popup/Local Connector process.

## 3. Exact commit SHA

- SDK production/source commit: `1f308cfdcadc09b99aa16741ccc362542bc6f186` (`feat: add host consent integration APIs`).
- SDK full-chain test/evidence increment: `315c2a3c473e85365adaea5927a40e9a6a10062e`.
- Cloud Receiver final exact test commit: `29cdfa4ab4af329d39af361fa3a0a1dc33eab919`
  (`feat: add cloud receiver vercel handler`), tested from a clean detached worktree after
  `npm run build` and `npm run type-check`.
- Cloud Receiver parent feature commit: `6f4b35fc6cfb0d9a6a134a69264e5ebb4277a50a`.
- Cloud Receiver remote readback: `b851c320fae0505e3cf098f979d149e04ab44310`. The final Cloud
  commit is local-only and the nested `main` branch is five commits ahead of that remote; no push,
  deployment, or public-runtime claim is made.
- Local Connector acknowledgement test commit: `4b8215156d814551f8da06dad16319deaff549d7`.
- Local Connector source/test integration counterpart: `81e51a6b2299fa1f63c2b06180febebaab9ded04`.
- Root verification readback before this documentation writeback: `09ebd747766ab880562ed1c8e0d8ce7847dd1c81`
  on `codex/eyad-reentry-core-foundation`; the root worktree contains unrelated collaborator
  changes and is not represented as a clean release tree.

## 4. Runtime and database evidence

- Node.js: `v26.8.1`.
- npm: `11.19.0`.
- PostgreSQL: `14.18`, `127.0.0.1:55440`.
- Final fresh disposable databases:
  `sdk_receiver_29cdf_host_20260902`, `sdk_receiver_29cdf_event_20260902`,
  `sdk_receiver_29cdf_e2e_20260902`, `sdk_receiver_29cdf_claim_built_20260902`,
  `sdk_receiver_29cdf_ack_20260902`, `sdk_receiver_29cdf_cloud_built_20260902`, and the
  independent PM rerun database `sdk_receiver_pm_full_chain_20260902_1`.
- Six migrations were applied to each database: auth, pairing, Consent/targeting, signed Event
  ingress, delivery claim/lease, and delivery acknowledgement.
- Prisma Client was regenerated from the exact Cloud checkout; its backend build and type-check
  passed before the final restart-sensitive suites.
- The full-chain test asserted durable `acknowledged` state, a populated acknowledgement timestamp,
  preserved effect identity, digest-only secret persistence, and identical acknowledgement replay
  with `duplicate: true`. It also asserted that Event `202` exposed no claim, lease, effect, or
  acknowledgement fields.
- `python3 scripts/test_sensitive_scan.py` passed `3/3`; `python3 scripts/scan_sensitive_patterns.py
  --root .` reported no high-confidence sensitive patterns. The report and committed evidence use
  synthetic identifiers/redacted values; no raw organization keys, Connector tokens, lease tokens,
  or effect tokens were persisted.

## 5. Required changes from the other teams

1. **Cloud Receiver owner** — promote/push and deploy tested commit
   `29cdfa4ab4af329d39af361fa3a0a1dc33eab919`; provide deployed `/health/live` and `/readyz`
   evidence plus a supported real-browser path. No protocol change is required by the SDK.
2. **Local Connector owner** — preserve/push tested commit
   `4b8215156d814551f8da06dad16319deaff549d7` and provide a separately spawned Connector-process
   run if that is a release requirement. The in-process implementation contract already passes.
3. **Integration/release owner** — keep the independent Host-effect authority configured without
   recording its raw token. The exact local E2E already verifies effect binding and durable replay.
4. **Release owner** — restore npm registry authentication (`npm whoami` returned `401 Unauthorized`)
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
- `SDK-V2-E2E-001` is implemented at
  [`cloud-receiver-v2.full-chain.contract.mjs`](../../runtime/host-sdk/test/cloud-receiver-v2.full-chain.contract.mjs);
  it passed with the approved mapping flag, exact counterpart SHAs, fresh PostgreSQL, and an
  independent Host-effect authority. The harness uses the real Local Connector implementation
  in-process and a fake browser DOM/window around the real consent HTTP page; separate OS-process
  Connector and external browser evidence remains open.

## 7. Any unresolved mismatch

The ACK-003 protocol mismatch is resolved by the project-manager decision and the final Local `5/5`
rerun: `host_effect_invalid` covers malformed/far-future normalization, while
`host_effect_time_invalid` covers a normalized effect outside the valid lease/Grant/revocation
window. No unresolved SDK/Receiver protocol mismatch remains. Remaining release blockers are
local-only (not pushed/deployed) Cloud/Local commits, unavailable separately spawned real-browser
and Local-process evidence, and npm registry authentication (`401 Unauthorized`). The local
contract flow passed; publication remains unclaimed.
