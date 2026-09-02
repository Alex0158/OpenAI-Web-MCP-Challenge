## 1. What was built

The Local Connector claim, lease, and explicit acknowledgement boundary is implemented and
verified against the committed Cloud Receiver v2 Features 4–6 counterpart, with one ACK-003
error-code decision still open.

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

All exact-counterpart commands below used Node `v26.8.1`, Cloud Receiver
`300bce02e6a6f9b643a6de95a3596691304749b7`, and the disposable database
`local_connector_v2_clean_300bce_0902` on PostgreSQL `127.0.0.1:55433`.

Red-phase evidence:

- Before the test-only Receiver wrapper existed, `CONNECTOR-V2-E2E-001` failed at readiness with
  `E2E Receiver exited before readiness (1)`, proving the missing integration harness was red.
- The first green attempt exposed a real fixture defect: a restarted test authority minted a
  different `confirmed_at`, and the Receiver correctly returned `delivery_effect_conflict`.
  The fixture was corrected to retain only a stable effect-token digest and canonical attestation
  timestamp; the focused rerun then passed.
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

Exact focused Acknowledgement command used the same environment, with
`CLOUD_RECEIVER_V2_ACK_CONTRACT=1` and
`runtime/local-connector/test/cloud-receiver-v2-ack.contract.mjs`.

Result: `CONNECTOR-V2-ACK-001`, `002`, `004`, and `005` passed; `ACK-003` failed on one
expected-versus-observed error code. Total: `4/5` passed, `1/5` failed.

Exact affected aggregate:

```sh
CLOUD_RECEIVER_V2_CLAIM_CONTRACT=1 \
CLOUD_RECEIVER_V2_ACK_CONTRACT=1 \
CLOUD_RECEIVER_V2_ROOT=/Users/mac/Desktop/OpenAI-Web-MCP-Challenge/saas-boilerplate \
DATABASE_URL=postgresql://mac@127.0.0.1:55433/local_connector_v2_clean_300bce_0902 \
DIRECT_URL=postgresql://mac@127.0.0.1:55433/local_connector_v2_clean_300bce_0902 \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL= \
NODE_ENV=test \
node --test --test-concurrency=1 runtime/local-connector/test/*.test.mjs
```

Result: `45` total, `44` passed, `1` failed, `0` skipped. The only failure was `ACK-003`.

The complete package suite after adding the opt-in harness was `45` tests: `34` passed, `0`
failed, and `11` opt-in tests skipped when the Cloud contract flags were unset. The full opt-in
aggregate above ran `45` tests: `44` passed and `1` failed; the E2E test passed.

Other verification:

- `cd runtime/local-connector && npm run verify`: syntax `32/32` modules passed; `45` tests,
  `34` passed, `0` failed, `11` opt-in tests skipped.
- `cd reentry-core && npm run verify`: `80/80` passed; conformance and package checks passed.
- Cloud `npm test -- --runInBand`: `10/10` suites and `41/41` tests passed.
- Cloud `npm run build`: passed.
- Received SDK Event contract: `SDK-V2-EVENT-001`–`007`, `7/7` passed.
- Received SDK Host/Consent contract: `SDK-V2-001`–`004`, `4/4` passed.
- `SDK-V2-E2E-001` was not run because ACK-003 remains unresolved.

## 3. Exact commit SHA

Local Connector production baseline:

`7fab264d237b3e172acb091888643c831cadcb85`

Local Connector Claim test commit:

`8f8d8939a2474c18ccc4a060dc66d2553b5a0be6`

Local Connector Acknowledgement test commit:

`7fc92cd79ba01356511d8096b48a2280f6057d9b`

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
- Worktree: clean.
- The Cloud commit is local-only and is three commits ahead of its `origin/main`; it was not
  treated as pushed or deployed evidence.

## 4. Runtime and database evidence

- Node.js: `v26.8.1`.
- npm: `11.19.0`.
- PostgreSQL: `14.18`.
- Database endpoint: `127.0.0.1:55433`.
- Disposable database: `local_connector_v2_clean_300bce_0902`.
- Six committed Cloud migrations were applied, including
  `20260902050000_delivery_acknowledgement`.
- Teardown row counts were: users `0`, developers `0`, deliveries `0`, attempts `0`.
- Test data was removed after verification; the disposable database object was retained as
  local evidence and is not a production database.
- Claim tests directly verified durable lease digests, attempt limits, replay, expiry,
  restart, concurrency, wrong-target isolation, and exhaustion.
- Acknowledgement tests verified durable acknowledgement, exact replay, effect conflicts,
  stale/invalid authority rejection, and no mutation on the failing ACK-003 case.
- The E2E harness verified the actual Host SDK-to-Receiver HTTP path, separate Connector worker
  processes, explicit acknowledgement, Receiver restart replay, local credential-file mode `0600`,
  and a Host-effect file containing only a token digest and canonical attestation fields.
- Tests assert that raw Connector, claim/lease, and effect tokens do not appear in Receiver
  responses, logs, or persisted values. The local protected credential store intentionally
  retains the Connector credential required for future authentication.

## 5. Required changes from the other teams

- **Project manager / Core and ADR owner:** decide the public ACK-003 mapping for a future
  `confirmed_at`. Next gate: reconcile Core, ADR-0038, the received test, and the Cloud response
  before changing any implementation or test.
- **Cloud Receiver team:** retain the exact `/v0.1/delivery-acknowledgements` contract and
  injected Host-effect authority, then rerun the received Local Connector matrix after the
  ACK-003 decision. Do not add a fallback route, hidden retry, or alternate transport.
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

For a valid Connector, delivery, current lease, and an effect attestation whose
`confirmed_at` is in the future:

- Expected by `CONNECTOR-V2-ACK-003`: HTTP `403` with
  `{ "error": { "code": "host_effect_time_invalid" } }`; delivery remains leased and
  unchanged.
- Observed from Cloud `300bce02e6a6f9b643a6de95a3596691304749b7`: HTTP `403` with
  `{ "error": { "code": "host_effect_invalid" } }`; delivery remains leased and no
  durable mutation occurs.

The authority conflict is between the received test’s specific time-code expectation and the
authoritative Core/ADR-0038 boundary, where invalid authority output is exposed as
`host_effect_invalid`. The impact is one failed ACK case (`4/5`), one failed aggregate test
(`44/45`), while the exact local E2E acceptance fixture passed. The SDK-owned cross-team gate and
production/deployment gate remain open. ACK-003 remains unchanged pending the project-manager
decision. No whole-system or deployed completion claim is made.
