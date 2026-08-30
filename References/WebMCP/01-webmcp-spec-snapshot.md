# WebMCP draft spec snapshot

研究快照：2026-08-28（Europe/London）

來源：[WebMCP specification](https://webmachinelearning.github.io/webmcp/)、[WebMCP GitHub](https://github.com/webmachinelearning/webmcp/)。

## Status

- 目前頁面是 2026-08-26 dated Draft Community Group Report。
- 編輯者列為 Brandon Walderman（Microsoft）、Khushal Sagar（Google）、Dominic Farolino（Google）。
- 它屬 W3C Web Machine Learning Community Group 的 draft；頁面明確不是 W3C Standard，也不是 Standards Track。
- 名稱、方法、security sections 和 declarative parts 仍可能變更；Challenge entry 應用 graceful fallback 和 version-aware testing。

## Problem model

Spec 把 webpage 視為可在 client-side script 實作 tools 的 MCP-like server。這讓 agent 在 page 內使用相同 context，與人一起瀏覽、編輯、分析和創作。

這與「把所有資料送到一個獨立 agent backend」不同：WebMCP 的價值包括 live UI state、current route／selection、登入 session、human visibility 和 application permission boundary。

## Document model

主要入口是 document.modelContext。現在 draft 描述：

- registerTool(tool, options)：註冊一個 tool。
- getTools(options)：取得 agent 可見 tools。
- executeTool(tool, inputObject, options)：執行特定 tool。
- ontoolchange／toolchange：觀察 tool availability 變化。

Tool contract 的核心欄位：

- name：非空、1–128 字元，ASCII alphanumeric、underscore、hyphen、period。
- title：optional human-readable title。
- description：讓 agent 知道 purpose 和適用情境。
- inputSchema：JSON Schema object。
- execute：接收 input object 和可取消的 signal，返回結果或 error。
- annotations：例如 readOnlyHint、untrustedContentHint。

register options 可限制 exposedTo secure origins；getTools options 可表達 caller 的 fromOrigins。cross-origin use case 需要同時配合 permission policy、exposedTo 和 fromOrigins，不能只在 JavaScript 中宣稱 trusted。

## Context and boundary

- secure context 是必要條件。
- document 必須符合 origin-keyed／origin-isolated model。
- Permissions Policy 的 tools 預設為 self。
- cross-origin iframe 要有 allow=tools，並且還要滿足 exposed／caller origin 條件。
- getTools 的定位主要是 page 內 agent；browser agent 的 discovery mechanism 可由 client 自己處理。
- registered tool 帶有 origin／window context，因此不能把不同 page／origin 的 tool 當成無邊界 global function。

## Security implications

Spec 把以下視為需要處理的風險：

- tool metadata 可能被 poisoning；
- tool output 可能含 prompt injection；
- tool implementation 可能錯誤指向 target；
- agent 可能誤解 tool intent；
- 過寬參數會放大 data／permission exposure；
- login、personalization、payment 和 cross-site context 會令 agent 繼承 user identity；
- private browsing、same-origin／cross-origin 和 iframe boundaries 不能靠 UI assumption 代替。

因此，tool description 是 security-relevant input，不是普通 marketing text。輸出也要用 untrustedContentHint 等 signals，並在 domain／server layer 重做 authorization 和 validation。

## Declarative status

Draft 的 declarative WebMCP section 在本 snapshot 仍留有 TODO／未完成內容。Chrome 另有 declarative API 文件，但 ChatGPT built-in browser guide 目前不支援 declarative tools。

**RECOMMENDED：** Challenge project 以 imperative registerTool 作核心，declarative 只作 optional enhancement；不要讓評審必須使用一個尚未共同支援的 surface 才能完成 demo。

## Spec-to-project mapping

| Spec concern | Project decision |
|---|---|
| tool name／schema validation | 建立 schema tests；name／input 保持窄而明確 |
| shared page context | demo 先展示 human state，再由 agent 讀／改同一 state |
| origin／permission | top-level same-origin 優先；跨 origin 只有有必要才做 |
| untrusted content | user／external text 僅作 data，不能當 instruction |
| tool lifecycle | route／selection／auth state 改變時 register／unregister |
| abort／failure | signal、timeout、error 和 partial result 有 deterministic tests |
| evolving spec | README 記明 tested browser/version；保留 normal UI fallback |

