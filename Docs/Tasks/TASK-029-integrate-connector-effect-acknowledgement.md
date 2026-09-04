# TASK-029: Settle Connector Notification Delivery

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-09-03

## Task Control

- Type: `implementation`
- Lifecycle: `in_progress`
- Priority: `P1`
- Owner: Receiver, Local Connector, and Agent Adapter owners.
- Current increment: Architecture review separates exact-task binding, notification handoff and
  settlement from the retained process-runner preview. Research 27 now distinguishes runtime
  reconciliation needed for automatic recovery from a bounded single-attempt/unknown profile;
  it records the coordinated remediation and unaccepted first-version crash-recovery trade-off.
  CLOUD-028 owns the lease-timeout/late-child regression evidence. No runtime or ACK behavior changes.
- Next gate: Accept the concrete runtime admission/attestation contract, stable delivery correlation,
  bounded unknown-outcome recovery, busy-task policy, and version/migration compatibility; then prove
  convergence without waiting for Agent completion or a Game effect. Generic agreement with the
  product direction does not select the proposed v0.3 route, storage, or receipt fields.
  First decide whether the first version requires runtime crash recovery or accepts qualified
  exact-task acceptance with a documented post-acceptance loss risk. Then specify unknown-slot
  disposition without revoking the Grant. Actual wake evidence does not block specification;
  legitimate invocation still gates live execution.
- Dependencies: ADR-0046; retained ADR-0009/0037/0038/0045 compatibility contracts; TASK-035 binding;
  TASK-034 runtime evidence; TASK-033 standing adoption; AUDIT-V2-003 in Core/09.

## 1. Problem and objective

The default Connector claims and dispatches work but does not obtain effect proof or call its
available acknowledgement client. Separate-process evidence reaches acknowledgement only through a
test-specific effect authority and worker. An unacknowledged successful dispatch can therefore be
reclaimed and repeated until the Receiver exhausts its attempt budget.

ADR-0046 changes the selected solution, not the existence of this defect: settle delivery at a
trusted notification-handoff boundary, not at a Game effect. The former effect-authority product
integration is no longer planned; its exact implemented contracts/evidence remain preserved below.
This task is not closed or fixed merely because its target is corrected.

## 2. Authority and evidence

- ADR-0046 owns the selected notification-only target; ADR-0009 and ADR-0038 continue to own
  effect-backed acknowledgement in retained compatibility profiles.
- ADR-0037 owns lease expiry and bounded reclaim.
- Mechanisms 03–05 own the Connector, effect, Host, and human-boundary separation.
- [Research 27](../Research/27-notification-handoff-profile-proposal.md) is the unaccepted
  decision-ready notification-handoff profile proposal; it does not change the owning contract.
- `CONNECTOR-V2-ACK-001` and `CONNECTOR-V2-E2E-001` prove the current split and test-only completion
  path.

## 3. Scope

Specify trusted handoff identity and attestation, exact target/Grant/Event correlation, authorization,
response loss, restart, duplicate notification, stale worker, revocation, pending-slot release, and
unknown outcomes. Keep task busy scheduling separate from Receiver delivery state. Select an
explicit protocol transition before changing routes, schemas, or stored rows; no effect token may
be fabricated or renamed to avoid that gate. Use Research 27 only as a review aid until the owner
accepts or revises its profile. Integrate one real bound-task consumer.

## 4. Non-goals

- treating generic adapter `accepted`, Codex exit, narration, or HTTP health as trusted handoff;
- waiting for or retrying Agent/Game business work, or imposing a mandatory Game mutation;
- adding blind retries, an alternate transport, or a synthetic production verifier;
- selecting a Host application or Agent runtime inside this task; or
- exposing effect or lease credentials to the Agent prompt or browser.

## 5. Verification and closure

Close only with a real composition separating notification handoff, actual wake, and optional
business work; prove replay, response loss, restart, stale/wrong-target denial, and explicit unknown
outcomes. After successful handoff, interruption and deliberate no-command behavior must not cause
redelivery. Preserve retained profile regressions and record the exact local/deployed evidence level.

## 6. Reopen condition

Reopen for changed handoff authority, receipt/protocol profile, lease timing, target binding, retry,
or evidence that the default Connector can dispatch without safe notification convergence.
