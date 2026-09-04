# DOCS-007: Judge-Facing README

**Role:** SUPPORTING documentation implementation and verification record  
**Date:** 2026-09-04  
**Profile:** Standard; explicit bounded documentation outcome  
**Status:** Locally verified documentation; Git delivery recorded by the containing commit

## Outcome and boundaries

Rewrite the GitHub root README on the current shared `main` branch as an English, judge-facing
product introduction. Lead with an original tagline, the supplied demo video, and a strongly
recommended Judge Guide. Explain the problem, core workflow, innovation, vision, potential business
value, and component responsibilities without installation, operation, or deployment instructions.

The authorized scope is README presentation and its positioning/evidence writeback. It does not
change product behavior, Grants, Agent admission, Game code, deployment, package releases, or
submission state. No new branch, external message, partnership representation, or runtime action
is part of this increment. This complete bounded documentation outcome does not create another
implementation task or close TASK-012 or the existing integration tasks.

## Inputs and observed baseline

- Repository baseline: `245aec33fd525aff625aed0523457b9b4d570679`, `main`, equal to `origin/main`
  after fetch. The README and the two existing documentation edit targets were tracked and clean.
- The 408-line root README mixed product explanation, retired-runtime commands, install prompts,
  implementation chronology, and stale fresh-session descriptions. Historical content remains
  recoverable from this Git baseline; owning package documents and frozen evidence are untouched.
- The supplied [2:24 video](https://youtu.be/lovFAAftKeU) was reviewed through its complete
  auto-generated English transcript and sampled visual frames. Its story moves from asynchronous
  workflows to the Receiver/Connector bridge and a future native continuation capability. It is
  narrative input, not independent evidence of a full hosted runtime trace.
- The live [Judge Guide](https://game.sleepless-kingdom.com/OpenAI-WebMCP-Challenge-Judge-Guide)
  was read in the browser. It explains the persistent world, cargo-loss story, current-state reads,
  bounded recall, and human boundary. The guide is linked, not rewritten or treated as proof of
  every described step.
- Current-status, product-definition, competition-thesis, and ADR-0046 readback preserve the
  existing-task and notification-only target, separate from the incomplete hosted integration.

## Positioning decisions and reconciliation

- Tagline: **The web moves on. Your agent should too.** The supporting line makes clear that
  continuity means ongoing human-Agent-web collaboration, not unsupervised execution.
- The video thumbnail and Judge Guide sit above the explanatory sections. The Judge Guide is
  recommended again beside the Game story.
- A follow-up owner request adds a low-emphasis link beside the README's technical references to
  the latest Cloud Receiver integration instructions on `Eyad/Full-Integration`. The exact branch
  spelling and its root README were verified at remote commit `55d43a9a1676ad32ff7cc58105a632849a4f1778`.
  This is navigation only, not a branch merge, runtime verification, or change to Core authority.
- Explain one valid standing approval, repeated eligible events, private same-task continuity,
  fresh WebMCP reads, Agent discretion, and human control. Do not imply perpetual authority,
  offline execution, commands hidden in events, or Receiver supervision of business completion.
- Describe OpenAI collaboration and mainstream-Agent portability explicitly as a future vision.
  Native platform support could replace the separate Receiver/Connector bridge for that
  integration; it does not remove the Host backend or its responsibility for truth and access.
- Commercial benefits are hypotheses, not measured savings, validated demand, or a chosen
  monetization model. The bounded prototype notice remains visible near the technical references.
- **Updated:** Core/08 owns this external-facing narrative and aspiration boundary.
- **Aligned:** Core/00, Core/01, Core/05, Mechanisms, and ADR-0046 retain their behavior and evidence
  authority. No runtime result, product permission, or accepted topology changed, so no new ADR or
  current-status promotion is warranted.
- **Untouched:** the Game Judge Guide being edited by another task, all application/runtime code,
  nested Receiver repository, untracked submission draft, research, and other owner-held work.

## Verification and closure

Local verification on 2026-09-04:

| Check | Result |
| --- | --- |
| `python3 scripts/test_validators.py` | PASS, 6 tests |
| `python3 scripts/test_sensitive_scan.py` | PASS, 4 tests |
| `python3 scripts/validate_repository.py --root .` | PASS, including relative links, English-only content, index coverage, and diff checks |
| `python3 scripts/scan_sensitive_patterns.py --root .` | PASS, no high-confidence findings |
| README-specific Node assertions | PASS: one H1, balanced diagram fence, exact video/guide/tagline, no install commands or loopback URLs, and explicit aspiration/prototype boundaries |
| Public video thumbnail and Judge Guide HTTP readback | Both HTTP 200; video and guide also inspected in the browser |
| Exact-path staged diff | Only README, Core/08, this record, and the Development index |

The checks are documentation evidence, not runtime evidence. The containing Git commit identifies
the delivered candidate; local/remote identity and any GitHub rendering readback are reported at
handoff rather than predicted here. Other tasks' concurrent Game-guide changes and untracked files
remain outside the commit. No CI result is claimed by these local checks.

No runtime suite, deployment, live consent, event send, Agent wake, Game action, or Devpost
submission is required or claimed by this documentation-only increment.

Reopen when the user revises positioning, the supplied public destinations change, or new accepted
runtime evidence makes the prototype boundary inaccurate. Do not treat a successful README render
or accessible demo page as hosted workflow proof.
