# Supporter 資源、starter 與 credits

研究快照：2026-08-28（Europe/London）

來源主要來自 [Devpost Resources](https://webmcp.devpost.com/resources)、各 provider 官方文件和 Challenge starter pages。這些是加速器，不是參賽必要條件；名額、quota、approval、codes 和產品 rollout 都標記為 VOLATILE。

## OpenAI

- [Challenge page](https://openai.com/webmcp-challenge/)：goal、judges、OpenAI prize、official inspiration。
- [ChatGPT Site tools guide](https://learn.chatgpt.com/docs/webmcp)：ChatGPT browser 的 discovery、security 和 current limitations。
- [OpenAI Showcase](https://developers.openai.com/showcase?view=webmcp-apps)：Margin、WanderNote、Sunday Table、Paperie、Webroom、Cubecade、Crossword Desk、Codex Modeling Studio 等 WebMCP app examples。
- 使用 ChatGPT Sites 可能有 paid plan、workspace 和地區限制；不要把它當唯一 deployment path。

## Chrome

- [WebMCP overview](https://developer.chrome.com/docs/ai/webmcp)
- [Imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [Declarative API](https://developer.chrome.com/docs/ai/webmcp/declarative-api)
- [Best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices)
- [Secure tools](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [Evals](https://developer.chrome.com/docs/ai/webmcp/evals)
- [DevTools WebMCP](https://developer.chrome.com/docs/devtools/application/webmcp)
- [WebMCP Model Context Tool Inspector](https://chromewebstore.google.com/detail/webmcp-model-context-tool/gbpdfapgefenggkahomfgkhfehlcenpd)
- [useWebMCPTool React hook](https://www.npmjs.com/package/usewebmcp)
- [WebMCP with Angular](https://angular.dev/ai/webmcp)
- [Modern Web Guidance](https://github.com/GoogleChrome/modern-web-guidance)
- [WebMCP demos](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/demos)

最佳用途是先用 Inspector 驗證 tool list、schema、manual call、error 和 output，再錄 demo；它不是 project runtime dependency。

## Cloudflare

- [Challenge starter page](https://webmcp-challenge.examples.workers.dev/)：React + Vite starter，示範 imperative／declarative tools、React hook 和 deployment。
- [Cloudflare WebMCP React starter](https://github.com/cloudflare/agents/tree/main/examples/webmcp-react)：self-contained React + Worker example，四個 imperative tools、一個 declarative form、Zod Mini validation、lifecycle cleanup、localStorage persistence 和 unsupported-browser state。
- [Cloudflare WebMCP blog](https://blog.cloudflare.com/webmcp/)：developer preview 的 edge injection／bridge、同源 WebMCP 與 Site MCP Server。
- [Browser Run](https://developers.cloudflare.com/browser-run/)：headless Chrome、Playwright／Puppeteer／CDP／Stagehand。
- [Browser Run WebMCP changelog](https://developers.cloudflare.com/changelog/post/2026-04-15-br-webmcp/)：較早 experimental testing API context；不應與 current document.modelContext 混用。
- [Coffee-store demo](https://webmcp-coffee.jilles.fyi/)：小型 live commerce example。
- Challenge page 宣傳 participant credits 和 winner Cloudflare credits；以實際 page／Devpost 狀態核對，不預支 availability。

## Shopify

- [Shopify WebMCP](https://shopify.dev/docs/api/web-mcp)：Liquid storefront 和 Hydrogen developer preview 的 storefront tools。
- 可觀察的 catalog tools：search_catalog、browse_store、get_product、show_variant。
- 可觀察的 cart／checkout tools：get_cart、update_cart、cancel_cart、proceed_to_checkout、manage_orders。
- Shopify tools 直接作用於 live shopper session；cart drawer／UI 會反映狀態。
- 不要把 Shopify storefront WebMCP 與 [Shopify Agentic tools](https://shopify.dev/docs/agents) 或 Storefront MCP server 混稱。

## Vercel

- [Vercel Shop repo](https://github.com/vercel/shop)：public MIT Shopify storefront。
- [WebMCP PR 498](https://github.com/vercel/shop/pull/498)：可參考 progressive tool registration、bounded results、server-side validation、cart write serialization、BotID、ambiguous mutation handling、lifecycle smoke tests。
- [Live template store](https://template.vercel.shop/)：live pattern，需自行核對 current state。
- [Credits page](https://credits.vercel.sh/)：Devpost resource 曾提供 first-builders credits 和 code；quota／code／expiry 可能變。
- Devpost Resources 本快照顯示 first 1,000 builders 可申請 USD 30 build credits，並列出 code OAIWEBMH-9E2F-MUT4；quota、eligibility、code 和 expiry 需在 page 重新確認。
- PR 是 historical implementation pattern；repo 後續可能改成 Hydrogen WebMCP／config flag，不能照舊 commit 當 current truth。

## Render

- [Workflows](https://render.com/workflows)
- [Workflow docs](https://render.com/docs/workflows)
- [Starter templates](https://render.com/templates)
- [Participant credits portal](https://credits-portal-mmdm.onrender.com/)
- Devpost Resources 本快照顯示前 500 claims 可取得 USD 50 Render credits，套用後一年有效，可用於 workspace、plan fee、compute 和 bandwidth；以 portal 實際狀態為準。
- Workflows 適合長任務、task chaining、retry、agent orchestration；簡單 Challenge app 不應為 credits 強行引入。
- Official prize 是 winner Render credits；participant credit portal 是另外的 VOLATILE promotion。

## Netlify

- [Challenge article](https://www.netlify.com/blog/compete-openai-webmcp-challenge/)
- [Netlify Challenge hub](https://webmcpchallenge.netlify.app/)：supporter-specific key dates、credit pool、prizes 和 Discord。
- [Netlify Challenge links](https://www.netlify.com/webmcp-challenge/links/)：OpenAI／Devpost／resource links 的 consolidated page。
- [Netlify credit instructions](https://www.netlify.com/webmcp-challenge/credits/)：Devpost registration、Netlify Team ID、Discord 和 request flow。
- [Netlify](https://www.netlify.com/)
- [Docs](https://docs.netlify.com/)
- [Starter](https://webmcp-starter.netlify.app/)
- [Participant credit form](https://forms.gle/xw75XGUQzCXEiALc7)
- [Netlify Discord](https://discord.gg/netlify)
- [OpenAI Discord support](https://discord.com/invite/openai)
- Rules／resources 曾記載 registered entrants 可申請 3,000 credits，subject to approval／quota，需在 2026-09-01 12:00 Pacific 前申請、2026-10-03 前 redeem。
- Netlify supporter hub 另宣傳總額 3,000,000 credits 和 USD 5,000 supporter cash pool（Top 10 each USD 500）；這與 Official Rules 的逐項 prize table 一致於 Netlify 部分，但仍以 Rules 作正式 prize source。
- Netlify article 的舊內容顯示 17:00 Pacific deadline；較新的 Netlify Challenge hub 顯示 13:00 Pacific，但其 winner date 顯示 Sep 22，仍與 Official Rules Sep 23 不同。deadline、judging、winners 以 Rules 為準。

## Resource decision rule

- 先選最快能穩定 deploy、debug、rollback 的 provider。
- 不因 credits 改變 product scope。
- 不把 starter 的 code、copy、data 或 default tool portfolio 直接當作 differentiated entry。
- 所有 starter／SDK／assets 仍要查 license、README、public repo completeness。
