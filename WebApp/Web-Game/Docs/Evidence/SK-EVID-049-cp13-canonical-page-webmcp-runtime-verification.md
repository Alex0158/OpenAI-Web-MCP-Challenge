# SK-EVID-049: CP-13 Canonical Page WebMCP Runtime Verification

## Identity

- Evidence ID: `SK-EVID-049`
- Related task and records: [`SK-TASK-061`](../Tasks/SK-TASK-061-cp13-page-read-tools-and-recall-action-implementation.md), [`SK-EVID-047`](SK-EVID-047-cp13-page-tools-local-runtime-verification.md), [`SK-EVID-048`](SK-EVID-048-cp13-canonical-page-browser-attempt.md), and [`Validation/75`](../Validation/75-cp13-page-tools-runtime-cross-functional-audit.md)
- Evidence class: `capability`
- Verification ladder: `6` for the named canonical local page, supported adapter, and read-only invocation
- Executor and date: A new Codex task (`01a0665e-005d-7323-86f7-e3fa56a0a0d6`) created by the primary session and run on 2026-09-03, Europe/London

## Exact identity under test

- Source root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Source state: Git branch `main`, `HEAD 7e555b6018732f8d637dffc5e77963ae4943a409`, plus the pre-existing working tree; the probe did not modify any project-authored source, test, or documentation file.
- Contract: `SK-MVP-0.2`
- Runtime: Node.js `v24.20.0`, selected through `/opt/homebrew/opt/node@24/bin`
- Codex task configuration: model `gpt-5.6-sol`, reasoning `medium`
- Browser: Codex In-app Browser, browser id `2`; no external, headless, or substitute browser
- Fixture: `NODE_ENV=test`, `LOCAL_FIXTURE_MODE=1`, `HOST=127.0.0.1`, `PORT=3193`, with isolated database `/tmp/sleepless-kingdom-cp13-canonical-01a0665e.sqlite`
- Page: `http://127.0.0.1:3193/`, title `Sleepless Kingdom`

## Question

Can the canonical game page expose the accepted CP-13 read tools through the genuine same-page WebMCP
adapter and complete one read-only invocation on a supported `gpt-5.6-sol` task?

## Procedure

1. Created the bounded local Codex task with the explicit `gpt-5.6-sol` model and `medium` reasoning.
2. Connected to the Codex In-app Browser and confirmed that an in-app browser was available.
3. Started the entrypoint-owned fixture with the task-local database and opened the canonical game page.
4. Read the page's native `webmcp` capability, fetched the registered tools through that adapter, and
   called `inspect_client_snapshot` with `{}` through the same page handle.
5. Stopped the fixture and checked that port `3193` was free. No gameplay command or state-changing
   page tool was issued.

The probe used no DOM or REST substitute, Playwright, headless automation, fake `modelContext`,
polyfill, or generic MCP server.

## Results

| Boundary | Result | Observation |
|---|---|---|
| Canonical page load | Pass | The local entrypoint served the page at HTTP `200`; the page title was `Sleepless Kingdom`. |
| In-app browser availability | Pass | Codex In-app Browser was available as browser id `2`. |
| Same-page WebMCP discovery/readback | Pass | The native page adapter returned exactly four read-only tools: `inspect_shelter_state`, `inspect_client_snapshot`, `inspect_missions`, and `inspect_mission_history`. |
| Read-only invocation | Pass | `inspect_client_snapshot({})` returned `agent_snapshot_v1` under `SK-MVP-0.2`, scope `player-a` / `shelter-a` / `sleepless-mvp-01`, with status `ok`. |
| Mutation absence | Pass | No write-capable tool was exposed or called; no gameplay command, event, outbox row, cargo, coin, mission, or snapshot mutation was produced by the probe. |
| Cleanup | Pass | The fixture stopped, port `3193` was released, and the task reported no project-authored file changes. Next runtime generated 24 existing ignored `.next/dev` files; the isolated database remains in `/tmp`. |

## Claim this evidence supports

In the named 2026-09-03 local session, a `gpt-5.6-sol` task configured with `medium` reasoning can use
the Codex In-app Browser's genuine WebMCP adapter to discover the four CP-13 canonical page reads and
invoke `inspect_client_snapshot` read-only through the same page context. This satisfies the canonical
page registration/readback plus one supported read-only invocation gate for `SK-TASK-061` at ladder
level 6.

## Claims this evidence cannot support

This record does not prove the continuation-gated `force_recall_soldier` registration or invocation,
Agent Signal delivery, Re-entry Core continuation, automatic thread wake, Receiver/Connector delivery,
fresh reread/recall after a business event, two independent browser contexts, production identity,
hosted continuity, public load, or judge reproduction. It is bound to one local origin, one fixture,
one browser session, one Codex Desktop environment, and one supported model configuration.

## Analysis and closure

- Classification: `capability` pass. The native adapter returned a concrete inventory and a concrete
  page-owned read result; no page-side registration claim was promoted without adapter evidence.
- The earlier [`SK-EVID-048`](SK-EVID-048-cp13-canonical-page-browser-attempt.md) remains a preserved
  historical gated attempt. This record adds the later positive result rather than rewriting that
  negative observation.
- The result closes the named canonical-page capability gate in `SK-TASK-061`; it does not close the
  separate Re-entry, external delivery, hosted, independent-browser, or judge gates.
- Revalidate if the model, reasoning setting, Codex Desktop/browser adapter, site-tools capability,
  page registration contract, canonical origin, fixture seed, `SK-MVP-0.2`, or runtime changes.
