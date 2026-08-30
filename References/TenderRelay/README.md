# TenderRelay Immutable Reference Package

**Status:** REFERENCE — immutable snapshot  
**Imported:** 2026-08-30  
**Source location at import:** local Downloads directory

This directory preserves the original concept package used to understand and formalize the
WebMCP re-entry workflow through a tender example. These files are inputs and reference
scenarios; they are not a selected app, live product specification, or final product name.
They must not be edited in place.

## Files and integrity

| File | SHA-256 | Size at import | Rule |
|---|---|---:|---|
| [`TenderRelay_Complete_Concept_Dossier.md`](TenderRelay_Complete_Concept_Dossier.md) | `1a5801f3a38ae41fa21a1871c657b8967b33a168103158c72dd89b6b2ff3852d` | 122,494 bytes | Frozen version 1.1; never edit in place |
| [`tenderrelay_architecture_overview.png`](tenderrelay_architecture_overview.png) | `d217f273600929e309164795826969f4a355f61b65cd040f0917940c924df491` | 1,623,346 bytes | Frozen companion diagram; never overwrite |

At import, each snapshot was byte-identical to its corresponding file in the local Downloads
directory.

## Authority

- Use the dossier to recover original reasoning, candidate contracts, risks, alternatives, and source trails.
- Use [`../../Docs/Core/`](../../Docs/Core/) for current requirements and system truth.
- Use [`../../Docs/Decisions/`](../../Docs/Decisions/) for accepted decisions.
- Use [`../../Docs/Scenarios/01-tender-reference-scenario.md`](../../Docs/Scenarios/01-tender-reference-scenario.md) for the current interpretation of the tender example.
- If the dossier evolves, import a new version under a new filename and record a new checksum. Do not replace version 1.1.

## Known interpretation rule

The dossier correctly distinguishes proven components from the unproven continuation bridge.
ADR-0002 preserves the bridge as a planning assumption while clarifying that TenderRelay's
tender portal is an example of the mechanism, not the selected web application.
