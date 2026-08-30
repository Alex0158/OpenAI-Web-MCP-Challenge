# Challenge Governance Snapshot

**Role:** GOVERNING operational digest; the Official Rules control  
**Status:** Dated snapshot; refresh before submission or eligibility decisions  
**Observed:** 2026-08-30  
**Primary source:** [Devpost Official Rules](https://webmcp.devpost.com/rules)

This English digest makes the high-impact challenge obligations easy to find. It is not
legal advice and it does not replace the live Official Rules. If this file, a supporter
page, a forum post, or a marketing page disagrees with the Official Rules, use the Official
Rules and preserve the discrepancy in the [conflict log](../../References/Other/02-community-and-conflict-log.md).

## Hard timeline in the captured rules

The captured Official Rules list the following timestamps:

| Event | Pacific time | UTC | London time |
|---|---:|---:|---:|
| Submission deadline | 2026-09-03 13:00 PDT | 2026-09-03 20:00 | 2026-09-03 21:00 BST |
| Judging begins | 2026-09-04 10:00 PDT | 2026-09-04 17:00 | 2026-09-04 18:00 BST |

The older 17:00 Pacific deadline found in supporter/community material is preserved as a
historical conflict, not as extra buffer. Recheck the live page immediately before freeze.

## Eligibility control

The entrant must be an eligible individual, team, or organization in a supported OpenAI API
region and must not fall within a listed exclusion or conflict-of-interest category. The
captured rules explicitly list Hong Kong among excluded regions. Any uncertainty about the
entrant's exact residence, legal entity, representative, or conflict status requires a
written clarification before irreversible work; silence is not approval.

## Project and submission gates

A compliant entry must be a WebMCP-powered web app whose submitted behavior matches its
description and demo. The captured hard gates are:

1. A working live URL that judges can open on a supported WebMCP surface, with credentials
   and testing instructions when authentication is required.
2. An English description explaining the use case, the human-Agent collaboration, the
   WebMCP-specific value, and the implementation.
3. A public source repository containing the source, assets, instructions, and a visible
   open-source license. The repository must include a genuine imperative registration such
   as `document.modelContext.registerTool({ ... })`.
4. A public YouTube functioning demo under three minutes with understandable audio.
5. Rights and license compliance for entrant work, third-party code, APIs, data, assets,
   trademarks, and music.
6. A project created during the submission period, or a clearly timestamped meaningful
   WebMCP extension to an existing project. Only the in-period work is evaluated for an
   extension.
7. A judge-reproducible path: public instructions, a free test path during judging, and no
   undocumented private dependency that is necessary for the project to function.

The rules allow more than one submission when entries are unique and substantially
different, but each project still needs its own complete gates. Concentrating on one
reliable entry is a strategy choice, not a rules requirement.

## Judging funnel

Stage One is a pass/fail check for theme fit and reasonable use of the required WebMCP
technology. Stage Two scores four equally weighted criteria:

| Criterion | Evidence the project should make observable |
|---|---|
| WebMCP Leverage | Genuine, non-trivial, complementary Site Tools connected to the product's domain logic |
| Execution | Working, coherent, runnable experience with a short, reliable judge path |
| Potential Impact | A concrete user problem and a measurable human-Agent outcome |
| Creativity & Ambition | A domain-specific workflow or mechanism that is more than a generic wrapper |

Tie-breaking follows the same order, beginning with WebMCP Leverage. Novelty cannot repair a
submission that fails the baseline or cannot be run.

## Publication and freeze controls

Before the deadline:

- test the live URL on the exact supported client(s) named in the submission;
- verify the public repository, visible license, source completeness, and WebMCP registration;
- check that the video is public, under 180 seconds, and has clear audio;
- freeze a copy of the submission links, instructions, evidence, and source revision; and
- stop changing the submitted live site and repository after the submission period unless
  the sponsor/administrator explicitly permits a narrow correction.

Keep a separate development fork after freeze if further work is needed.

## Known unresolved compliance questions

The captured research did not find a binding answer for a consume-only browser extension or
for a necessary private backend/private dependency. The conservative path is to make the
public web app itself expose the WebMCP tools, publish a reproducible local/mock path, and
ask for written clarification when a private component cannot be removed.

## Refresh checklist

Refresh this digest against the live Official Rules and the entrant's exact situation before
any submission claim:

- [ ] deadline and judging timestamps;
- [ ] residence, organization, representative, and conflict eligibility;
- [ ] live URL and supported client requirements;
- [ ] repository/license/source completeness;
- [ ] video duration, visibility, and audio;
- [ ] third-party rights and in-period work history; and
- [ ] any unresolved private-component or extension question.

