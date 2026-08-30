# Requirement-to-evidence completion audit

研究快照：2026-08-28（Europe/London）

這份 audit 對照原始任務「研究 OpenAI WebMCP Challenge 的規則、分析、判斷、觀點、參賽／project 資訊，並整理到 reference folder」逐項核對已保存的 evidence、缺口和邊界。它是 research deliverable audit，不是任何特定 project 的 submission-readiness sign-off。

## 1. Coverage result

| Requirement | Evidence location | Status | Boundary |
|---|---|---|---|
| Official rules、eligibility、dates、submission、judging、prizes、legal terms | [01 - Official Rules](01-official-rules.md)、[source index](../References/WebMCP/00-source-index.md) | COVERED | Rules page、eligibility interpretation 和 sponsor amendments 仍可能變動 |
| Participation logistics、registration、testing、freeze、supporter credits | [01 - Official Rules](01-official-rules.md)、[01 - Supporter Resources](../References/Other/01-supporter-resources.md) | COVERED | credits、quota、rollout、provider response 標記為 VOLATILE |
| Submission strategy、evaluation interpretation、demo／English／repo planning | [02 - Submission and Evaluation Strategy](02-submission-evaluation-strategy.md)、[04 - Research Judgment and Project Options](04-research-judgment-and-project-options.md) | COVERED | scoring strategy 是 INFERENCE／RECOMMENDED，不是 judge promise |
| WebMCP spec、API、Chrome／ChatGPT execution model、security、verification | [03 - Technical Build Verification](03-technical-build-verification.md)、[01 - Spec Snapshot](../References/WebMCP/01-webmcp-spec-snapshot.md)、[02 - Platform Snapshot](../References/WebMCP/02-chrome-chatgpt-platform-snapshot.md) | COVERED | draft spec、browser flag、rollout 和 call shape 需在實際版本 smoke test |
| Broader architecture、MCP／browser automation comparison、security、business、future directions | [WebMCP Analysis dossier](../References/WebMCP_Analysis/README.md) | COVERED | 這是既有 broader dossier；本輪沒有把它冒充 Challenge legal source |
| Supporter／provider perspectives、starter、deployment routes | [01 - Supporter Resources](../References/Other/01-supporter-resources.md)、[source index](../References/WebMCP/00-source-index.md) | COVERED | provider pages、live demos 和 credits 會變動 |
| Community questions、manager clarification、conflicting claims、unresolved risks | [02 - Community and Conflict Log](../References/Other/02-community-and-conflict-log.md) | COVERED WITH OPEN ITEMS | 已分開 official answer、anecdote、silence 和 inference |
| Project gallery、participant landscape、competitor census | [02 - Community and Conflict Log](../References/Other/02-community-and-conflict-log.md) | PARTIAL / UNAVAILABLE | direct gallery page says managers have not published it；另一條 browsing route hit WAF，participants list requires login；沒有把搜尋索引當完整 census |
| Actual project implementation、live deployment、runtime smoke test、Devpost submission | [README](../README.md)、[03 - Technical Build Verification](03-technical-build-verification.md) | NOT CLAIMED / OUT OF SCOPE | 本資料庫沒有宣稱任何 project 已 build、deploy、test 或 submit |

## 2. Decision-critical facts that are currently usable

| Fact | Current conclusion | Evidence label |
|---|---|---|
| Submission deadline | 2026-09-03 13:00 Pacific（20:00 UTC、21:00 London、2026-09-04 04:00 HKT） | CONFIRMED by Official Rules；current OpenAI／Netlify close also aligns |
| Old 17:00 Pacific materials | Historical stale discrepancy；不能當 buffer | CONFIRMED observation；Rules §12.4 controls |
| Core submission shape | Working hosted web app + public repo/license + English description/translation + public YouTube under 3 minutes with audio + real WebMCP implementation | CONFIRMED from Rules／Resources |
| Judging | Stage One pass/fail baseline followed by equal weighted criteria；listed judge roster is subject to change | CONFIRMED with VOLATILE roster／methodology caveat |
| ChatGPT interoperability | Current guide is narrower than Chrome: imperative top-level page tools are common-denominator path；declarative／iframe behavior is not assumed | CONFIRMED platform docs + RECOMMENDED engineering inference |
| Macau／Macao eligibility | OpenAI supported-country list snapshot did not show Macau；Hong Kong is explicitly excluded in Rules；this is not enough to make a legal eligibility conclusion | UNRESOLVED；written sponsor clarification required |
| Browser extension-only consumer | No authoritative answer found | UNRESOLVED；keep public web app as compliance anchor |
| Private pre-existing backend / private dependency | No authoritative answer found; reproducibility and public-repo completeness risk remains | UNRESOLVED |
| Credits and participant count | Useful for operations only, not guaranteed entitlement or competition math | VOLATILE / ANECDOTAL where marked |

## 3. What this package deliberately does not claim

- 沒有把任何 project concept 當成已獲主辦方批准，也沒有替使用者註冊、提交、部署、聯絡 sponsor 或申請 credits。
- 沒有把 WebMCP draft spec、Chrome origin trial／flag、ChatGPT rollout 或 provider starter 當成穩定 production contract。
- 沒有把 project gallery 擋住、participant count snapshot、forum 沉默或單一參賽者經驗轉成 legal fact。
- 沒有刪除 `Docs/Expired/` 內既有材料，也沒有改動既有 `References/WebMCP_Analysis/` broader dossier；兩者仍由主 README 對接。

## 4. Refresh triggers before using the research to submit

1. 再開 [Official Rules](https://webmcp.devpost.com/rules)、Resources、Updates 和 relevant forum topics；確認沒有 amendment、deadline change 或新的 manager clarification。
2. 若參賽者所在地、private backend、private dependency 或 extension-only architecture 影響 eligibility，保留 deadline 前的 written clarification，不以 silence 當 consent。
3. 對實際 project 逐項跑 [submission hard gates](../README.md#submission-hard-gates)，並在目標 Chrome／ChatGPT surface 做 discover／execute／side-effect smoke test。
4. 若 project gallery 恢復可讀，另建 timestamped project census；在此之前維持「competition surface evidence gap」結論。

## Audit conclusion

Challenge research 的要求已在本資料夾內以 rules、technical、strategy、supporter、community、source index 和既有 broader dossier 覆蓋；剩餘項目已明確標為 volatile、unresolved 或 unavailable，沒有被靜默填補。研究快照可交付，但任何正式參賽決定仍須按 refresh triggers 重新驗證。
