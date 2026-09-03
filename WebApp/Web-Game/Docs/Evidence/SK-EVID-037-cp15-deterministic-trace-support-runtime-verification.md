# SK-EVID-037: CP-15 Deterministic Trace Support Contract Verification

## Identity

- Evidence ID: `SK-EVID-037`
- Related task: [`SK-TASK-048`](../Tasks/SK-TASK-048-side-chat-cp15-cp16-deterministic-trace-support-toolkit.md)
- Evidence class: `contract`
- Ladder level: `2` — targeted test-support contract checks under the Node 24 test runtime
- Executor and date: Codex, 2026-09-02, Europe/London

## Exact identity under test

- Source state: working tree on `main`, `HEAD 8b1cc8a` (uncommitted game changes; no commit, push,
  deploy, or hosted claim)
- Source and test root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Contract version: `SK-MVP-0.2`
- Runtime: Node.js `v24.13.1`, `tsx` from the task-local dependency tree, TypeScript `7.0.2`
- Changed surface: `tests/support/trace-toolkit.ts` and
  `tests/side-chat-cp15-trace-toolkit.test.ts` only

## Objective and claim boundary

- Behavior under test: a pure helper copies phase and event observations, checks exact per-boundary
  phase order, rejects duplicate event/effect identities, and produces a stable order-preserving
  replay digest.
- Claim this evidence may support: the isolated helper contract and its negative/boundary vectors.
- Claims this evidence cannot support: live worker/store adaptation, CP-15 aggregate closure, CP-16
  slice behavior, WebMCP, Re-entry, hosted continuity, or any production gameplay path.

## Executed verification

| Replayable command or procedure | Result | Claim this supports |
|---|---|---|
| `npx tsx --test tests/side-chat-cp15-trace-toolkit.test.ts` under Node 24 | **Passed 5/5** | Exact phase order, missing/reordered/duplicated phase rejection, duplicate event/effect rejection, stable replay digest, and input immutability |
| `npm run typecheck` under Node 24 | **Passed** | TypeScript contract consistency for the added support paths |
| `python3 scripts/test_validate_game_docs.py` | **Passed 22/22** | Documentation structure and validator self-test after task closure update |
| `python3 scripts/validate_game_docs.py --root . --report` | **Passed** | Documentation links, language, record shape, and task lifecycle consistency |

## Assertions and review

- The helper has no import from `src/` and no production consumer; it cannot mutate world state,
  schedule work, emit events, or deliver a Signal.
- Normalization copies records and preserves caller order. It does not sort observations to make an
  invalid phase sequence appear valid.
- Every observed `worldTime` is checked independently, and every boundary must match the supplied
  exact phase sequence. Event IDs and supplied effect keys are checked for duplicates within one run.
- The digest fixes output field order while retaining phase/event observation order, so replay drift is
  visible rather than normalized away.

## Residual risk and conclusion

- A later CP-15/CP-16 adapter still owns conversion from live worker/store records to these generic
  observations. The helper must not become a second authority or silently infer missing events.
- **Conclusion:** `SK-TASK-048` is `contract_verified` at ladder level 2 for its isolated test-support
  boundary. It is accepted as reusable support and does not close CP-15, CP-16, WebMCP, Re-entry, or
  hosted claims.
