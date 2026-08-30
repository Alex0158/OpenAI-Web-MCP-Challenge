# 提交、評分與參賽策略

研究快照：2026-08-28（Europe/London）

本文件不是猜「評審喜歡什麼」，而是把 Official Rules 的 scoring funnel 轉成可驗收的 product／demo／repo strategy。

## 1. 真正 objective

參賽目標不是最大化 WebMCP API 數量，而是讓評審在很短時間內看到：

1. 作品符合 WebMCP Challenge 主題並能 pass Stage One。
2. WebMCP 是 user value 的核心機制，而非貼在普通網站上的 badge。
3. 人與 agent 在同一 live page／shared state 中完成清楚的共同工作。
4. 作品是完整、可靠、可測試的 product experience，而非只有 code proof。

**INFERENCE：** 四項 Stage Two 等權，但 Stage One 是 pass/fail；所以最優順序是先守住 baseline viability，再在四項各提供可觀察證據。單純追求 novelty 而犧牲可運行性，expected value 很低。

## 2. Official scoring model

### Stage One：baseline pass/fail

- 合理 fit Challenge theme。
- 合理使用 required APIs／SDKs，對本案即 WebMCP。

### Stage Two：四項各 25%

| Criterion | 評審要回答的問題 | 最有力的可觀察證據 | 常見失分 |
|---|---|---|---|
| WebMCP Leverage | 是否 thorough、skillful、genuine、non-trivial？ | 多個互相配合但不重疊的 tools；工具直接連到既有 domain logic；live call 改變 shared state | 只有 generic action、單一 demo tool、工具與產品脫節、無法發現／呼叫 |
| Execution | 是否 working、runnable、complete、coherent？ | 首屏可理解、操作 path 短、loading/error/retry/empty state 完整、live deploy 穩定 | 只在本機成功、環境依賴未說明、影片演示和 live site 不同、POC 感 |
| Potential Impact | 是否有具體 real audience／real problem？ | 用一個具體 persona、task、before/after journey 證明節省步驟或降低歧義 | 空泛「agents can do anything」、沒有 user pain、只有技術展示 |
| Creativity & Ambition | 是否 novel、creative、和已有概念不同？ | 新的 human-agent workflow、清楚的 domain insight、不是普通 CRUD 加 tool wrapper | 只換皮、複製 showcase、ambition 太大導致不完整 |

### Tie-break

若總分相同，先比較 WebMCP Leverage，再 Execution，再 Potential Impact，再 Creativity & Ambition；全部相同才由 judge panel vote。這代表「創意」不能補救完全不能工作的 WebMCP。

## 3. Recommended product thesis

最強的預設方向是：

> 一個已有清晰人類工作流的 web app，將 agent 放進同一個 page、同一份 context、同一個 permission boundary，讓 agent 負責搜尋／整理／提議／執行一部分工作，而人保留可見性、判斷和最後確認。

這個 thesis 具備四個可驗證條件：

- **Shared state：** 人眼前的畫面與 agent 讀寫的狀態一致。
- **Meaningful delegation：** agent 做的是多步驟 domain work，不是把每個 button 換成自然語言。
- **Human control：** mutation 可 preview、confirm、undo 或清楚顯示結果。
- **Progressive enhancement：** 不支援 WebMCP 的 browser 仍有正常 human UI。

## 4. Tool portfolio strategy

建議由一條 end-to-end journey 反推 3–6 個 tools，而不是先列一堆 API：

1. search 或 inspect：找資料／讀取目前 context。
2. get 或 compare：取得足夠細節供下一步決策。
3. prepare 或 stage：建立可供人檢查的 proposal 或 draft。
4. apply：在明確權限和 validation 下執行 mutation。
5. undo 或 reset：提供 recoverability（若 domain 可行）。

**RECOMMENDED：**

- 一個 tool 只負責一個清楚 function，避免 overlap。
- tool description 直接說 purpose、輸入限制及 side effect；不要寫 marketing copy。
- 用 narrow schema、enum、required fields 和 additionalProperties false 降低歧義。
- 回傳足夠資料讓 agent／user verify result，但不要洩漏 token、完整 database row、payment data 或內部 error。
- 工具在 page state 不適用時 unregister 或明確回報；不要永遠暴露一個其實不能執行的 tool。

## 5. Project category map

以下是由 OpenAI Showcase、官方 challenge examples 和 ChatGPT Site tools guide 可觀察到的 workflow family；不是官方排名，也不是建議直接複製。

OpenAI Challenge page 本快照明列的 inspiration 方向包括 3D Modeling、Collaborative Writing、Crossword Builder、Wandernote 和 Data Exploration。這些是示範方向，不代表已提交作品，也不代表 category 有評分優勢。

| Family | 人與 agent 可共同完成的 loop | WebMCP leverage 機會 | 主要風險 |
|---|---|---|---|
| Collaborative writing／notes | agent 找段落、摘要、提出 edit、留言，人審閱與接受 | shared document context、draft／comment／review tools | 寫入錯誤、未清楚顯示 diff、敏感內容 |
| Dashboard／data exploration | 人選問題，agent 調 filter、讀數據、比較、解釋 | stateful filters、bounded queries、chart context | hallucinated analysis、資料外洩、結果太長 |
| Planning／itinerary | agent 比較選項、生成 plan、更新 itinerary，人調整與確認 | multi-step planning、visible map/list state、draft apply | 即時資料、外部 API、未經確認的 booking |
| Creative editor／3D／music | agent 執行可觀察的創作操作，人持續 sculpt／approve | structured scene／timeline operations、undo | tool granularity、state synchronization、效能 |
| E-commerce／shared cart | agent 搜尋、比較、建立 cart proposal，人確認 | catalog/cart tools、variant validation、human-in-loop | payment、personal data、unsafe mutation |
| Education／workflow assistant | agent 讀取 context、提出下一步、建立 draft，人保留判斷 | domain-specific guided tools、audit trail | 高風險建議、身份與權限 |

**INFERENCE：** 具有「可見狀態 + 可逆編輯 + 人的審核」的 category 同時容易證明 WebMCP Leverage、Execution 和 Impact；高風險的 payment、medical、legal、account permission flow 除非已有很強的安全設計，否則不適合作為十日 challenge 的核心。

## 6. 不建議的形態

- **Generic tool wrapper：** 只有 do_action、click 或把普通 REST endpoint 原樣暴露，評審看不到 WebMCP 對 UX 的必要性。
- **Tool zoo：** 十幾個相似 tool 令 agent 選錯，description 和 context 變長，debug 難。
- **Backend-only agent：** agent 在另一個 server 工作，沒有同一頁 shared state；這更像 MCP／API integration，不像 WebMCP 的主題優勢。
- **Video-only illusion：** video 中有 mock data 或 local env；live URL 不能重現。
- **Private dependency trap：** repo public 但關鍵 package、data、backend 或 credentials 私有，違反 all necessary source/assets/instructions 的風險高。
- **Unsafe mutation：** tool claim read-only 但實際改 data；沒有 validation、confirmation、audit、undo。
- **AI generic prose：** FAQ 明確歡迎 AI 用於 scaffolding、debug、draft，但要求自己核驗；description 不能是空泛、誇大或假造的 AI copy。
- **Novelty over completion：** 做一個太大的 platform，最後只完成 landing page 和一個 toy tool。

## 7. Submission narrative template（English）

可將以下結構填入 Devpost description，再以實際行為核對：

1. **Problem and audience**：誰在什麼具體情境遇到哪個 friction。
2. **Human + agent loop**：人保留什麼決定，agent 讀取／整理／提議／執行什麼。
3. **Why WebMCP**：agent 如何使用 same-page context、live UI state、existing auth／permissions；為何普通 chat、REST endpoint 或 browser automation 不如它。
4. **Before / after**：以前需哪些步驟、容易在哪裡出錯；現在如何縮短／改善。
5. **Tools**：列 tool names、inputs、side effects、read-only／mutation boundary。
6. **Safety and recovery**：confirmation、validation、bounded output、error、undo、fallback。
7. **How to test**：URL、登入（如有）、prompt、預期畫面／result、Chrome 或 ChatGPT setup。
8. **Repo and video**：source、license、run instructions、三分鐘內的 demo path。

不要在 narrative 中宣稱 agent can X 而 live site、repo 或 video 沒有證據。

## 8. 三分鐘 demo script

建議控制在 150–170 秒，保留 upload、播放和 judge 注意力 margin：

- 0–15s：一句 problem、persona、作品名稱與結果。
- 15–35s：人類正常 UI 和初始 state。
- 35–55s：展示 browser／site tools 可發現的工具，指出 WebMCP registration。
- 55–115s：輸入一個具體 prompt，展示 agent 連續使用 2–4 個 tools 完成一條 journey。
- 115–140s：人檢查 shared state、preview／confirm／undo，展示 failure 或 validation 一次。
- 140–160s：快速說明 architecture、repo、部署與 WebMCP fallback。
- 160–170s：重申 impact、live URL、repo。

畫面上要有可讀的 tool result／state change；只錄 agent 聊天泡泡而看不到 app 變化，WebMCP Leverage 會難以判斷。

## 9. 10-day execution frame

### Day 0／開始前

- 確認 eligibility、project scope、source-of-truth、third-party licenses。
- 選一條最小但完整的 human + agent journey。
- 建立 public repo、license、README skeleton 和 deployment path。

### Days 1–2：vertical slice

- 先做正常 human UI。
- 以 top-level imperative registerTool 接上現有 logic。
- 完成一個 read tool、一個 proposal 或 safe mutation tool。
- 在 ChatGPT browser／Chrome 確認 discovery。

### Days 3–5：product completeness

- 補 schema validation、loading、error、empty、auth、permissions、result display。
- 加第二／第三個互補 tool，完成連續 journey。
- 加 preview、confirmation、undo 或可解釋的 non-retry policy。

### Days 6–7：impact and differentiation

- 做一個可量化的 before／after demonstration。
- 收斂 description、命名、visual hierarchy、tool descriptions。
- 用 deterministic tests 和多個 direct／ambiguous prompts 做 eval。

### Days 8–9：submission hardening

- fresh checkout 重跑 README。
- 新環境或無 WebMCP browser 測 normal UI。
- 錄多次 demo，選最穩定且少於 3 分鐘的版本。
- public URL、repo license、YouTube visibility、English instructions 全部核驗。

### Day 10：freeze

- 提前完成 Devpost draft 和 final submission。
- 保存 commit hash、build artifact、video URL、deployment URL、testing credentials（只放受控 submission field，不進 repo）。
- freeze submission／repo／live site，除非 Sponsor／Devpost 明確要求允許的修正。

## 10. Premortem

| 假設作品最後失敗 | 早期警號 | 具體 mitigation |
|---|---|---|
| judges 找不到 tools | ChatGPT address bar 沒有 Site tools，Chrome Inspector 空白 | top-level imperative registration；每次 deploy 後在兩個 surface 實測 |
| video 能做、live site 不能做 | video 用 mock data／local env；live URL 缺 key | 影片只用 production-like live URL，先做 fresh-session recording |
| repo 不可重現 | private package、隱藏 env、README 缺 setup | clean checkout + no-secret setup；把必要 mock data／instructions 放 repo |
| tool 選錯或重複 | agent 選錯 tool、description 很長、輸入常 invalid | 減至 3–6 個互補 tools；narrow schema；直接描述 side effect |
| mutation 造成安全／信任失分 | 沒有 preview、確認、undo 或 result verification | 分離 stage/apply；validation；顯示 before／after；readonly annotations 正確 |
| deadline 誤判 | 依賴 17:00 Pacific 宣傳時間 | 以 Rules 13:00 Pacific 作硬 cutoff；內部提前 freeze |

## 11. Decision rule

若候選 idea 同時不能回答以下五題，就不應進入 implementation：

- 誰是具體 user，哪一個 task 現在痛？
- agent 使用同一 live page 的 context 會比普通 chat／API 明顯更好嗎？
- 能否在十日內完成一條 end-to-end journey，而非只展示 API？
- judges 能否在 30 秒內看到 WebMCP tool 被發現、呼叫和改變 UI？
- 所有 data、auth、license、deployment、video 都可在 deadline 前公開核驗嗎？
