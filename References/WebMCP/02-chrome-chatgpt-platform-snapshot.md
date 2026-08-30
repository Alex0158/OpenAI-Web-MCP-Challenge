# Chrome 與 ChatGPT platform snapshot

研究快照：2026-08-28（Europe/London）

來源：[Chrome WebMCP guide](https://developer.chrome.com/docs/ai/webmcp)、[Chrome imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)、[Chrome declarative API](https://developer.chrome.com/docs/ai/webmcp/declarative-api)、[Chrome security guide](https://developer.chrome.com/docs/ai/webmcp/secure-tools)、[ChatGPT Site tools](https://learn.chatgpt.com/docs/webmcp)、[OpenAI Help Center: using Site tools](https://help.openai.com/en/articles/20001423-using-site-tools-in-the-chatgpt-desktop-app)。

## Chrome

Chrome 官方文件在本快照提供兩種 developer surface：

- Imperative API：JavaScript 以 document.modelContext.registerTool 註冊。
- Declarative API：HTML form attributes 轉換成 tool。

本機測試：

1. 安裝 Chrome 149 或更新版本。
2. 開啟 chrome://flags/#enable-webmcp-testing。
3. Relauch browser。
4. 以 live page 和 DevTools／WebMCP Model Context Tool Inspector 檢查工具。

Chrome docs 另提到 origin trial，並指出 WebMCP 仍在 active discussion；版本、origin trial、flag 和 API call shape 可能改變。

Chrome best practices 的可操作原則：

- 一個 tool 一個 function；避免 overlap。
- static tools 預設 register；只有在 page state／permission 可用時暴露 dynamic tools。
- 用正向、清楚的 verb 和描述；區分「立即執行」與「開始一個流程」。
- 讓 input types／enums 具體、自描述；對 user input 允許合理 raw text。
- rate limit、validation 和 error 要讓 agent 有機會自我修正，但不要默認 unsafe retry。
- UI 在 execute 後更新，令 user 看見結果。

Security guide 建議：

- readOnlyHint 只標真正 non-mutating action。
- untrustedContentHint 用於 user-generated／external content。
- trusted origins 要窄；read-only 仍可能洩露 user data。
- tool description、parameter description、name 和 output 有建議字數 budget。
- 任何 write／high-impact tool 仍需要 application permissions 和 user control。

## ChatGPT built-in browser

OpenAI 的 ChatGPT Learn guide 在本快照把 Site tools 定義為 ChatGPT 對 proposed WebMCP 的 implementation：

- agent 在 built-in browser 開啟 website 後，可 discovery 該 page 提供的 tools。
- user 和 agent 可使用同一 live page 和 signed-in session。
- address bar 可查看 Available site tools；recent activity 可查看 calls／Sources（實際 UI 受 rollout 影響）。
- 每次 invocation 有 safety review；網站提供的 tool definitions／results 都應視為 untrusted。
- 使用者可在 Settings > Browser > Permissions 關閉 Enable site tools。
- Help Center 另外說明：site tools 只在 ChatGPT desktop app 的 built-in browser 提供，不是普通 Chrome 的 Site tools；若已在 Chrome 登入，built-in browser 可能要重新登入。tool 只屬於提供它的 page，關頁或換頁便不可用；密碼應直接在網站輸入，不要放入 ChatGPT conversation。

### 明確限制

ChatGPT guide 目前明確列出：

- 不支援 declarative API tools。
- 不會 discovery same-origin 或 cross-origin iframe 內註冊的 tools。
- ChatGPT／Codex 仍可用普通 browser capabilities 與 form interaction，但那不算 WebMCP tool call。

因此，Challenge 的共同最小實作應是：

- top-level document；
- imperative registerTool；
- existing application logic；
- visible UI update；
- ordinary UI fallback。

### Volatile availability

Guide 目前也記載 model、desktop app version、workspace type 和 rollout 會影響可用性，並特別列出部分 model／Enterprise／Edu 限制。這些不是 Challenge rules，不能放進 project architecture 的唯一 dependency；測試 instructions 應提供 Chrome fallback。

## Cross-client test matrix

| Test | Chrome | ChatGPT browser | Pass condition |
|---|---|---|---|
| top-level imperative discovery | 必測 | 必測 | tool list 出現預期 tools |
| read tool | 必測 | 必測 | result 與 UI／page state 一致 |
| proposal／mutation | 必測 | 必測 | confirmation／validation／visible update |
| declarative-only path | 可選 | 不可作核心 | 有 imperative fallback |
| iframe registration | 可按 spec 做 | 不可作核心 | top-level fallback |
| invalid input | 必測 | 最好測 | bounded error，不 crash／不 side effect |
| session expiry | 必測 | 最好測 | re-auth／safe error，不洩露 credential |
| no WebMCP | 必測 | N/A | normal human UI 仍可用 |

## Release recommendation

若 Chrome 和 ChatGPT 的 observed behavior 不一致：

1. 先保留 imperative top-level path。
2. 在 README 寫明實際 tested versions。
3. 將不支援 surface 從核心 demo 移除。
4. 保存 console／Inspector evidence，不以「spec 應該支援」取代 runtime proof。
