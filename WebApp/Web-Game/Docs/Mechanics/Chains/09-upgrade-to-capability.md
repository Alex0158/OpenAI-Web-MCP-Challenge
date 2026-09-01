# Chain C09: Upgrade to Capability

**Status:** Working design; prices, caps, and active-mission projection are open

## Trigger and outcome

The player chooses a shelter upgrade and expects a visible change in sensing, roster, tools,
movement, defense, or turret capability. The chain ends with one committed projection or a typed
rejection.

## Ordered flow

1. The shelter page reads the current branch, level, prerequisites, cost, cap, and entity version.
2. `M03` checks shelter state and ownership; `M05` validates the requested branch and payment.
3. The server atomically deducts coins, increments the selected level, and records an upgrade event.
4. The affected capability projection becomes visible: sensing radius, roster quantity, soldier
   attributes, tool tier/yield, boots/movement, or turret power/quantity.
5. Existing field missions retain their committed role and loadout by default; a future exception
   must be explicit and versioned.
6. The dashboard and `M18` leaderboard projection consume the committed result.

## Failure branches

- Insufficient coins, invalid prerequisite, level cap, stale version, or disallowed shelter state
  rejects the request without charging the wallet.
- A breach lowers the relevant level through C05 rather than pretending that an upgrade succeeded.
- A projection worker is delayed; the page shows pending state and does not invent capability.

## Invariants and events

One idempotency key creates at most one upgrade. A field soldier cannot silently equip a new tool or
role halfway through a mission. Candidate events are `UpgradePurchased` and `CapabilityProjected`.

## Open decisions

Branch prerequisites, prices, level caps, quantity creation, breach-selected level, and whether
mobility is a separate branch remain `OPEN`.

## Related mechanisms

- [`../detail-05-shelter-upgrades-and-progression.md`](../detail-05-shelter-upgrades-and-progression.md);
- [`../detail-03-shelter-state-and-command.md`](../detail-03-shelter-state-and-command.md); and
- [`../detail-18-leaderboard-and-progression.md`](../detail-18-leaderboard-and-progression.md).

