# Community、澄清與衝突紀錄

研究快照：2026-08-28（Europe/London）

這份文件特意把「有人問過」和「官方已回答」分開。社群討論可以指出風險，但未經 organizer 書面確認，不能當作規則 waiver。

## 1. Deadline discrepancy

| Source | 顯示內容 | Weight |
|---|---|---|
| Devpost Official Rules | Registration／Submission end 2026-09-03 13:00 Pacific | controlling |
| Devpost Updates | 2026-09-03 13:00 Pacific reminder | high operational |
| Devpost manager discussion reply | 2026-09-03 13:00 Pacific | high clarification |
| OpenAI Challenge marketing page（current snapshot） | 開放時間顯示 12:00 Pacific；close 顯示 13:00 Pacific | current marketing；deadline 與 Rules 對齊 |
| Netlify article | close 曾顯示 17:00 Pacific | older supporter marketing；stale conflict |
| Netlify Challenge hub（current snapshot） | close 顯示 13:00 Pacific；winner 顯示 Sep 22 | newer supporter page；close 與 Rules 對齊，winner 仍次於 Rules |
| OpenAI Community announcement | machine-readable date 接近 17:00 Pacific | older community announcement；stale conflict |
| Reddit repost of OpenAI announcement | 顯示 17:00 Pacific | low-confidence community mirror |

結論：現行高權威／高操作價值頁面已對齊 13:00 Pacific；仍以 Official Rules 13:00 Pacific 為 hard deadline。把 17:00 及其他時間保存作 historical discrepancy evidence，不用作可延後的理由。Rules 同時寫明 official rules 在 conflict 時優先。

## 1B. Competition-surface evidence gap

Devpost project gallery 有兩個互相印證的 access observation：direct HTTP fetch 目前回應「hackathon managers haven't published this gallery yet」，而 web browsing route 曾回應 JavaScript／AWS WAF anti-bot verification。兩條路都未能取得可核對的 project list；因此沒有把搜索引擎索引到的個別 participant portfolio 當作完整 competitor census。

Participants page 的 direct HTTP fetch 目前要求登入才能瀏覽名單；overview／rules／resources／search cache 的 participant count 也曾顯示約 365、2,907、3,420 等不同 snapshot。這些差異可能來自頁面 state、cache、登入和 indexing timing；只能標記 VOLATILE，不能用來計算勝率或市場份額。

## 1C. Dynamic update copy discrepancy

本輪讀到的 [Devpost Updates](https://webmcp.devpost.com/updates) 最新 build reminder 標題寫「6 days left to build」，正文卻寫「7 days prime building time left」。這是動態 marketing copy 的內部不一致，不會改變 Rules 的 timestamped deadline；只保存作頁面 freshness／copy evidence，不用於計算剩餘時間。

## 1A. Submission video wording discrepancy

Official Rules 明確要求少於三分鐘、public YouTube、有 audio 的 functioning demo。Devpost Resources FAQ 的其他答案也明確回答 demo video required，但本輪抓到的 FAQ 文本在「Do judges build my project from scratch?」答案內出現「Since there's no video」字樣，與同頁及 Rules 不一致。

結論：視為 FAQ copy typo／頁面 artifact；video 仍是 hard requirement，不能因該句話省略。

## 2. Multiple submissions clarification

來源：[Devpost topic 44943](https://webmcp.devpost.com/forum_topics/44943-clarification-on-submission-limit-one-entry-per-entrant)。

Devpost manager Shawni Devpost 的答覆指出：

- 早期「一個 entrant 只能一個 entry」是 typo。
- 可以提交多於一個 project，但各 project 必須 unique／substantially different。
- 每個 project 只可獲一份 prize，entrant 不會重複獲獎。
- deadline 是 1:00 pm Pacific。

現行 Rules §4 的文字已是「may submit more than one」。若只有一個 project 做到 complete、reliable、clear demo，集中資源的 expected value 通常較高。

## 3. Unresolved: browser extension consuming tools

來源：[Devpost topic 44989](https://webmcp.devpost.com/forum_topics/44989-does-a-browser-extension-that-consumes-webmcp-tools-qualify-or-must-the-submission-be-a-web-app-that-exposes-them)。

問題是 browser extension 若只 consume WebMCP tools，是否符合 Rules 所說的 WebMCP-powered web app，還是必須 submission 本身 expose tools。研究快照中未看到 sponsor／Devpost authoritative answer。

保守判斷：

- Rules 用語是 build a WebMCP-powered web app。
- judge test path 期待 live URL 可 discovery／test。
- 只有 consume tools 的 extension 可能是 adjunct，不能把它當作核心合規證明。

操作建議：核心 project 讓 public web app expose imperative tools；extension 如要存在，只作 optional client／enhancement。若 extension 是 project 核心，deadline 前向 Devpost 取得書面 clarification。

## 4. Unresolved: private pre-existing backend

來源：[Devpost topic 44963](https://webmcp.devpost.com/forum_topics/44963-can-a-pre-existing-proprietary-hosted-backend-remain-private)。

參賽者詢問 pre-existing proprietary hosted backend 可否保持 private，而公開 WebMCP layer、client、docs。沒有看到 organizer authoritative answer。

Rules 的相關 constraints：

- pre-existing project 只評估 Submission Period 內新增的 meaningful WebMCP work；
- public repo 要含 all necessary source code, assets and instructions required for project to be functional；
- project 可 auth，但要提供 credentials；
- entrant 要擁有 work product，並有權使用第三方／private components。

保守 path：如果 private backend 是 live app 正常運行不可替代的必要部分，public repo completeness 和 judge reproducibility 會有風險。應提供 public mock／local replacement、清楚邊界、測試 credential 和完整 explanation，或取得書面 waiver；不能自行宣稱 private backend 合規。

## 5. Unresolved: private dependency

來源：[Devpost topic 44950](https://webmcp.devpost.com/forum_topics/44950-are-private-repo-dependencies-allowed)。

問題是 auth-gated Composer／其他 private dependency 是否允許；研究快照未見 organizer answer。

保守 path：避免 private dependency；若無法避免，至少提供 public lockfile／可替代 implementation／setup instructions 和 license proof，並在 deadline 前取得書面確認。因為 public repository 必須含正常運行所需的 source、assets、instructions，private dependency 是可重現性直接風險。

## 6. Anecdotal credits issue

來源：[Devpost topic 44988](https://webmcp.devpost.com/forum_topics/44988-netlify-and-vercel-credits-issues)。

一名參賽者報告 Vercel、Netlify、Render credits 尚未收到回覆；這不是官方政策或普遍失敗證據，只能說明 credits delivery 可能不是即時的。

操作建議：把 credits 當 bonus；先用不依賴 supporter grant 的 deployment path。不要因等待 credits 卡住 vertical slice。

## 7. How to ask for a binding clarification

Rules §12.6 方向是 deadline 前書面詢問 ambiguity。問題應：

1. 引用 exact Rules section 和 project fact。
2. 一次只問一個 binary／narrow question。
3. 說明希望得到的是 eligibility／submission compliance clarification。
4. 保留 timestamped reply、sender identity、完整 thread URL。
5. 若未獲明確 answer，不把 silence 當 consent。

建議問題格式：

    Under Section 4, would a submission be eligible if [precise architecture]?
    The public repo contains [exact materials], while [component] remains private
    because [reason]. Judges can test using [URL/credentials].
    Please confirm whether this satisfies the Project and Submission Requirements.

## 8. Research boundary

- 本文件沒有把 participant count、credits quota、forum silence 或其他 entrant 的 experience 當成 legal fact。
- source page 若被更新，需保留新 observation date 和 old conflict，不應刪除歷史 evidence。
- 任何 eligibility／deadline／private code 重大決定，都應回到 Official Rules 和 written clarification。
