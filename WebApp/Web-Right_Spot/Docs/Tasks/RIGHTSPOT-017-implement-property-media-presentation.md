# RIGHTSPOT-017: Implement bounded property-media presentation

**Type:** `implementation`  
**Lifecycle:** `in_progress`  
**Priority:** `P1` for evaluator-facing rental-marketplace credibility  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-01  
**Depends on:** ADR-RS-0009; closed `RIGHTSPOT-014`; closed `RIGHTSPOT-007`

## Task Control

- Type: `implementation`
- Lifecycle: `in_progress`
- Priority: `P1`
- Owner: Main RightSpot thread
- Objective: Replace the two current tenant listing media placeholders with reviewed, deterministic,
  local synthetic property imagery without changing listing DTOs, routes, workflow, or authentication.
- Current increment: `RS-WO-017-01` has completed the main-thread-controlled asset
  provenance/generation/import gate. The three-file manifest and review evidence are now available
  before any UI Builder uses them.
- Next gate: Dispatch one shared media primitive Builder. Tenant integration and independent browser
  verification remain later checkpoints under this Task.
- Execution posture: `ASSET_GATE_READY`; UI source remains frozen until the shared primitive Builder is
  dispatched with the reviewed manifest as a read-only input.

## Accepted implementation boundary

The current seeded listing identity is `listing-primary`, `listing-north`, and `listing-riverside`.
The first media slice uses one primary local image per listing. The asset path is resolved through an
explicit manifest entry matching both the listing ID and its `imageKey`; no filename concatenation,
array-index selection, default image, remote URL, or implicit old-version fallback is allowed.

Images are synthetic and illustrative. They must contain no people, logos, readable text, documents,
watermarks, maps, license plates, or identifiable personal/address data, and must not be presented as
evidence of the actual property, condition, furnishings, view, dimensions, availability, safety, or
legal status. A visible disclosure must say that the image is synthetic/illustrative.

## RS-WO-017-01 — Generate, review, and import the local asset pack

**Role:** Main-thread Asset Producer/Reviewer  
**Status:** `ASSET_GATE_READY`  
**Parallelization:** `SERIAL_ASSET_GATE` — must finish before the shared media primitive or tenant wiring uses the assets  
**Risk profile:** `Standard` — local generated files and manifest provenance, with no product-domain change  
**Supporting worker:** None; binary generation and content review remain main-thread-owned  
**Source baseline:** `f93ae6b` product source plus the reviewed media proposal baseline `8fe5976`; collaborator-owned dirty and untracked paths remain outside this Work Order  
**Dispatch state:** `READY_FOR_BUILDER_DISPATCH`  
**Next gate:** Dispatch `RS-WO-017-02` with the asset pack and manifest frozen as read-only inputs  
**Ownership:** The main thread owns generation/import/review. No supporting worker may alter the asset pack or manifest during this gate.

### Intended asset write set

- `public/listings/listing-primary.v1.webp` (or the explicitly reviewed final local format)
- `public/listings/listing-north.v1.webp` (or the explicitly reviewed final local format)
- `public/listings/listing-riverside.v1.webp` (or the explicitly reviewed final local format)
- `src/ui/shared/listing-media-manifest.ts`

The final format may change from WebP only if the main thread records the reason and verifies the
target browser. Do not add a media database, upload model, gallery, remote URL, or runtime generation.

### Required manifest fields

Each entry must bind:

- `listingId` and `imageKey`;
- explicit local `src`;
- asset version, width, height, and aspect ratio;
- reviewed `objectPosition`;
- informative alt text that describes only visible scene content;
- visible synthetic/illustrative disclosure;
- generation/provenance method, review status/date, and SHA-256.

The manifest must be an allowlist and must fail closed for an unknown key or listing/key mismatch.
Assets must not be deleted during rollback; restore an earlier reviewed manifest pointer instead.

### Asset review gate

Before handoff, inspect every generated image for prohibited or misleading content, verify its actual
dimensions and hash from the local file, and record the result in the manifest. The main thread must
not claim copyright/licensing approval beyond the documented generation/provenance basis. Do not use
real property photography or scrape Rightmove imagery.

### Asset gate evidence — 2026-09-01

`ASSET_GATE_READY` is recorded on the main thread. All three assets were generated with the built-in
OpenAI image-generation tool from synthetic, generic rental-interior prompts, visually inspected after
WebP import, and checked for people, readable text, logos, brands, watermarks, maps, documents, license
plates, landmarks, and identifiable address/location cues. None were present. The images are not
property evidence and do not add listing facts.

The source PNGs were 1536×1024. The committed local assets were encoded as WebP with `cwebp 1.6.0`
at quality 84; each output remains 1536×1024 and 3:2. SHA-256 values below were computed from the
committed WebP bytes and are mirrored in `src/ui/shared/listing-media-manifest.ts`:

| Listing identity | Local asset | Dimensions | SHA-256 |
|---|---|---:|---|
| `listing-primary` + `listing-primary` | `public/listings/listing-primary.v1.webp` | 1536×1024 | `526500a0c45376d9dbf6e132be0902e3214ed7656b8ebd9fad28e20ea9fffde7` |
| `listing-north` + `listing-north` | `public/listings/listing-north.v1.webp` | 1536×1024 | `b7a5fae3bf3c9235ef58fa88f530235d60b6f82d54cc6fbd70cc6302b8d8a0f6` |
| `listing-riverside` + `listing-riverside` | `public/listings/listing-riverside.v1.webp` | 1536×1024 | `18c37a78ed75cf33f5acbcc9eaef48261048f1396c475ebe8c25579c39259b11` |

The manifest records `OpenAI built-in image generation` as the provenance method and explicitly
states that no external source was imported. This is a generation record, not a legal licensing
opinion. The pinned Node `24.20.0` / npm `11.19.0` runtime verified all manifest hashes and
`npm run typecheck` passed. UI rendering, browser loading/error behavior, and accessibility remain
unverified until `RS-WO-017-02` through `RS-WO-017-04`.

### Forbidden actions

- Do not change `Listing`, `TenantListing`, shared workflow DTOs, routes, APIs, domain/persistence,
  authentication, Operations, WebMCP, Cloud Receiver, WebRTC, Redis, or deployment.
- Do not modify `app/globals.css`; shared media styling belongs to the later primitive checkpoint.
- Do not add assets for agent surfaces because no current agent media consumer exists.
- Do not use a remote URL, external CDN, runtime generation, a shared image masquerading as listing
  evidence, or a fallback to another listing/version.
- Do not delete existing files or change collaborator-owned dirty/untracked paths.

### Return gate

Record `ASSET_GATE_READY` or `ASSET_GATE_BLOCKED` in the main-thread task history with exact files,
dimensions, SHA-256 values, provenance/content review, format decision, and any skipped evidence. Only
after `ASSET_GATE_READY` may the main thread dispatch the shared media primitive Builder.

## Later checkpoints (not dispatched)

### RS-WO-017-02 — Implement the shared listing media primitive

**Role:** Builder → independent Verifier  
**Status:** `GATED`  
**Allowed write set:** `src/ui/shared/listing-media.tsx`, `src/ui/shared/listing-media.module.css`, `tests/ui/listing-media.test.ts`  
**Dependency:** `RS-WO-017-01 ASSET_GATE_READY`  
**Boundary:** Native `<img>`, exact manifest resolution, fixed 3:2 frame, loading/error/missing/mismatch
  state, alt/disclosure semantics, no fallback substitution, no network dependency. No route/API/domain
  or global CSS edits.  
**Verification:** Focused manifest/error tests, typecheck, build, diff, responsive/accessibility static
  checks, and isolated browser asset/failure evidence.

### RS-WO-017-03 — Replace tenant listing placeholders

**Role:** Builder → independent Verifier  
**Status:** `GATED`  
**Allowed write set:** `src/ui/tenant/tenant-discovery-page.tsx`, `src/ui/tenant/tenant-listing-page.tsx`, `src/ui/tenant/tenant.module.css`  
**Dependency:** `RS-WO-017-02` independently verified and integrated  
**Boundary:** Replace only the two current placeholders with the shared primitive; preserve listing
  data, request flow, responsive/accessibility requirements, and technical disclosure boundaries.

### RS-WO-017-04 — Verify integrated property media

**Role:** Independent Verifier  
**Status:** `GATED`  
**Dependency:** `RS-WO-017-03` integrated  
**Evidence:** Exact asset association, dimensions/rendering, disclosure, missing/corrupt fallback,
  no external requests, no cross-listing substitution, 320/390/768/1440 responsive behavior,
  keyboard/reduced-motion checks, and existing suite/build/diff evidence.

## Non-goals

- No agent request media, Favourite/Information Request media, upload/gallery management, user media,
  remote asset service, rights-management system, image moderation service, or production CDN.
- No new listing facts inferred from generated images.
- No WebMCP, Cloud Receiver, external auth, workflow/domain/API, or deployment change.

## Closure gate

Close this Task only after the asset gate, shared primitive, tenant integration, and independent
integrated browser verification all pass, or explicitly defer the remaining visual work with its
residual risk. Preserve local assets on rollback; do not delete them to hide a mapping failure.

## Reopen condition

Reopen if media becomes user-uploaded, remote, multi-image, video, property-evidence-bearing, agent-
visible, or requires a new listing/media lifecycle or external service.
