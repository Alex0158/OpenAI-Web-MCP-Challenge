# 研究判斷、project options 與決策框架

> **Status: DEPRIORITIZED REFERENCE.** The WebMCP re-entry workflow mechanism is the selected
> concept under [`Decisions/ADR-0002-separate-mechanism-from-demo-app.md`](Decisions/ADR-0002-separate-mechanism-from-demo-app.md).
> This broad option map remains useful as historical selection criteria but does not select
> the host application, product scope, positioning, or implementation.

研究快照：2026-08-28（Europe/London）

這份文件把已核對的規則和技術現況轉成 project selection judgment。它不是對任何 project 得獎的保證。

## 1. Evidence-backed thesis

目前最值得下注的不是「最複雜的 agent」，而是以下交集：

    具體 user pain
      + 已存在的 human workflow
      + same-page context / shared state
      + agent 的多步驟 delegation
      + 人的可見性與最後控制
      + 可在十日內完成、公開、可重現

理由：

- Official Rules 把 WebMCP Leverage、Execution、Potential Impact、Creativity & Ambition 等權；作品不能只靠其中一項。
- ChatGPT Site tools guide 將 document editor、dashboard、travel planner 作為自然 examples，且強調 agent 和 user 可在同一 live page／signed-in session 工作。
- Chrome best practices 要求 tools 單一職能、避免 overlap、描述清楚、處理 side effect 和錯誤。
- Judges 不必實際測試，可能只看 description、images、video，所以 value 必須在很短的 observable path 內成立。

## 2. Option map

| Option | 最小 end-to-end journey | WebMCP 的不可替代性 | 競賽優勢 | 主要 execution risk |
|---|---|---|---|---|
| Local-first notes／writing | 找 section → 摘要／提出 edit → 人 review → apply | agent 和人看同一 document context；diff／comment 可見 | 容易展示 human control、shared state、undo | content privacy、edit correctness |
| Data dashboard | 人指定問題 → agent 讀 filter／chart → compare → 產生 insight draft | agent 直接讀 page state、調整 filters、回到可見圖表 | impact 容易量化，tools 可窄化 | data leakage、分析 hallucination、結果過長 |
| Trip／project planner | 搜尋／比較 → 建立 itinerary／plan draft → 人調整 → confirm | live options、map/list state、proposal/apply 很自然 | 多步驟 delegation 明顯 | third-party API freshness、booking side effects |
| Creative editor／3D／music | agent 建立／變更 structured object → 人即時調整 → undo | agent 操作同一 canvas／timeline，UI feedback 即時 | Creativity & Ambition 和 WebMCP Leverage 都可見 | state sync、tool granularity、performance |
| Shared shopping／catalog | search → inspect variant → stage cart → 人確認 | session-aware cart 與 UI drawer 一致 | 既有 supporter／Shopify patterns 可參考 | payment、personal data、mutation trust |
| Guided workflow／education | 讀 context → 提議 next step → 建立 draft → 人 approve | agent 不是另開 chat，而是直接使用 current case | real audience 可說得具體 | domain safety、identity、責任邊界 |

這些是 workflow families，不是要複製 OpenAI Showcase 的作品。Showcase 中已有 Margin、WanderNote、Sunday Table、Paperie、Webroom、Cubecade、Crossword Desk 等 example；差異化必須來自新的 problem／loop，而不只是換 UI。

目前無法從本研究環境取得完整 Devpost project gallery：該頁要求 JavaScript／anti-bot verification。故以下 category map 是官方 examples 和 platform patterns 的 opportunity map，不是已提交作品的統計分布；不能據此宣稱某個 category 已飽和或勝率較高。

## 3. Recommended default choice

若目前沒有既有 product 或強 domain advantage，選擇：

> 一個小而完整、狀態可見、mutation 可逆的 collaborative editor／planner／dashboard workflow，核心 demo 只有一條 path，但至少包含 read、prepare 和受控 apply。

不建議一開始做：

- general-purpose agent platform；
- 要大量外部 API、支付或真實交易才能成立的產品；
- 依賴 proprietary hardware；
- 只有 backend agent、無 page state 的 MCP integration；
- 需要大量資料、私有服務或高額 credits 才能展示的 concept。

這不是因為上述方向不能參賽，而是它們在十日內同時滿足 live reliability、public repo、security、video、judge testability 的機率較低。

## 4. Project scoring worksheet

每個候選 idea 先用 0–3 分自評；任何硬 gate 不通過就停止，不以總分掩蓋資格問題。

| 問題 | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| real user pain | 沒有 | 假設痛點 | 有訪談／觀察 | 有具體頻率／成本／失誤 |
| WebMCP necessity | 普通 API 已足夠 | 有少量便利 | same page 明顯更好 | 沒有 WebMCP 就失去核心 loop |
| shared state visibility | 看不到 | 部分同步 | 主要 state 同步 | 每一步都可見且可驗證 |
| non-trivial leverage | 一個 toy tool | 兩個薄 wrapper | 3–4 個 domain tools | 多步驟、互補、帶 lifecycle／security |
| completeness | landing／POC | happy path | 有錯誤處理 | fresh deploy 可穩定完成 journey |
| impact evidence | slogan | persona | before／after | 可量化或可重現 user outcome |
| differentiation | clone | 換皮 | 有新 loop | 有清晰 domain insight 和新 interaction |
| public/reproducible | 私有 dependency | setup 不完整 | 可重現 | clean checkout、無 secret、全資產 |
| safety/recovery | unsafe | 有口頭承諾 | 有 validation／confirm | preview、audit、undo、untrusted handling |
| demo clarity | 需解釋 | 兩分鐘才明白 | 30 秒看懂 | 15 秒知道 value，三分鐘內證明 |

**RECOMMENDED gate：** eligibility、live deploy、imperative discovery、public repo/license、video/audio、English materials 是 binary gates，不接受用創意分補回來。

## 5. Judge-perspective reconstruction

下面是從規則、Chrome guidance 和官方 examples 推出的 judge likely questions；屬 **INFERENCE**：

### WebMCP Leverage

- 如果把 tools 移除，這個產品還剩下相同的 UX 價值嗎？
- agent 是否用了 page-specific context，而非只是呼叫外部 API？
- tools 是否形成一條有意義的 workflow？
- 每個 tool 的 side effect、schema 和 lifecycle 是否有設計？

### Execution

- 我能否從 live URL 在一分鐘內開始測試？
- video、repo 和 live app 是否是同一個版本？
- 如果第一次輸入錯、session expired 或 data empty，是否還像完成品？

### Potential Impact

- 哪一類人會真的用？
- before／after 有什麼可觀察差異？
- value 是節省時間、降低錯誤、增加創作能力，還是讓人作出更好決策？

### Creativity & Ambition

- 新的是什麼 interaction／workflow，而不是只換 model 或 UI？
- ambition 是否反映在 project scope，但沒有犧牲完成度？
- 是否能清楚說明與 showcase／既有 agent products 的不同？

## 6. WebMCP、MCP、browser automation 的邊界

| 技術 | 最適合 | 不應冒充 |
|---|---|---|
| WebMCP | agent 使用已打開網站的 live state、session、UI domain actions | 獨立 backend integration 或無 page context 的 API |
| MCP server | agent 不需開 webpage，直接連 service／database／API | same-page UI collaboration 的完整證明 |
| Browser automation | 操作沒有 WebMCP 的現有網站，或做 end-to-end regression | 具有明確 schema／permission boundary 的 site-native tools |
| 普通 human UI | 人直接操作、fallback、確認和觀察結果 | agent 的 structured capability contract |

**INFERENCE：** 最具說服力的 entry 可同時有 human UI、WebMCP tools 和必要的 backend，但 demo 要把 WebMCP 貢獻獨立展示出來。

## 7. Provider selection judgment

Challenge 允許任何 hosting provider；supporter credits 是 acceleration，不是 product requirement。

- 若已熟悉 Vercel／Netlify／Cloudflare／Render，優先選能最快提供 stable public URL、logs、rollback 和簡單 auth 的 provider。
- 不要為了拿 credits 引入新的 infrastructure、private integration 或 time-consuming migration。
- ChatGPT Sites 可能最短，但有 paid ChatGPT plan、地區／workspace availability 等限制；不能把它當唯一 deployment fallback。
- Cloudflare、Vercel、Shopify、Netlify 的 starter／example 適合作為 pattern source；必須保留自己的 implementation、license 和 differentiated workflow。

## 8. Risks requiring written clarification

以下不能靠「大家應該都這樣」自行定案：

- browser extension 只 consume WebMCP tools，是否算符合「WebMCP-powered web app」；
- pre-existing private backend 能否保持 private，而 public repo 只放 WebMCP layer／client／docs；
- public repo 的必要 dependency 若是 private／auth-gated，是否仍符合 all necessary source/assets/instructions；
- 替代 deadline 宣傳時間是否曾正式 amendment Official Rules。

規則 §12.6 要求在 deadline 前書面詢問歧義。未獲答案前，採最保守可合規 path：public web app expose tools、public/reproducible dependency chain、以 Rules 13:00 Pacific 截止。

## 9. Minimum viable research-to-build handoff

在 researcher 把工作交給 builder 前，輸出應至少包含：

- 一句 product thesis 和一個具體 persona。
- 一條 60–90 秒 human + agent journey。
- tool inventory：name、input、read/write、result、confirmation、failure。
- live URL、repo、license、deployment owner。
- test prompts：direct、ambiguous、invalid、failure、no-WebMCP。
- 三分鐘 video storyboard。
- license／third-party／data provenance record。
- eligibility／deadline／freeze decision。

如果這些資料尚未齊，不應把 product 判為「ready to build」。
