# Official、第一手與輔助來源索引

研究快照：2026-08-28（Europe/London）

這個 index 記錄本輪查過的主要來源、它們能證明什麼，以及不能證明什麼。頁面在 Hackathon 期間可能動態更新；access date 不代表內容永遠不變。

本資料庫另有一組既有的 broader WebMCP dossier：[WebMCP_Analysis README](../WebMCP_Analysis/README.md) 及其 [完整 source register](../WebMCP_Analysis/09-Research-Log-and-Source-Register.md)。本 index 專注 Challenge-specific rules、submission、supporter、community conflict；一般標準、security、academic 和 future-direction 來源不重複改寫。

## Source hierarchy

| Level | 來源類型 | 用途 | 發生衝突時 |
|---|---|---|---|
| A | Devpost Official Rules | eligibility、deadline、submission、judging、prizes、法律條款 | controlling source |
| B | Devpost Overview／Resources／Updates、manager clarification | 操作說明、starter、FAQ、澄清和活動狀態 | 次於 Rules；不能改寫 Rules，除非明確 amendment |
| C | OpenAI official pages／ChatGPT Learn | Challenge framing、ChatGPT browser behavior、examples | 產品行為可 volatile；不能取代 Rules |
| D | WebMCP spec、Chrome official docs、supporter official docs／repo | API、security、deployment pattern、provider resource | 技術行為需按實際 browser/version smoke test |
| E | Community discussion、participant report、blog | unresolved question、anecdote、ecosystem perspective | 不能作 eligibility／deadline 硬證據 |

## A. Challenge authority

| Source | URL | 本輪用途 | 證據標記 |
|---|---|---|---|
| Devpost Official Rules | https://webmcp.devpost.com/rules | controlling deadline、eligibility、project／submission requirements、criteria、prizes、IP／legal | CONFIRMED |
| Devpost Overview | https://webmcp.devpost.com/ | overview、tags、requirements、starter／resource links、participant page | CONFIRMED；participant count VOLATILE |
| Devpost Resources | https://webmcp.devpost.com/resources | official docs、starter、supporter、credits、FAQ | CONFIRMED；credits VOLATILE |
| Devpost Updates | https://webmcp.devpost.com/updates | 活動通知、deadline reminder、build status | CONFIRMED for post；次於 Rules |
| Devpost Discussions | https://webmcp.devpost.com/forum_topics | community questions、manager clarifications | CONFIRMED only where organizer explicitly answered；其餘 UNRESOLVED |
| Devpost Project gallery | https://webmcp.devpost.com/project-gallery | Challenge project-level examples／competitor surface | UNAVAILABLE in this snapshot；direct page says gallery not published，另一條 browsing route hit WAF verification |
| Devpost Participants | https://webmcp.devpost.com/participants | participant list／count | ACCESS-LIMITED；direct page requires login，count snapshots VOLATILE |
| OpenAI Challenge page | https://openai.com/webmcp-challenge/ | Challenge goal、current page dates（start 12:00／close 13:00 Pacific）、judges、OpenAI prizes、examples、FAQ | CONFIRMED for page content；older community dates do not override Rules |

## B. OpenAI、eligibility 與 ChatGPT

| Source | URL | 本輪用途 | 證據標記 |
|---|---|---|---|
| ChatGPT Site tools guide | https://learn.chatgpt.com/docs/webmcp | Site tools 是 ChatGPT 的 WebMCP implementation、same page/session、security review、current unsupported declarative／iframe | CONFIRMED；rollout／model availability VOLATILE |
| OpenAI Help Center: using Site tools | https://help.openai.com/en/articles/20001423-using-site-tools-in-the-chatgpt-desktop-app | current desktop-app scope、availability indicator、page-bound behavior、confirmation policy、settings control | CONFIRMED；access、model、plan、app requirements VOLATILE |
| OpenAI Developer Community announcement | https://community.openai.com/t/the-webmcp-challenge-is-here/1392582 | announcement、supporter framing、宣傳 deadline snapshot | CONFIRMED for post；不能勝過 Rules |
| OpenAI Community WebMCP explanation | https://community.openai.com/t/build-agent-ready-websites-with-chatgpt/1392588/ | site tools／ChatGPT Work／Codex 的 product perspective | 官方社群材料；仍非 legal rule |
| OpenAI API supported countries | https://help.openai.com/en/articles/5347006-openai-api-supported-countries-and-territories | 與 Rules 的 supported-country eligibility 交叉核對 | CONFIRMED current-list snapshot；未列 Macau 的結論仍需 sponsor clarification |
| OpenAI Showcase | https://developers.openai.com/showcase?view=webmcp-apps | WebMCP app pattern、category examples | CONFIRMED examples；不是官方 ranking 或 Challenge result |

## C. WebMCP standard／Chrome

| Source | URL | 本輪用途 | 證據標記 |
|---|---|---|---|
| WebMCP spec | https://webmachinelearning.github.io/webmcp/ | draft status、API、tool contract、origin／permissions、security model | CONFIRMED draft snapshot；spec 未定稿 |
| WebMCP GitHub | https://github.com/webmachinelearning/webmcp | spec source、explainer、issues、implementation context | CONFIRMED；issues／main branch VOLATILE |
| Chrome WebMCP overview | https://developer.chrome.com/docs/ai/webmcp | Chrome 149、flag／origin trial、imperative／declarative overview、limits | CONFIRMED current docs；version-sensitive |
| Chrome imperative API | https://developer.chrome.com/docs/ai/webmcp/imperative-api | registerTool、getTools、executeTool、lifecycle、React／Angular notes | CONFIRMED current docs；call shape version-sensitive |
| Chrome declarative API | https://developer.chrome.com/docs/ai/webmcp/declarative-api | form attributes、autosubmit、tool events | CONFIRMED Chrome surface；ChatGPT browser currently不支援 |
| Chrome best practices | https://developer.chrome.com/docs/ai/webmcp/best-practices | tool granularity、description、schema、error、UI state | CONFIRMED recommendations |
| Chrome secure tools | https://developer.chrome.com/docs/ai/webmcp/secure-tools | hints、trusted origins、output budgets、security caveats | CONFIRMED recommendations |
| Chrome agent security | https://developer.chrome.com/docs/agents/security | session identity、prompt injection、guardrails、data minimization | CONFIRMED security perspective |
| Chrome WebMCP evals | https://developer.chrome.com/docs/ai/webmcp/evals | deterministic／probabilistic eval design | CONFIRMED recommendations |
| useWebMCPTool React hook | https://www.npmjs.com/package/usewebmcp | React registration helper | VOLATILE package／experimental |
| WebMCP with Angular | https://angular.dev/ai/webmcp | Angular integration guidance | CONFIRMED framework docs；experimental |
| Modern Web Guidance | https://github.com/GoogleChrome/modern-web-guidance | coding-agent web best-practice guidance | CONFIRMED linked resource；scope VOLATILE |
| WebMCP demos | https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/demos | example implementations | CONFIRMED linked resource；repo VOLATILE |
| Chrome DevTools WebMCP | https://developer.chrome.com/docs/devtools/application/webmcp | inspect／debug registered tools | CONFIRMED tool |
| WebMCP Model Context Tool Inspector | https://chromewebstore.google.com/detail/webmcp-model-context-tool/gbpdfapgefenggkahomfgkhfehlcenpd | list、call、schema、output、natural-language testing | CONFIRMED official Chrome-linked tool |

## D. Official ecosystem perspectives

| Source | URL | 本輪用途 | 證據標記 |
|---|---|---|---|
| Cloudflare Challenge page | https://webmcp-challenge.examples.workers.dev/ | React + Vite starter、imperative／declarative demo、Cloudflare resources | CONFIRMED provider material |
| Cloudflare WebMCP React starter | https://github.com/cloudflare/agents/tree/main/examples/webmcp-react | self-contained React + Worker starter、four imperative tools、one declarative form、Zod validation、lifecycle cleanup、fallback | CONFIRMED provider repo；current branch VOLATILE |
| Cloudflare WebMCP blog | https://blog.cloudflare.com/webmcp/ | edge bridge／Site MCP Server／Browser Run perspective | CONFIRMED provider material；preview／availability VOLATILE |
| Cloudflare Browser Run | https://developers.cloudflare.com/browser-run/ | headless browser、Playwright／CDP／AI agent testing | CONFIRMED provider docs |
| Cloudflare coffee demo | https://webmcp-coffee.jilles.fyi/ | small live commerce example | VOLATILE live demo |
| Browser Run WebMCP changelog | https://developers.cloudflare.com/changelog/post/2026-04-15-br-webmcp/ | older experimental testing API context | CONFIRMED historical/version context |
| Shopify WebMCP | https://shopify.dev/docs/api/web-mcp | Liquid／Hydrogen storefront tools、catalog/cart／checkout boundary | CONFIRMED provider docs |
| Shopify Agentic tools | https://shopify.dev/docs/agents | broader Shopify agent tool ecosystem | CONFIRMED provider docs；與 WebMCP storefront 不同 |
| Vercel Shop repo | https://github.com/vercel/shop | public MIT storefront、production architecture | CONFIRMED repo snapshot |
| Vercel WebMCP PR | https://github.com/vercel/shop/pull/498 | progressive registration、cart safety、validation、tests 的 pattern | CONFIRMED historical PR；current repo 後續狀態可能不同 |
| Vercel live store | https://template.vercel.shop/ | live WebMCP storefront pattern | VOLATILE live surface |
| Render Workflows | https://render.com/workflows | long-running／retry／agent workflow hosting perspective | CONFIRMED provider docs |
| Render Workflow docs | https://render.com/docs/workflows | task、chain、retry、duration／cost context | CONFIRMED provider docs |
| Render templates | https://render.com/templates | starter templates | VOLATILE catalog |
| Netlify Challenge article | https://www.netlify.com/blog/compete-openai-webmcp-challenge/ | starter、credits、event schedule | CONFIRMED article；older deadline conflicts with Rules |
| Netlify Challenge hub | https://webmcpchallenge.netlify.app/ | supporter-specific dates、credits、prize pool、Discord | CONFIRMED current supporter page；close aligns with Rules, winner date differs |
| Netlify Challenge links | https://www.netlify.com/webmcp-challenge/links/ | consolidated OpenAI／Devpost／resource links | CONFIRMED supporter page |
| Netlify credit instructions | https://www.netlify.com/webmcp-challenge/credits/ | registration、team ID、Discord、credit request flow | CONFIRMED supporter page；quota／approval VOLATILE |

## E. Credits／starter links

| Resource | URL | 用途 | 證據標記 |
|---|---|---|---|
| Netlify starter | https://webmcp-starter.netlify.app/ | WebMCP starter | VOLATILE |
| Netlify participant form | https://forms.gle/xw75XGUQzCXEiALc7 | 3,000 credits application | VOLATILE、subject to approval／quota |
| Vercel credits | https://credits.vercel.sh/ | first-1000 builders credits code page | VOLATILE |
| Render participant credits | https://credits-portal-mmdm.onrender.com/ | first-claims participant credit portal | VOLATILE |
| Cloudflare challenge／starter | https://webmcp-challenge.examples.workers.dev/ | starter and challenge resources | VOLATILE |
| OpenAI Discord | https://discord.com/invite/openai | official support/community route linked by Challenge resources | VOLATILE access／channel availability |

## F. Community evidence and unresolved questions

| Topic | URL | Observation | Status |
|---|---|---|---|
| Multiple submissions clarification | https://webmcp.devpost.com/forum_topics/44943-clarification-on-submission-limit-one-entry-per-entrant | Devpost manager says typo corrected；unique／substantially different projects allowed；one prize per project／entrant | CONFIRMED clarification；Rules current text controls |
| Private backend question | https://webmcp.devpost.com/forum_topics/44963-can-a-pre-existing-proprietary-hosted-backend-remain-private | participant asks whether pre-existing private backend can remain private；no authoritative answer observed | UNRESOLVED |
| Private dependency question | https://webmcp.devpost.com/forum_topics/44950-are-private-repo-dependencies-allowed | participant asks about auth-gated Composer dependency；no authoritative answer observed | UNRESOLVED |
| Browser extension consumer question | https://webmcp.devpost.com/forum_topics/44989-does-a-browser-extension-that-consumes-webmcp-tools-qualify-or-must-the-submission-be-a-web-app-that-exposes-them | question exists；no authoritative answer observed in this snapshot | UNRESOLVED |
| Credit delivery report | https://webmcp.devpost.com/forum_topics/44988-netlify-and-vercel-credits-issues | one participant reports waiting for credits／responses | ANECDOTAL；not policy |
| OpenAI Reddit announcement mirror | https://www.reddit.com/r/codex/comments/1vybe0i/webmcp_challenge/ | community repost repeats 17:00 Pacific deadline | LOW-CONFIDENCE／conflicts with Rules |

## Research method

- 先查 Official Rules，再對照 Devpost overview／resources／updates。
- 技術問題只用 WebMCP spec、Chrome official、ChatGPT official guide 和 supporter primary material 作主要依據。
- 對 deadline、eligibility、credits、rollout 做 conflict log，不用單一 marketing page 推翻 Rules。
- 對未有 organizer answer 的 discussion 不作肯定結論。
- 沒有把整篇網頁複製進來；本資料庫以 paraphrase、短 code pattern 和 source link 保存決策所需內容。
