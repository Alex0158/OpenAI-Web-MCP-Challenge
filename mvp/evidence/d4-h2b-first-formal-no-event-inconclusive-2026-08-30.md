# D4/H2b First Formal No-Event Attempt — Inconclusive

**Role:** PROVISIONAL redacted experiment record; scanner certification unavailable  
**Observed:** 2026-08-30  
**Desktop:** `26.825.41651` build `7345`  
**Arm:** First formal no-event restart attempt  
**Verdict:** `INCONCLUSIVE`

## Claim boundary

This attempt does not prove or disprove full Desktop restart continuity. The operator completed
the normal quit action, but an over-broad process-lineage control prevented the external helper
from recognizing the closed Desktop state and requesting the planned automatic relaunch. The
event arm was not run. The hardened scanner now rejects this historical record because the
observer retained a contract violation and the automation row was later deleted; this document is
therefore a bounded diagnostic record, not certified acceptance evidence.

## Verified timeline

- `19:35:58.961Z`: the external observer started under `launchd` and completed its initial
  Receiver, automation, target-rollout, and process preflights.
- `19:36:58.381Z`: the no-event relaunch helper started under `launchd`.
- The operator used normal `Cmd-Q`. At `19:37:31.309Z`, the observer recorded zero Desktop main
  processes and zero processes in the then-current main-process tree.
- The observer did not emit `old_app_processes_all_absent`. The helper timed out after 120
  seconds, and it never issued a LaunchServices relaunch request.
- The operator reported waiting more than two minutes and then manually reopened the app as a
  recovery action. The observer first recorded the replacement main process at
  `19:40:08.430Z`. This manual recovery is outside a valid D4 arm.
- At `19:40:19.523Z`, the observer latched a transient automation-contract violation because the
  persisted prompt digest differed from the frozen observer-start contract. The digest matched
  again at `19:40:20.842Z`, and the eventual heartbeat envelope matched the original pinned
  prompt. The temporary violation independently invalidates this arm.
- Three official controller-side pause updates at `19:41:23.596Z`, `19:42:26.437Z`, and
  `19:43:06.413Z` each reported `PAUSED` and success, while the persisted scheduler configuration
  and database remained active with the same due time through at least `19:43:26Z`.
- The experiment Receiver was stopped before the still-active due opportunity. The one-shot was
  due at `19:44:47Z`; its target turn began at `19:45:12.457Z`.
- The delayed target recovered its stored receipt but received `ERR_CONNECTION_REFUSED` when it
  tried to open the unavailable Receiver. It invoked no Site Tool and performed no workflow
  continuation.
- At `19:45:53.799Z`, the target explicitly requested deletion of the one-shot automation even
  though the fixed trigger prompt did not instruct it to manage the automation. The deletion was
  confirmed at `19:45:53.885Z`.
- Final Receiver state remained `INITIAL`, state version 1, artifact revision 1, and
  `committed: false`. Event, run, delivery, effect, Grant-run, and adapter-resume counts all
  remained zero.

## Root cause

The failed control model treated every operating-system descendant of the Desktop main process as
a Desktop lifecycle process. A long-lived P0 `codex-app-tools-relay` workload was already present
in the observer baseline. It survived normal quit with the same process identity and was
re-parented to `launchd`. The Desktop main and app-server processes had ended, but this unrelated
relay kept the observer's all-descendants condition false. The helper independently had the same
problem because it rejected every surviving executable from the Desktop application bundle.

This is a harness ownership-model bug, not evidence that the user failed to quit the app and not a
D4 continuity result.

## Correction and regression evidence

- Observer and helper now share one semantic Desktop lifecycle classifier. It tracks the Desktop
  main process, Electron framework helpers, the core Codex app-server/control processes, and their
  stable process identities. Only explicitly reviewed bundled tool workloads are excluded;
  unrecognized bundle processes fail closed.
- Re-parented old app-server, Electron-helper, and late control-host identities still fail closed.
- Observer and helper now continuously check and sticky-latch the known unrelated P0 relay as
  contamination instead of relying only on startup preflight.
- The focused lifecycle regression first failed under the prior descendant rule (`3 !== 2`) and
  then passed all 10 lifecycle cases after the correction. Three additional controls cover
  contamination latching across the critical checkpoints.
- Thirteen automation-history scanner controls and the complete 114-test mechanism suite pass.
- The hardened evidence scanner correctly refuses to certify this attempt because the observer
  recorded contract drift and the current automation row is absent. The target trace separately
  establishes the explicit deletion provenance; it cannot restore scanner certification.

## Next valid experiment

Stop the unrelated P0 relay, create a fresh disposable target and paused one-shot, require the
trigger prompt not to create, update, pause, or delete automations, preserve the paused row through
evidence scanning, and rerun the no-event arm. Only an automatic helper relaunch followed by one
valid scheduled no-event turn can advance D4. Do not run the event arm until that fresh no-event
arm passes.
