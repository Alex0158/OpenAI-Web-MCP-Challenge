# H2a Cold Browser Runtime Re-entry Verdict

**Observed:** 2026-08-30  
**Environment:** ChatGPT Desktop `26.825.41651` build `7345`  
**Verdict:** **PASS WITH COLD-START RECOVERY**  
**Scope:** Task-scoped Node/Browser kernel loss, same-turn Browser runtime reconstruction,
and genuine no-event Receiver Site Tool invocation

## Question

H0b and H1 used fresh Browser documents but ran in one test task whose Node Browser kernel
had remained alive across scheduled turns. H2a tested whether that persistent in-memory
runtime was a hidden prerequisite.

## Method

The completed H1 database and still-valid bounded receipt were preserved. The automation was
paused and the exact task-scoped Node kernel associated with the controlled test task was
terminated gracefully. Its parent Node REPL service and the ChatGPT Desktop app remained
running. The H1 service was restarted without resetting its database.

The next scheduled prompt remained trigger-only and supplied no receipt field, route, or Site
Tool name. The stored one-run policy explicitly prohibited assuming that a prior Node
variable, Browser controller, tab, or WebMCP handle still existed.

## Result

The scheduled turn started a new task-scoped kernel. Its first cold Browser attempt reached a
fresh Receiver document but was rejected by the Browser runtime because the new runtime had
not yet read the mandatory `confirmations` and `webmcp` documentation. This is a real
cold-start preflight requirement, not a missing Site Tool.

The Agent read both required documentation surfaces and retried. Two intermediate attempts
failed because partially initialized variables could not be reused and a newly created
runtime instance had its own documentation gate. The final attempt initialized one runtime,
read its required documentation before action, created a fresh built-in Browser document,
discovered the current Inbox Site Tools, and genuinely invoked
`get_pending_reentry_event`. The typed result was `pending: false`.

The turn stopped without opening the canonical Host page. Workflow state remained `READY`,
state version 2, artifact revision 2, and `committed=false`. Counts remained one event, one
run, one delivery, and one Host effect, all completed; the private adapter count remained
zero. The automation was paused and the H1 service was stopped after capture.

## Interpretation

H2a rules out persistent task-scoped JavaScript variables as a necessary condition for the
bounded current-build Browser/WebMCP join. It also exposes a deterministic cold-start tax:
each newly initialized Browser runtime must read its mandatory confirmation and WebMCP
documentation before its first governed action. A robust scheduled policy should initialize
one runtime, complete that preflight, and then navigate and invoke; it should not create a
second runtime after reading the first runtime's documentation.

H2a does **not** prove full ChatGPT Desktop restart, machine restart, sleep, offline catch-up,
client update, another account or workspace, or another model. The Node REPL host process and
the Desktop app remained alive, and the receipt was already persisted and unexpired.

The structured redacted record is
[`h2a-cold-browser-runtime-reentry-2026-08-30.json`](h2a-cold-browser-runtime-reentry-2026-08-30.json).
