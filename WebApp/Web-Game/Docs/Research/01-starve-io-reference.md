# Starve.io Reference

**Role:** Supporting external reference  
**Observed:** 2026-09-01, Europe/London  
**Source:** the open Starve.io browser tab, live page inspection, and official pages

## Verified browser observations

- The live page renders a top-down 2D game through an HTML5 canvas with `id="game_canvas"`.
- The observed canvas was approximately 1839 by 1297 pixels.
- The page shell exposes settings, market, starter kits, recipes, chrono, and quests around the
  game surface.
- The observed world contained a player, trees, stone, berries, water, monsters, an inventory,
  health/heat/hunger/thirst indicators, and a leaderboard.
- The page loaded an approximately 5.8 MB custom JavaScript bundle together with jQuery, Howler,
  `token.js`, Google login, Xsolla payment, advertising, and analytics integrations. These are
  client-surface observations, not a complete platform stack.
- The current page exposes client presentation controls for quality (`HIGH`/`LOW`), scale ratio, and
  no-aliasing. These controls support the reference's lightweight 2D feel, but they do not establish
  the game's rendering pipeline or server architecture.
- A response exposed Cloudflare and an `X-Powered-By: Express` header. This is a weak server-header
  clue, not proof of the complete origin architecture.
- The minified bundle contained XHR and fetch references. The absence of a literal WebSocket string
  is not evidence that WebSocket is absent because the bundle is obfuscated.

## Official behavior reference

The official site and changelog describe survival pressure, resource collection, crafting, biomes,
monsters, structures, and ongoing server-side behavior across tab closure or reconnection. The
official commands and configuration material also show adjustable world, resource, monster, and
building parameters.

- [Starve.io](https://starve.io/)
- [Starve.io Changelog](https://starve.io/changelog.html)
- [Starve.io Commands](https://starve.io/commands.html)

## What we may borrow

- A readable top-down world;
- strong visual resource nodes and monster pressure;
- tool progression that changes extraction value;
- a compact HUD for health, hunger, heat, inventory, and leaderboard; and
- server-managed continuity when the player leaves the page.

## What remains unknown

The public page does not establish Starve.io's database schema, authoritative tick model, pathfinding
implementation, complete realtime transport, deployment topology, or source repository. Our game
must define those boundaries from its own requirements and evidence.
