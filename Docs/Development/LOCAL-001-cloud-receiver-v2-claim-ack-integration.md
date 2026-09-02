## 1. What was built

The Local Connector claim, lease, and explicit acknowledgement boundary is implemented and
verified against the committed Cloud Receiver v2 Features 4–6 counterpart; ACK-003 now follows
the accepted Core/Cloud error mapping.

- Preserved the production Local Connector behavior from the pairing baseline
  `7fab264d237b3e172acb091888643c831cadcb85`.
- Added executable acknowledgement coverage `CONNECTOR-V2-ACK-001`–`005`.
- Preserved the exact claim and acknowledgement JSON bodies, `connector_token` placement,
  tokenless pairing replay, outbound-only delivery, 60-second lease, three-attempt limit,
  five-second polling, and five-second request timeout.
- Added exact-counterpart harness isolation so tests use the supplied Cloud root and run
  serially when they capture process/log/database state.
- Added `CONNECTOR-V2-E2E-001`: an opt-in real-process harness that drives Host SDK setup and signed
  Event ingress over loopback HTTP, claims through a separate Local Connector process, performs an
  independent digest-bound Host-effect fixture, acknowledges through a second Connector client
  process, restarts the Receiver, replays the exact acknowledgement, and verifies durable state.
- Added the Local Connector-to-Cloud Receiver integration contract and linked it to the
  project full-chain gate.

No Local Connector production protocol, Core client, fallback route, retry policy, alternate
transport, or public Grant inspection/revocation route was added.

## 2. Tests passed and failed

The earlier Claim and E2E evidence used Node `v26.8.1`, Cloud Receiver
`300bce02e6a6f9b643a6de95a3596691304749b7`, and the disposable database
`local_connector_v2_clean_300bce_0902` on PostgreSQL `127.0.0.1:55433`. The accepted ACK-003
red-to-green rerun used the fresh database `local_connector_v2_ack_20260902_1f3559` on the same
PostgreSQL endpoint.

Red-phase evidence:

- Before the test-only Receiver wrapper existed, `CONNECTOR-V2-E2E-001` failed at readiness with
  `E2E Receiver exited before readiness (1)`, proving the missing integration harness was red.
- The first green attempt exposed a real fixture defect: a restarted test authority minted a
  different `confirmed_at`, and the Receiver correctly returned `delivery_effect_conflict`.
  The fixture was corrected to retain only a stable effect-token digest and canonical attestation
  timestamp; the focused rerun then passed.
- The pre-decision ACK run was `4/5`: the future-attestation case expected
  `host_effect_time_invalid`, while the accepted Core/Cloud behavior was `host_effect_invalid`.
- After aligning that expectation, the fresh-database run exposed a fixture defect in the revoked
  case: its attestation was created before revocation. The fixture now uses the returned revocation
  timestamp plus one millisecond, preserving the `host_effect_time_invalid` window assertion.
- Two non-escalated loopback checks were rejected by the sandbox with `EPERM`; the process and
  database results below were rerun with the required local-system permission.

The clean Local Connector counterpart was tested from `/private/tmp/local-connector-v2-2233`,
detached at `81e51a6b2299fa1f63c2b06180febebaab9ded04`.

Exact focused Claim command:

```sh
CLOUD_RECEIVER_V2_CLAIM_CONTRACT=1 \
CLOUD_RECEIVER_V2_ROOT=/Users/mac/Desktop/OpenAI-Web-MCP-Challenge/saas-boilerplate \
DATABASE_URL=postgresql://mac@127.0.0.1:55433/local_connector_v2_clean_300bce_0902 \
DIRECT_URL=postgresql://mac@127.0.0.1:55433/local_connector_v2_clean_300bce_0902 \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL= \
NODE_ENV=test \
node --test runtime/local-connector/test/cloud-receiver-v2-claim.contract.mjs
```

Result: `CONNECTOR-V2-CLAIM-001`–`005`, `5/5` passed.

Exact focused real-process E2E command:

```sh
cd runtime/local-connector

CLOUD_RECEIVER_V2_E2E=1 \
CLOUD_RECEIVER_V2_ROOT=/Users/mac/Desktop/OpenAI-Web-MCP-Challenge/saas-boilerplate \
DATABASE_URL=postgresql://mac@127.0.0.1:55433/local_connector_v2_clean_300bce_0902 \
DIRECT_URL= \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL= \
NODE_ENV=test \
node --test test/cloud-receiver-v2-e2e.test.mjs
```

Result: `CONNECTOR-V2-E2E-001`, `1/1` passed. This is local integration evidence with a
deterministic test Host-effect authority; it is not production Host-effect or deployment evidence.

Historical pre-decision focused Acknowledgement command used the same environment, with
`CLOUD_RECEIVER_V2_ACK_CONTRACT=1` and
`runtime/local-connector/test/cloud-receiver-v2-ack.contract.mjs`.

Result: `CONNECTOR-V2-ACK-001`, `002`, `004`, and `005` passed; `ACK-003` failed on one
expected-versus-observed error code. Total: `4/5` passed, `1/5` failed.

Accepted-mapping focused Acknowledgement command against the fresh database:

```sh
CLOUD_RECEIVER_V2_ACK_CONTRACT=1 \
CLOUD_RECEIVER_V2_ROOT=/Users/mac/Desktop/OpenAI-Web-MCP-Challenge/saas-boilerplate \
DATABASE_URL=postgresql://mac@127.0.0.1:55433/local_connector_v2_ack_20260902_1f3559 \
DIRECT_URL=postgresql://mac@127.0.0.1:55433/local_connector_v2_ack_20260902_1f3559 \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL= \
NODE_ENV=test \
node --test --test-concurrency=1 runtime/local-connector/test/cloud-receiver-v2-ack.contract.mjs
```

Result: `CONNECTOR-V2-ACK-001`–`005`, `5/5` passed.

Accepted-mapping full opt-in aggregate:

```sh
CLOUD_RECEIVER_V2_CLAIM_CONTRACT=1 \
CLOUD_RECEIVER_V2_ACK_CONTRACT=1 \
CLOUD_RECEIVER_V2_ROOT=/Users/mac/Desktop/OpenAI-Web-MCP-Challenge/saas-boilerplate \
DATABASE_URL=postgresql://mac@127.0.0.1:55433/local_connector_v2_ack_20260902_1f3559 \
DIRECT_URL=postgresql://mac@127.0.0.1:55433/local_connector_v2_ack_20260902_1f3559 \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL= \
NODE_ENV=test \
node --test --test-concurrency=1 runtime/local-connector/test/*.test.mjs
```

Result: `45` total, `45` passed, `0` failed, `0` skipped.

The complete package suite after adding the opt-in harness was `45` tests: `34` passed, `0`
failed, and `11` opt-in tests skipped when the Cloud contract flags were unset. The accepted full
opt-in aggregate above ran all `45` tests green, including the E2E test.

Other verification:

- `cd runtime/local-connector && npm run verify`: syntax `32/32` modules passed; `45` tests,
  `34` passed, `0` failed, `11` opt-in tests skipped.
- `cd reentry-core && npm run verify`: `80/80` passed; conformance and package checks passed.
- Cloud `npm test -- --runInBand`: `10/10` suites and `41/41` tests passed.
- Cloud `npm run build`: passed.
- Received SDK Event contract: `SDK-V2-EVENT-001`–`007`, `7/7` passed.
- Received SDK Host/Consent contract: `SDK-V2-001`–`004`, `4/4` passed.
- `SDK-V2-E2E-001` was not run in Local scope; it remains the SDK/Cloud cross-team gate.

## 3. Exact commit SHA

Local Connector production baseline:

`7fab264d237b3e172acb091888643c831cadcb85`

Local Connector Claim test commit:

`8f8d8939a2474c18ccc4a060dc66d2553b5a0be6`

Local Connector Acknowledgement test commit:

`7fc92cd79ba01356511d8096b48a2280f6057d9b`

Local Connector ACK-003 mapping and fixture correction commit:

`4b8215156d814551f8da06dad16319deaff549d7`

Local Connector harness-isolation commit:

`ac62e724a010b855df8494ec6f57c071f614212d`

Local Connector real-process E2E harness commit:

`d1e0e55a91b4a6d1922cd7ab27b114cbfcf43262`

Pre-E2E clean contract-validation checkout:

`81e51a6b2299fa1f63c2b06180febebaab9ded04`

Local repository state:

- Branch: `codex/eyad-reentry-core-foundation`.
- Local Connector production and Core-client files were unchanged in the E2E/documentation
  follow-up; the new implementation surface is test-only.
- The shared root worktree remains dirty from parallel work; the exact Local Connector-owned
  source/test/report paths are isolated and are reported separately here.
- A clean detached Local Connector counterpart worktree was verified at
  `/private/tmp/local-connector-v2-2233`, HEAD
  `81e51a6b2299fa1f63c2b06180febebaab9ded04`, for the pre-E2E claim/acknowledgement run.
- Root remote readback: `77c9cbcd7d2dbb71ba62308c0b3a5e0e47805dac`.
- The Local Connector commits are local-only and were not pushed or deployed.

Cloud Receiver counterpart:

- Commit: `300bce02e6a6f9b643a6de95a3596691304749b7`.
- Branch: `main`.
- The backend subtree used by these tests is unchanged from that exact commit. The Cloud worktree
  has unrelated uncommitted frontend changes; Local Connector did not modify or test those files.
- The Cloud commit is local-only and is three commits ahead of its `origin/main`; it was not
  treated as pushed or deployed evidence.

## 4. Runtime and database evidence

- Node.js: `v26.8.1`.
- npm: `11.19.0`.
- PostgreSQL: `14.18`.
- Database endpoint: `127.0.0.1:55433`.
- Disposable database: `local_connector_v2_ack_20260902_1f3559` for the accepted ACK-003 rerun;
  earlier Claim/E2E evidence used `local_connector_v2_clean_300bce_0902`.
- Six committed Cloud migrations were applied, including
  `20260902050000_delivery_acknowledgement`.
- Teardown row counts were: users `0`, developers `0`, deliveries `0`, attempts `0`.
- Test data was removed after verification; the disposable database object was retained as
  local evidence and is not a production database.
- Claim tests directly verified durable lease digests, attempt limits, replay, expiry,
  restart, concurrency, wrong-target isolation, and exhaustion.
- Acknowledgement tests verified durable acknowledgement, exact replay, effect conflicts,
  stale/invalid authority rejection, and no mutation on rejected ACK-003 cases.
- The E2E harness verified the actual Host SDK-to-Receiver HTTP path, separate Connector worker
  processes, explicit acknowledgement, Receiver restart replay, local credential-file mode `0600`,
  and a Host-effect file containing only a token digest and canonical attestation fields.
- Tests assert that raw Connector, claim/lease, and effect tokens do not appear in Receiver
  responses, logs, or persisted values. The local protected credential store intentionally
  retains the Connector credential required for future authentication.

## 5. Required changes from the other teams

- **Project manager / Core and ADR owner:** record the accepted ACK-003 mapping consistently in
  Core, ADR-0038, and cross-team release notes: malformed/far-future normalization is
  `host_effect_invalid`; only a normalized effect outside the valid window is
  `host_effect_time_invalid`.
- **Cloud Receiver team:** rerun the received Local Connector matrix against Local test commit
  `4b8215156d814551f8da06dad16319deaff549d7`, then provide staging/production endpoint, SHA,
  database, TLS, and secret-custody evidence. Do not add a fallback route, hidden retry, or
  alternate transport.
- **SDK/Host team:** provide the clean Host SDK counterpart SHA and an independent
  Host-effect authority fixture. Next gate: run `SDK-V2-E2E-001`, verify terminal durable
  `acknowledged` state, then replay the exact acknowledgement.
- **All teams:** keep public Grant inspection/revocation out of scope until ADR-0013 is
  approved.

## 6. Integration test document

The single cross-team gate is [TASK-022](../Tasks/TASK-022-prepare-sdk-v2-full-chain-integration.md)
with [SDK-005](SDK-005-cloud-receiver-v2-full-chain-contract.md). The Local Connector-owned
wire and persistence contract is
[09-local-connector-cloud-receiver-integration.md](../Cloud-Receiver-Handoff/v2-build/09-local-connector-cloud-receiver-integration.md).

This report owns and exchanges:

- `CONNECTOR-V2-CLAIM-001`–`005` in
  [`cloud-receiver-v2-claim.contract.mjs`](../../runtime/local-connector/test/cloud-receiver-v2-claim.contract.mjs).
- `CONNECTOR-V2-ACK-001`–`005` in
  [`cloud-receiver-v2-ack.contract.mjs`](../../runtime/local-connector/test/cloud-receiver-v2-ack.contract.mjs).
- `CONNECTOR-V2-E2E-001` in
  [`cloud-receiver-v2-e2e.test.mjs`](../../runtime/local-connector/test/cloud-receiver-v2-e2e.test.mjs),
  with the test-only Receiver wrapper and separate Connector claim/ack workers in the same test
  directory.

The handoff document defines the exact requests, response bodies, headers, token placement,
`200`/`204` behavior, errors, replay, timing, durable-state assertions, secret boundaries, and
the combined acceptance sequence:

```text
Host SDK -> Cloud Receiver -> Local Connector -> independent Host-effect authority
  -> acknowledgement -> exact acknowledgement replay
```

## 7. Any unresolved mismatch

No ACK-003 protocol mismatch remains. The accepted mapping is now covered by the Local test and
matches Cloud `300bce02e6a6f9b643a6de95a3596691304749b7`:

- malformed or far-future normalization: HTTP `403 host_effect_invalid`;
- normalized effect outside the lease/Grant/revocation window: HTTP `403
  host_effect_time_invalid`.

The Local fresh-database ACK matrix and full opt-in aggregate are green. Remaining gates are the
SDK-owned cross-team E2E, staging/production evidence, and final deployment; no whole-system or
deployed completion claim is made.
