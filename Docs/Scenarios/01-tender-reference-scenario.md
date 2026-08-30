# Reference Scenario A — Tender Clarification Workflow

**Role:** REFERENCE CANDIDATE  
**Selected as demo app:** No  
**Source:** [TenderRelay Complete Concept Dossier](../../References/TenderRelay/TenderRelay_Complete_Concept_Dossier.md)  
**Last updated:** 2026-08-30

## 1. Purpose

This scenario maps the domain-neutral WebMCP re-entry workflow onto a tender/RFP process.
It exists to test and explain the mechanism. It does not determine the final application,
product name, customer, or challenge implementation.

## 2. Mechanism mapping

| Mechanism slot | Tender example |
|---|---|
| Workflow participant | Bidder or proposal lead |
| External actor | Buyer or tender reviewer |
| Workflow record | Tender response case |
| Persistent artifact | Bid response and supporting evidence |
| Initial state | Response preparation or submitted response |
| Re-entry offer | Return if a clarification is requested |
| Authorized event | clarification.requested |
| Waiting period | Time between initial response and buyer follow-up |
| Resumed state | Clarification response required |
| Initial tool roles | Read tender context, prepare bid draft, request re-entry setup |
| Resumed tool roles | Read clarification, continue response artifact |
| Human boundary | Commercial or legal approval before submission |

## 3. Why it is a strong explanatory scenario

- The later event is intrinsic to a real multi-stage workflow.
- The same case, documents, rationale, and artifact matter across stages.
- The authoritative portal state determines the correct next action.
- The Site Tool surface can change visibly after the clarification event.
- Acting from event data alone would be unsafe.
- Human commercial and legal judgment provides a clear consequence boundary.

## 4. Why it may not be the best challenge app

- Procurement terminology requires explanation.
- Real portals involve authentication, enterprise roles, confidentiality, and integration incentives.
- A local Receiver or special Agent setup may reduce judge reproducibility.
- Existing portal notifications and RFP automation narrow the market differentiation.
- The domain may require more UI, data, and policy detail than the three-minute proof needs.
- The reference dossier is intentionally broad and could pull the build toward protocol or
  enterprise infrastructure instead of one focused vertical slice.

## 5. Selection evidence still required

Before selecting this scenario, the team would need:

- a clear primary user and observed clarification workflow;
- a reason a portal operator would implement the re-entry offer and event;
- a self-contained synthetic portal that needs no private procurement integration;
- an exact initial and resumed Site Tool inventory;
- a minimal human approval surface;
- a clean-room Agent and browser path;
- a score against every candidate using the canonical selection framework.

## 6. Status rule

Do not copy bidder, tender, clarification, bid-submission, or procurement-specific language
into Core documents unless a new ADR selects this scenario. Refinements to the original
concept belong here or in a new scenario document; the immutable dossier remains unchanged.
