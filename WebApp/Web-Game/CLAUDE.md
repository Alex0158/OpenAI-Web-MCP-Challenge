# Claude Code Entry Point

@AGENTS.md

## What this file is

This file exists only to load [`AGENTS.md`](AGENTS.md) at session start. It owns no rule of its own.

[`AGENTS.md`](AGENTS.md) is the single contributor authority for this application. Every boundary,
routing, language, registration, engineering, verification, and claim rule lives there or in the
documents it routes to. If this file and `AGENTS.md` ever disagree, `AGENTS.md` wins and this file is
wrong.

## Session start

Start a session from this directory. Guidance files load from the working directory and its parents,
so running from the repository root loads the outer WebMCP Challenge guide instead of this one, and
the outer guide does not describe this application's process.

If the import above did not load, read [`AGENTS.md`](AGENTS.md) before acting.
