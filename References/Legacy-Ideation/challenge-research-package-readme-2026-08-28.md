# OpenAI WebMCP Challenge 研究資料庫

研究快照：2026-08-28（Europe/London）

這是一份面向參賽決策、產品設計、技術實作、提交與賽後核驗的研究資料庫。所有結論都以可追溯來源為基礎；動態頁面、社群回答和推論不會冒充官方硬規則。

## 一句話結論

要成為合規且有競爭力的參賽作品，核心不是在頁面上加一個工具，而是交付一個可公開測試、以 WebMCP 真正改善人與 agent 共同完成工作的完整 web app；官方規則目前把提交截止時間定為 2026-09-03 13:00 Pacific Time（20:00 UTC、21:00 London、2026-09-04 04:00 HKT）。

建議內部 freeze time 至少提前六小時：2026-09-03 15:00 London／22:00 HKT。這是風險控制建議，不是官方截止時間。

## 研究狀態與範圍

- 本機工作路徑不是 Git repository；現有資料夾為 WebMCP_Challenge/。除分類目錄和 .DS_Store 外，另有一組既有的 WebMCP_Analysis 深度研究文件，本次 Challenge-specific 文件已透過主索引與它對接。
- 本資料庫不替任何特定 project 宣稱已完成、已部署或已提交；目前只完成 Challenge research。
- 研究範圍包括：官方規則、時間線、資格、提交材料、評分、獎項、WebMCP spec、Chrome 與 ChatGPT 執行面、supporter 資源、showcase、社群澄清、未解答問題、產品策略與驗收清單。
- 研究日期重要：Hackathon 仍在進行，Devpost 頁面、credits、participant count、Chrome／ChatGPT rollout 和 FAQ 可能改變。

## 來源優先級

遇到衝突時按以下順序處理：

1. Devpost Official Rules（法律硬規則）。
2. Devpost 官方網站、Resources、Updates，以及 Devpost manager 的明確澄清。
3. OpenAI Challenge 頁面與 OpenAI 官方 ChatGPT Learn／Developer 內容。
4. WebMCP draft spec、Chrome 官方文件，以及各 supporter 的官方文件／repo。
5. 社群討論、參賽者個案、部落格與推論。

最重要的例子是 deadline：現行 OpenAI Challenge page、Devpost Official Rules、Devpost Updates／manager clarification，以及較新的 Netlify Challenge hub 都顯示 13:00 Pacific；較舊 Netlify article、OpenAI Community announcement、Reddit repost 和部分宣傳材料仍顯示 17:00 Pacific 或等價時間。Official Rules §12.4 明定官方規則優先，因此應以 13:00 Pacific 作 hard deadline，並保留舊材料作 historical discrepancy evidence。

## 建議閱讀順序

1. [官方規則與資格底稿](Docs/01-official-rules.md)
2. [提交、評分與參賽策略](Docs/02-submission-evaluation-strategy.md)
3. [技術、security 與 verification](Docs/03-technical-build-verification.md)
4. [研究判斷與 project option framework](Docs/04-research-judgment-and-project-options.md)
5. [官方及一手來源索引](References/WebMCP/00-source-index.md)
6. [WebMCP spec snapshot](References/WebMCP/01-webmcp-spec-snapshot.md)
7. [Chrome／ChatGPT platform snapshot](References/WebMCP/02-chrome-chatgpt-platform-snapshot.md)
8. [Supporter 資源](References/Other/01-supporter-resources.md)
9. [衝突、澄清與未解答問題](References/Other/02-community-and-conflict-log.md)
10. [Requirement-to-evidence completion audit](Docs/05-requirement-evidence-audit.md)
11. [既有深度 WebMCP Analysis dossier](References/WebMCP_Analysis/README.md)

第 11 項是本資料夾原已有的 broader WebMCP research：包含 architecture、API、MCP／browser automation comparison、security／privacy、developer guidance、business value、future hypotheses、academic signals 和 decision tests。它不是 Challenge legal rule，但應與本套 Challenge-specific 文件一起使用；其完整來源表在 [09 - Research Log and Source Register](References/WebMCP_Analysis/09-Research-Log-and-Source-Register.md)。

## 文件中的證據標記

- **CONFIRMED**：官方規則、官方文件或可直接核對的頁面內容。
- **INFERENCE**：由多個來源推導的判斷；不是主辦方承諾。
- **UNRESOLVED**：官方沒有回答，不能自行當作合規。
- **VOLATILE**：會因 rollout、庫存、頁面更新或 participant state 改變。
- **RECOMMENDED**：研究者為降低失敗風險提出的操作建議。

## Submission hard gates

在任何「作品完成」宣稱前，必須逐項通過：

- 已註冊 Devpost，且參賽者／team／organization 符合資格。
- 有可工作的 live URL；可用 ChatGPT in-app browser 或 Chrome WebMCP 測試。
- public code repository（GitHub、GitLab 或 Bitbucket）。
- repo 內有全部必要 source、assets、instructions，以及 repository 頂部可見的 open-source license。
- repo 能看到 imperative WebMCP 的 document.modelContext.registerTool({ ... }) 實作。
- submission description 交代 WebMCP fit、UX 改善、人與 agent 的共同能力、implementation。
- public YouTube demo 少於三分鐘、有清楚畫面、有 audio，且無未授權第三方商標／音樂／素材。
- 所有 submission materials 為 English，或附完整 English translation。
- **RECOMMENDED freeze：** deadline 前完成提交；deadline 後不再修改 submission、repo 或 live site，直至 judging 結束（Devpost FAQ 的保守操作要求，Rules 只對 submission modification 作明文規範）。

## 不應混淆的三件事

1. WebMCP 是網站在使用者已打開的 live page 上暴露 tools；它不是單純遠端 MCP server，也不是 browser automation 的替代品。
2. Chrome spec 支援面比 ChatGPT built-in browser 廣；目前 ChatGPT 文件明確表示不發現 declarative tools 和 iframe tools，因此 imperative、top-level registration 是較穩健的共同分母。
3. 「有 URL」、「public」、「能 render」只證明基本可見性，不證明 judges 能發現／呼叫 WebMCP tools、工具有正確 side effect 或作品符合四項評分標準。

## 研究資料庫維護規則

- 新來源先加入 source index，再修改結論。
- Challenge-specific source 先記在本目錄；一般 WebMCP standard／security／future research 沿用既有 WebMCP_Analysis dossier，避免產生第二套互相漂移的 general source register。
- 若新資料與規則衝突，保留衝突記錄，不靜默覆寫。
- 對動態資料寫明 observation date；不要把 participant count、credits availability 或 rollout 當成永久事實。
- 未解答問題在取得 sponsor／Devpost 書面澄清前保持 UNRESOLVED。
- Docs/Expired/ 保留給已過期、被取代或不能再作決策依據的材料；目前沒有將任何既有文件移入該處。
