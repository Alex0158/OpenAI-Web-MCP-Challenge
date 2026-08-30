# WebMCP 技術、security 與 verification

研究快照：2026-08-28（Europe/London）

主要來源：[WebMCP draft spec](https://webmachinelearning.github.io/webmcp/)、[Chrome WebMCP guide](https://developer.chrome.com/docs/ai/webmcp)、[Chrome imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)、[Chrome secure tools](https://developer.chrome.com/docs/ai/webmcp/secure-tools)、[ChatGPT Site tools guide](https://learn.chatgpt.com/docs/webmcp)。

## 1. 技術定位

WebMCP 讓 webpage 以 JavaScript tools 的形式把自身能力交給 AI agent。它與傳統 MCP 的關鍵差異是：

- MCP 通常是 AI application 連接獨立的 local／remote server。
- WebMCP 是 agent 進入 live website 後，由該 page 暴露 tools。
- page、agent、user 可共享同一份 UI state、session、身份和 human-visible context。
- WebMCP 不取代普通 browser interaction；不支援 WebMCP 的 client 仍應能使用 human UI。

**CONFIRMED：** WebMCP draft 明確是 proposed／experimental open standard，不是 W3C Standard 或 Standards Track。Challenge 允許參賽者探索未來方向，但實作不能把 draft／browser rollout 當成穩定跨平台 contract。

## 2. 平台支援矩陣

| 測試面 | 2026-08-28 可核對的狀態 | 參賽實作含意 |
|---|---|---|
| Chrome | Chrome 官方文件要求 Chrome 149+，可開啟 chrome://flags/#enable-webmcp-testing；亦有 origin trial | 適合確認 spec 廣度、用 DevTools／Tool Inspector debug |
| ChatGPT desktop built-in browser | ChatGPT 官方 guide 說 Site tools 是其 WebMCP implementation，工具屬於目前 page／session | 是 Challenge 明確測試面之一，但 availability 受 desktop app、rollout、workspace、model 影響 |
| ChatGPT browser + declarative API | 官方 guide 明確說目前不支援以 HTML form attributes 定義的 declarative tools | 不要只做 declarative；必須有 imperative top-level registration |
| ChatGPT browser + iframe | 官方 guide 明確說不會發現 same-origin 或 cross-origin iframe 內註冊的 tools | 把核心 registration 放 top-level document |
| 無 WebMCP browser | 可繼續用普通 website UI，但不是 WebMCP call | 做 progressive enhancement，避免作品只在一個 client 有效 |

ChatGPT guide 在本快照同時記載 GPT-5.6 Sol／Terra 可用 Site tools、GPT-5.6 Luna 暫停用、Enterprise／Edu workspace 不提供；這些是 product rollout facts，標記為 **VOLATILE**，不能寫成 Challenge eligibility 或長期平台保證。

## 3. Imperative API snapshot

### 主要 surface

目前 draft／Chrome docs 對 Document 上的主要 surface 包括：

- document.modelContext
- modelContext.registerTool(tool, options)
- modelContext.getTools(options)
- modelContext.executeTool(tool, inputObject, options)
- modelContext.ontoolchange／toolchange

Challenge 的共同分母應是 registerTool + execute callback；getTools／executeTool 主要用於 in-page agent、測試或特定 client，實際使用前要在目標 browser 版本驗證。

### Tool contract

一個 tool 通常包括：

- name：1–128 chars；只用 ASCII alphanumeric、underscore、hyphen、period。實務上控制在 30 chars 內。
- title：可選的人類可讀標題。
- description：說清楚 purpose、何時使用和 side effect。
- inputSchema：JSON Schema object；required、type、enum、additionalProperties false 等應與實際 validation 一致。
- execute：接收 input object，執行既有 application logic；可為 async。可接收 AbortSignal，並將 signal 傳到可取消的 fetch／dependency。
- annotations：至少正確標記 readOnlyHint、untrustedContentHint 等適用資訊。

**Best-practice budget，不是硬 API limit：**

- tool name／parameter name 最好不超過 30 chars。
- tool description 最好不超過 500 chars。
- parameter description 最好不超過 150 chars。
- 單一 tool output 最好控制在約 1.5K chars 內。

### 生命週期

- page state 尚未準備好時，不要暴露會失敗的 tool。
- route／selection／permission 改變時，按需要 register／unregister。
- dynamic unregister 可用 AbortController；不要讓舊 page 的 tool 留在不適用的 state。
- 使用 toolchange 觀察可用 tools 是否變化。
- 同一 page 的 tool name 要避免 duplicate、overlap 和模糊命名。

### 最小 imperative 形狀

以下只是 pattern；實際 project 必須接上自己的 logic、auth、validation 和 UI：

    if (typeof document.modelContext?.registerTool === "function") {
      await document.modelContext.registerTool({
        name: "get_page_title",
        description: "Read the title of the current page.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false
        },
        annotations: { readOnlyHint: true },
        execute: async () => ({ title: document.title })
      });
    }

對 mutation，不應把所有 UI click 原樣搬進 execute；應把 domain action 包成有窄輸入、可驗證、可觀察結果的 function。

## 4. Declarative API 與版本 drift

Chrome 文件另有 declarative API：HTML form 以 toolname、tooldescription、toolparamdescription、toolautosubmit 等 attributes 暴露能力。這對普通 form workflow 有吸引力，但：

- ChatGPT 官方 guide 在本快照明確不支援 declarative site tools。
- WebMCP draft 的 declarative section 仍有 TODO／未完成部分。
- 不同 Chrome／ChatGPT 版本可能有不同 call shape 和 rollout。

**RECOMMENDED：** 參賽核心使用 imperative API；declarative 只作 optional enhancement，且不能是 video、live URL 或 judge path 的唯一依賴。

另一個版本風險是 Chrome imperative page 與 draft spec 對 executeTool 的示例 call shape 目前並不完全一致。這不影響 registerTool 的核心 pattern，但不要在 README 把某一版 executeTool call 當作所有 client 都支援；以實際目標版本做 smoke test。

## 5. Security model

WebMCP 的風險不是只有 API bug；agent 會把 webpage、tool metadata 和 tool result 視為可用 context，因此 attack surface 包括：

- tool poisoning：name、description、parameter description 放入誤導 agent 的指示。
- output injection：使用者內容、外部資料、檔案或 API 回應帶有 prompt injection。
- implementation target：tool implementation 自己呼叫了錯的 endpoint 或把輸入轉成危險 command。
- intent misrepresentation：看似 read-only，實際上寫 data；或 mutation scope 比 user 以為的大。
- over-parameterization／privacy leakage：一次暴露過多 filters、IDs、records、session details。
- same-origin／cross-origin boundary、iframe、private browsing、登入／支付狀態的混合。

### 必做的 controls

- 沿用 application 現有 authentication、authorization 和 input validation；WebMCP 不應繞過既有 permission。
- readOnlyHint 只在真的不改 state 時使用；read-only 仍可能洩漏個人資料。
- untrustedContentHint 用於 user-generated 或 external content；不把外部文字當作 trusted instruction。
- input length、enum、range、record ownership、rate limit 都在 server／domain layer 再驗證一次。
- mutation 分為 stage／preview 與 apply；涉及刪除、購買、發送、權限或不可逆改動時要求 user confirmation。
- response 只回傳完成下一步所需的 bounded data；不要回 token、cookie、payment data、完整 internal error、未經整理的 database row。
- 跨 origin 只向可信 secure origins 暴露；涉及跨 origin 時需同時考慮 Permissions Policy、exposedTo 和 caller fromOrigins。
- 不把 credentials、private endpoint、secret API key 放入 public repo、tool description、video 或 output。
- 保留普通 human path，令不支援 WebMCP 的 browser 不會被導向壞流程。

## 6. 建議 architecture

    Existing UI state and domain logic
                |
                v
    Top-level imperative registerTool
                |
                v
    Narrow JSON schema + client-side validation
                |
                v
    Existing auth / authorization / server validation
                |
                v
    Bounded result + visible UI update + audit/undo where needed

這個 layering 讓 judge 可在 repo 看到 WebMCP，也讓 project 能回答：

- agent 呼叫的是哪個 domain capability？
- 呼叫後 UI 哪裡變？
- user 如何知道發生了什麼？
- 錯誤、取消、retry 和 partial success 怎樣處理？
- 沒有 WebMCP 時，普通 user 怎樣完成同一件事？

## 7. Eval matrix

### Deterministic tests

- page load 後，預期 tools 是否 register；不適用 state 是否 unregister。
- tool name、description、schema、required fields、enum、additionalProperties 是否正確。
- valid input 會否產生預期 state、UI update 和 bounded result。
- invalid／missing／oversized input 是否安全拒絕並返回可修正 error。
- auth／ownership／rate limit／permission deny 是否在正確 layer 擋下。
- AbortSignal、timeout、network failure、retry、partial success 是否可預期。
- mutation 是否需要 confirmation、可 undo 或清楚記錄。
- fresh reload、deep link、session expiry、empty data、mobile／desktop layout。

### Probabilistic agent tests

- direct prompt 能選對 tool 和正確 arguments。
- ambiguous prompt 會先問 clarification，而不是猜測或執行 mutation。
- 多步 prompt 能按合理順序完成 search → inspect → stage → apply。
- tool result 能被 agent 正確用於下一步，而不是 hallucinate result。
- untrusted content 不能改寫 agent intent。
- prompt 只要求 read 時不會執行 write。
- agent 能解讀 validation error、修正一次後再試；不可重試的 mutation 不會盲目 retry。

Chrome 官方 eval guidance 建議同時做 deterministic tool tests 和 probabilistic agent tests；只錄一條成功 video 不足以證明可靠性。

## 8. Judge-facing verification protocol

### Chrome path

1. 安裝 Chrome 149+。
2. 開啟 WebMCP testing flag 並 relaunch。
3. 開 live URL，確認 top-level document 已 registration。
4. 用 Chrome DevTools WebMCP panel 或 WebMCP Model Context Tool Inspector 查看 tools。
5. 手動呼叫 read tool、proposal／mutation tool、invalid input。
6. 觀察 UI state、result、error、permission 和 normal browser fallback。

### ChatGPT path

1. 用最新 ChatGPT desktop app 的 built-in browser。
2. 進入 live URL，確認 site tools availability；不要只在 chat text 描述。
3. 在同一 page/session 發一個 direct prompt，再發一個需 clarification 的 prompt。
4. 確認 declarative／iframe 沒有被當作核心 dependency。
5. 若有 login，提供可供 judge 使用的最小 test account；不要用 personal credential。

### Fresh-release path

- clean checkout／fresh install 跑 README。
- production URL 與 video 所用 URL、seed data、feature flags 一致。
- 新 session、已過期 session、無 WebMCP browser 都做一次。
- 收集不含 secrets 的 evidence：commit hash、build log、tool list screenshot、test result、video duration。

## 9. Technical definition of done

- [ ] WebMCP registration 在 top-level page、imperative path。
- [ ] tool portfolio 3–6 個互補 actions，無 generic click wrapper。
- [ ] 每個 tool 有清楚 name、description、schema、side-effect boundary。
- [ ] readOnlyHint／untrustedContentHint 與實際行為一致。
- [ ] 既有 auth／authorization／validation 沒被繞過。
- [ ] tool result bounded、可驗證、沒有 secret／個資過曝。
- [ ] normal UI 在 no-WebMCP browser 仍可使用。
- [ ] Chrome 及 ChatGPT path 都做過 live smoke test，至少一個可完整 demo，最好兩個都可。
- [ ] direct、ambiguous、invalid、failure、mutation-confirmation prompts 有紀錄。
- [ ] README 能讓 judge 在不猜測的情況下完成測試。

