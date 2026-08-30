# Official Rules、資格與提交合約

研究快照：2026-08-28（Europe/London）

主要來源：[Devpost Official Rules](https://webmcp.devpost.com/rules)、[Devpost Overview](https://webmcp.devpost.com/)、[OpenAI Challenge page](https://openai.com/webmcp-challenge/)。

本文件是規則的操作性摘要，不是法律意見；若頁面更新，應重新核對原文。

## 1. 時間線：以 Official Rules 為 controlling source

| 事件 | 官方規則時間 | UTC | London（2026-08-28 時區規則） | HKT |
|---|---:|---:|---:|---:|
| Registration／Submission 開始 | 2026-08-25 11:00 Pacific | 2026-08-25 18:00 | 19:00 | 2026-08-26 02:00 |
| Registration／Submission 截止 | 2026-09-03 13:00 Pacific | 2026-09-03 20:00 | 21:00 | 2026-09-04 04:00 |
| Judging 開始 | 2026-09-04 10:00 Pacific | 2026-09-04 17:00 | 18:00 | 2026-09-05 01:00 |
| Judging 結束 | 2026-09-21 17:00 Pacific | 2026-09-22 00:00 | 01:00 | 2026-09-22 08:00 |
| 預計公布 winners | 約 2026-09-23 14:00 Pacific | 約 21:00 | 約 22:00 | 2026-09-24 05:00 |

**CONFIRMED：** 13:00 Pacific 是 Official Rules 的截止時間。Pacific 在 9 月為 PDT（UTC-7），所以換算為 20:00 UTC。

**CONFLICT LOG：**

- 現行 OpenAI Challenge page 顯示開放時間 12:00 Pacific、截止 13:00 Pacific；較新的 Netlify Challenge hub 也顯示截止 13:00 Pacific。
- 較舊 Netlify article 顯示截止 17:00 Pacific；OpenAI Community announcement 的 machine-readable deadline、Reddit repost 和部分宣傳材料亦接近／顯示 17:00 Pacific。這些是 historical discrepancy，不是現行 hard deadline。
- Devpost Updates、Devpost discussion manager 的澄清及 Official Rules 顯示 13:00 Pacific。
- Official Rules §12.4 說明若網站、廣告或其他材料不一致，Official Rules 優先。
- **RECOMMENDED：** 不要把多出的四小時當作 buffer；用 Rules 13:00 Pacific 作為硬 deadline，並自行提前 freeze。

### Marketing／support events（不是 legal deadlines）

OpenAI Challenge page 在本快照列出：

- 2026-08-25 15:00 Pacific：opening livestream。
- 2026-08-31 11:00 Pacific：office hours。
- 約 2026-09-23：winner announcement。

這些活動有助參賽，但不改變 Registration／Submission Period。實際 event link 和時間以 OpenAI／Devpost 當日頁面為準。

## 2. Sponsor、administrator 與參賽合約

- Sponsor：OpenAI OpCo, LLC，1455 3rd Street, San Francisco, CA 94158。
- Administrator：Devpost, Inc.，250 Broadway, Floor 24, New York, NY 10007。
- 免費參加，不需購買；付款不會提高勝率。
- 提交即代表 entrant 及 team members 同意 Official Rules，形成 entrant、sponsor、Devpost 之間的合約關係。

## 3. Eligibility

### 可參加

- 入境／居住地達到當地成年年齡的 individual。
- 居住在 OpenAI API 支援地區、且不屬排除地區的 individual。
- 由 eligible individuals 組成的 Team。
- 在支援地區已存在並已組織／註冊的 Organization，包括公司、非牟利組織、LLC、partnership 及其他 legal entity。
- 一名 eligible individual 可加入多個 Team／Organization，也可同時以 individual 身份參賽。
- Team 或 Organization 必須指定有權代表它提交的 Representative。

### 明確排除

- 不支援 OpenAI API 的地區。
- 當地法律或美國法律禁止參加／領獎的地區；規則列出 Belarus、Brazil、China、Hong Kong、Quebec、Russia、Crimea、Cuba、Iran、North Korea、Syria、Venezuela、Donetsk／Luhansk 等，並包括 OFAC 指定地區。
- Sponsor、Administrator、設計／製作／付費推廣／執行／分發 Hackathon 的 Promotion Entities，其員工、代表、agents、immediate family、household。
- Judges，或僱用 judge 的公司／個人，以及其 parent／subsidiary／affiliate。
- 會造成真實或表面 conflict of interest 的 individual／organization。

### 地區風險

**CONFIRMED：** Rules 明確列出 Hong Kong 為排除地區，並要求居住地支援 OpenAI API。

**INFERENCE／需書面澄清：** 本輪查到的 [OpenAI API supported countries](https://help.openai.com/en/articles/5347006-openai-api-supported-countries-and-territories) 清單沒有看到 Macau／Macao；規則也沒有在排除清單單獨列出 Macau。這不足以推定 eligible 或 ineligible。若參賽者居住澳門，應在投入不可逆時間前向 Devpost／Sponsor 取得書面 eligibility confirmation，並保留回覆。

## 4. 如何參加

1. 在 [webmcp.devpost.com](https://webmcp.devpost.com/) 建立／登入免費 Devpost account 並 join Hackathon。
2. 取得可用的 WebMCP 平台與工具。
3. 完成 Devpost Enter a Submission 頁面所有 required fields。
4. 在 Submission Period 結束前提交。

WebMCP 的官方測試入口：

- ChatGPT desktop app 的 in-app browser（實際 availability 受 rollout／workspace／model 影響）。
- Google Chrome 149+，開啟 chrome://flags/#enable-webmcp-testing 後 relaunch。

可選而非必要：

- Devpost Plugin；其條款明定它只是 helper，不是官方 source of truth，AI output 可能錯誤，entrant 仍須自行依 Rules 核驗。
- Netlify credits：rules 記載可申請 3,000 credits，名額、approval、申請表、2026-09-01 12:00 Pacific 申請截止及 2026-10-03 redeem deadline 以該頁／Netlify 實際狀態為準。

## 5. Project Requirements

作品必須：

- 是 WebMCP-powered web app，探索「開放 web 上 humans 與 agents 一起互動、協作、創作」。
- 能在 submission 指定的平台安裝／運行一致。
- 實際行為與文字描述及 demo video 相符。
- 是 Submission Period 內新建的 project，或在 2026-08-25 Submission Period 開始後對既有 project 作出有意義的 WebMCP extension。
- 若是既有 project，只評估 Submission Period 新增的工作；需用 timestamped commits 或等效紀錄清楚分開舊工作與新工作。
- 使用第三方 SDK、API、data 時，具備合法授權並遵守其 terms／licenses。

## 6. Submission Requirements：不可漏的材料

### A. Working live URL

- Judges 可透過 ChatGPT in-app browser 或啟用 WebMCP 的 Chrome 存取。
- 可在 ChatGPT Sites、Cloudflare、Vercel、Render、Netlify 或其他 provider host。
- 可要求 login；若需要，必須在 Submission Form 提供 credentials 和清楚 testing instructions。

### B. English description

須交代四件事：

1. 為什麼 use case 是 strong fit for WebMCP。
2. 如何帶來更好的 user experience。
3. 人與 agent 能共同完成什麼，以前很難或不可能完成。
4. WebMCP 如何實作。

### C. Public code repository

可用 GitHub、GitLab 或 Bitbucket。Repo 必須：

- 含 project 正常運行所需的所有 source code、assets、instructions。
- 有 open-source license file。
- license 在 repository page 頂部／About 可被偵測、看見。
- 包含類似以下 imperative registration 的 WebMCP code：

    document.modelContext.registerTool({
      name: "search_products",
      description: "Search the product catalog",
      inputSchema: { /* ... */ },
      execute: async (input) => { /* ... */ }
    });

### D. Public YouTube video

- 少於三分鐘；judges 不必觀看三分鐘以後的內容。
- 畫面清楚展示 project functioning。
- 有 audio，說明 built what 及 WebMCP used how。
- 上傳到 YouTube 並設定 public，submission form 填 link。
- 不得含未獲許可的第三方 trademarks、copyrighted music 或其他受版權保護材料。

### E. 其他合規項

- 所有材料須為 English；非 English 須附完整 English translation，包括 video、description、testing instructions 及其他提交材料。
- Project 必須是 entrant 原創、由 entrant 單獨擁有，不能侵犯 copyright、trademark、patent、contract、privacy 或其他權利。
- 可接受第三方技術協助，但 entrant 必須擁有最後 work product 的權利。
- 可使用 open-source software／hardware，但必須遵守 license，且 project 要在其上作出 enhancement。
- Project 不得在 Submission Period 結束前由 Sponsor／Administrator 提供的 financial or preferential support 開發或衍生，包括 funding、investment、contract 或 commercial license；若形成 real／apparent conflict，Sponsor 可 disqualify。

## 7. Multiple submissions

**CONFIRMED：** Official Rules 現行文字允許多於一個 Submission，但每個必須 unique 且 substantially different；每個 project 只能拿一個 prize，entrant 不會因多個 project 重複獲獎。

Devpost manager 曾在 discussion 澄清早期「只能一個」文字是 typo。仍然要把 Official Rules 現行頁面作最終依據；如果時間不足，集中做好一個 project 的 expected value 通常更高。

## 8. Testing、judging access 與 deadline freeze

- 必須提供 working project 的 website、functioning demo 或 test build。
- Private website 必須提供 credentials。
- Project 在 Judging Period 結束前要免費且不受限制地供 Sponsor、Administrator、Judges 測試／評估／使用。
- Judges 不必實際測試；可只根據 description、images、video 判斷。因此 repo、description、video 必須各自足夠清楚。
- 非普及的 proprietary hardware 可能被要求提供實體存取。
- Submission Period 結束後不能修改 submission；規則只保留 Sponsor／Devpost 允許的有限修正，例如移除侵權、個人資料或不當材料，而且必須實質保持相同。
- Devpost FAQ 額外建議：deadline 後不要碰 repo 或 live site；若要繼續開發，fork 到另一個 repo／部署。

## 9. Judging funnel 與 prizes

完整評分及實作對策見 [submission-evaluation-strategy](02-submission-evaluation-strategy.md)。法律規則的核心是：

- Stage One：pass/fail，主題 fit 且合理使用 required APIs／SDKs。
- Stage Two：四項 criteria 等權。
- Tie-break 依四項在規則出現的次序比較。
- Sponsor／Administrator 可自行決定 judging methodology，包括 expert panel、peer review、automated AI-driven analysis 或其組合；judges、rounds、panels 也可能改變。

OpenAI Challenge page 在本快照列出的 judges：

- Sarah Drasner — Distinguished Engineer, Chrome, Google
- Andrew Galloni — VP Research & Innovation, Cloudflare
- Jude Gao — MTS, Vercel／Next.js Core Team
- Ilya Grigorik — Distinguished Engineer, Shopify
- Alex Nahas — Creator of MCP-B
- Sean Roberts — VP Applied AI, Netlify
- Justin Rushing — Browser Agent Lead, OpenAI

這是 marketing page 的 listed roster，不是永久保證；Official Rules 允許 sponsor 改變 judges、使用未列出的 judges，且 judge 可能是 sponsor employee 或 third party。

Top 10 eligible submissions 每個 project 一份 prize bundle：

- OpenAI：USD 3,000 cash、@OpenAIDevs spotlight、Codex Micro、最多三名 team members 的 swag、最多三名 team members 一年 ChatGPT Pro。
- Cloudflare：USD 10,000 Cloudflare credits。
- Vercel：每月 USD 300 Vercel credits + 每月 USD 50 Gateway credits，12 個月。
- Render：USD 300 Render credits。
- Netlify：USD 500 cash。
- Shopify：USD 250 limited-edition Shopify Supply gear per winning submission。
- Google Chrome：每位 winning team member 三個月 Google AI Ultra（頁面約估 USD 300／人）。

因此，按規則逐項相加，現金部分是每個 winner USD 3,500（OpenAI 3,000 + Netlify 500），十個 winner 為 USD 35,000；credits、gear、subscription 不應誤稱為現金。Prize 需驗證身份／資格／創作角色，可能需 W-9 或 W-8BEN，稅務、外匯、銀行、申報和 withholding 由 winner 負責。

## 10–16. 常被忽略的法律條款

- **Entry Conditions and Release：** 提交者受 rules 及 judges decisions 約束，並對廣泛的 claim／expense／liability 作 release／indemnity；規則列出 technical failure、第三方權利、傷害、財產等風險。
- **IP：** project IP 仍屬 entrant；提交授予 Sponsor 為 judging 使用的 non-exclusive license。
- **Publicity：** Sponsor／Devpost 可在 Hackathon 期間及其後三年，用 contributor 的 name、likeness、voice、image 等推廣 Hackathon／結果，且可能公開展示 submission 的部分內容。
- **General：** Sponsor／Devpost 可因 fraud、technical failure、未預期因素等取消、暫停、修改或 disqualify；不得 tamper 或以違法、不當、破壞活動完整性的方式行動。
- **Official-source rule：** 官方 rules 可修改；若有歧義，應在 deadline 前以書面詢問。
- **Liability／arbitration：** 規則含 liability limitations、individual binding AAA arbitration、FAA、禁止 class action、New York substantive law 等法律安排，並有適用法例不能排除的例外。
- **Privacy：** 個人資料依 Devpost privacy／Terms 處理。

## 11. 操作性合規 checklist

### Eligibility gate

- [ ] individual／team／organization 身份和 representative 已確認。
- [ ] 居住／註冊地對應 OpenAI API supported country。
- [ ] 沒有 Hong Kong 或其他排除地區風險。
- [ ] 沒有 sponsor／judge／promotion entity conflict。

### Project gate

- [ ] 新 project 或有 timestamp proof 的 meaningful WebMCP extension。
- [ ] 所有第三方 code／API／data 有 license／terms record。
- [ ] live URL 在兩個指定測試面至少成功一個，最好兩個都成功。

### Submission gate

- [ ] URL、description、public repo、visible license、WebMCP code、YouTube video、English testing instructions 全部齊。
- [ ] public repo checkout 後可依 README 重跑，不依賴未說明的 private package／secret。
- [ ] demo video < 180 seconds 且 audio 可懂。
- [ ] freeze time 前下載／保存提交材料與外部連結清單。
