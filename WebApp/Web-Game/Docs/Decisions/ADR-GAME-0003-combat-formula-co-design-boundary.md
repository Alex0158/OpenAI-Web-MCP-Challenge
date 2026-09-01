# ADR-GAME-0003: Combat Formula Co-design Boundary

**Status:** ACCEPTED BOUNDARY; NUMBERS OPEN  
**Date:** 2026-09-01

## Decision

Use one explainable server-authoritative combat framework for soldier-versus-soldier,
soldier-versus-monster, and siege. The framework exposes effective health, attack, defense, tool or
weapon power, role matchup, level, speed or initiative, shelter defense, turret contribution, and
party diminishing returns as explicit inputs.

A readable placeholder is:

```text
damage = max(1, effective_attack × matchup_modifier + tool_power - effective_defense)
```

Exact values, round cadence, randomness, critical effects, and party aggregation will be co-designed
with concrete 1v1, PvE, and siege examples. No implementation may hide balance choices in client code
or unlogged random behavior.

## Consequences

The role and tool model can be built without prematurely locking a false balance. The combat module
must publish the final numbers, examples, and verification cases before implementation claims balance.

## Reopen triggers

Reopen when a new role, weapon, monster class, siege rule, or economic effect cannot be expressed by
the shared framework.
