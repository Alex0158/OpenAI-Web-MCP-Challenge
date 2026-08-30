# TenderRelay re-entry kill test

This repository contains the smallest test that can prove or falsify TenderRelay's critical bridge:

```text
first-stage WebMCP enrollment
→ page turn ends
→ reviewer changes authoritative state
→ signed typed event passes the Gateway
→ Receiver queues a fixed message to the same Codex task
→ Codex opens the canonical page
→ second-stage Site Tools update the visible draft
```

## Run

Tests do not contact Codex:

```bash
npm test
```

Dry-run Receiver:

```bash
npm start
```

Live Receiver:

```bash
TENDERRELAY_RECEIVER_MODE=live \
TENDERRELAY_THREAD_ID=<current-codex-task-id> \
npm start
```

Open:

- Applicant: <http://127.0.0.1:43118/tenders/TENDER-102>
- Reviewer: <http://127.0.0.1:43118/reviewer/tenders/TENDER-102>
- Diagnostics: <http://127.0.0.1:43118/diagnostics/continuation>

The test stores local state in `.tenderrelay/state.json`. The website receives only an opaque grant handle; the real task ID stays in the Receiver process environment. The event cannot carry an arbitrary Agent prompt, and the re-entry stage intentionally exposes no submission tool.

## Verified result — 30 August 2026

The core re-entry bridge passed on this machine with ChatGPT/Codex desktop `26.825.51511` and bundled Codex CLI `0.151.0-alpha.7.2`:

- genuine first-stage Site Tools read the requirements and Re-entry Manifest;
- the Agent updated the visible bid, attached an opaque scoped grant, and moved the workflow to `UNDER_REVIEW`;
- the reviewer action committed `CHANGES_REQUESTED` at state version 3;
- the Gateway verified the signed typed event and the Receiver queued a fixed message to the same Codex task;
- the task resumed without a new manually authored prompt;
- the resumed task opened the exact canonical URL in a fresh in-app browser tab;
- genuine second-stage Site Tools called `get_current_tender_state`, `read_clarification_request`, and `update_clarification_draft` in order;
- the clarification draft changed visibly on the page;
- no clarification-submission tool was exposed or called.

**Verdict:** the previously unproven same-task → built-in browser → second-stage WebMCP bridge works in this local environment. A clean repeat with the original applicant tab closed and judge-environment testing are still required before claiming broad reproducibility.
