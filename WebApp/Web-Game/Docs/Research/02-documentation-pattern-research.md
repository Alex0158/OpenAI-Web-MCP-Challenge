# Documentation Pattern Research

**Role:** Supporting documentation-pattern reference  
**Observed:** 2026-09-01

## Local repository pattern

The outer WebMCP Challenge repository uses a short root guide, a documentation map, canonical Core
truth, modular Mechanism contracts, Decisions for durable choices, Scenarios for concrete flows,
Research for evidence, Development for accepted execution, and Tasks for bounded non-terminal work.
ADR-0015 explicitly prefers independent authority and lifecycle boundaries, rejects a document per
source file, and avoids copying the full Emorapy tree when the product does not need that depth.

The game child adopts that principle with a smaller domain-oriented tree: Blueprint, World, Mechanics,
Characters, Design, Engineering, Scenarios, Research, Decisions, and Validation.

## Codex Memory pattern

The user's Codex Memory guidance reinforces source-of-truth-first, documentation-driven development:
keep canonical facts separate from assumptions and unknowns, preserve dated history, use concise
indexes and pointers, and reconcile docs with code, tests, runtime, and release evidence. Memory is a
workflow reference in this project; it is not game-domain authority.

## Named external reference

The exact phrase “Codeas Mirror” was not found as a canonical public project name during the initial
search. The owner subsequently clarified that “Codeas Mirror” means Codex Memory. The closest public
matches—`codex-mirror` repositories and CodeMirror-based WebMCP projects—were therefore not adopted
as the game documentation authority. The local repository's current governance and Codex Memory's
source/reference separation are the controlling patterns.

- [ChatGPT-KB/codex-mirror](https://github.com/ChatGPT-KB/codex-mirror)
- [VT WebMCP Devpost reference](https://devpost.com/software/vt-y4n8u0)
- [CodeMirror](https://codemirror.net/)
