const CONSOLE_POLISH_STYLE = `
:root{--fuchsia:#d946ef;--fuchsia-hover:#c026d3;--ink:#171717;--body:#404040;--muted:#737373;--line:#e5e5e5;--canvas:#fafafa;--surface:#fff;--dark:#171717;--cyan:#22d3ee;--yellow:#facc15;--green:#16a34a;--green-soft:#dcfce7;--blue:#2563eb;--blue-soft:#dbeafe;--red:#dc2626;--red-soft:#fee2e2;--focus:rgba(217,70,239,.2)}
body{background:var(--canvas);color:var(--ink);font-family:"Nunito",sans-serif}[hidden]{display:none!important}a{color:inherit}.container{width:min(1200px,100%);padding-left:36px;padding-right:36px}.primary-nav{height:68px;background:rgba(250,250,250,.94);border-bottom:1px solid var(--line)}.brand{display:inline-flex;align-items:baseline;gap:8px;font:800 21px/1 "Poppins",sans-serif;letter-spacing:-.06em}.brand-word{color:var(--ink)}.brand-name{display:inline-flex;align-items:baseline;gap:8px}.brand-name small,.brand-product{color:var(--muted);font:700 10px/1 "Space Mono",monospace;letter-spacing:.1em;text-transform:uppercase}.nav-right{display:flex;align-items:center;gap:20px;color:var(--body);font-size:14px}.nav-right>a:hover{color:var(--fuchsia)}.console-nav .nav-right{gap:14px}.console-context{color:var(--muted);font:700 10px/1 "Space Mono",monospace;letter-spacing:.08em;text-transform:uppercase}.button{min-height:42px;padding:10px 17px;border:1px solid transparent;border-radius:999px;font:800 14px/1 "Nunito",sans-serif;transition:background .18s ease,border-color .18s ease,color .18s ease,transform .18s ease,box-shadow .18s ease}.button-primary{background:var(--fuchsia);color:#fff;box-shadow:1px 2px 4px rgba(0,0,0,.08)}.button-primary:hover{background:var(--fuchsia-hover);color:#fff;transform:translateY(-1px);box-shadow:4px 8px 14px rgba(217,70,239,.15)}.button-secondary{background:var(--surface);border-color:var(--line);color:var(--body)}.button-secondary:hover{border-color:#d946ef;color:var(--fuchsia);background:#fff}.button-tertiary{background:transparent;color:var(--body);padding-left:10px;padding-right:10px}.button-tertiary:hover{background:#fdf4ff;color:var(--fuchsia)}.button-wide{width:100%}.button:disabled{cursor:wait;opacity:.55}.utility,.eyebrow{color:var(--muted);font:700 10px/1.2 "Space Mono",monospace;letter-spacing:.1em;text-transform:uppercase}.muted{color:var(--muted)}.pill{display:inline-flex;align-items:center;padding:5px 9px;border-radius:999px;font:700 10px/1.2 "Space Mono",monospace;letter-spacing:.04em}.pill-green{background:var(--green-soft);color:#166534}.pill-blue{background:var(--blue-soft);color:#1d4ed8}
.dashboard-page{background:var(--canvas)}.dashboard-layout{display:grid;grid-template-columns:208px minmax(0,1fr);width:min(1200px,100%);margin:0 auto;min-height:calc(100vh - 68px)}.doc-sidebar{padding:36px 24px 42px 0;border-right:1px solid var(--line);background:var(--canvas)}.sidebar-title{padding:0 12px 8px;color:var(--muted);font:700 10px/1.2 "Space Mono",monospace;letter-spacing:.1em;text-transform:uppercase}.sidebar-account{padding:0 12px 24px;color:var(--ink);font:700 14px/1.3 "Poppins",sans-serif}.sidebar-nav{display:grid;gap:4px}.side-link{display:block;padding:10px 12px;border:1px solid transparent;border-radius:10px;color:var(--body);font-size:14px;font-weight:700}.side-link:hover{background:var(--surface);color:var(--ink)}.side-link.active{border-color:#f0abfc;background:#fdf4ff;color:#a21caf}.sidebar-rule{height:1px;margin:28px 12px;background:var(--line)}.sidebar-help{padding:0 12px;color:var(--muted);font-size:12px;line-height:1.5}.sidebar-help p{margin:9px 0 0}.dashboard-main{min-width:0;padding:46px 0 74px 46px}.dashboard-header{display:flex;align-items:flex-start;justify-content:space-between;gap:30px}.dashboard-header h1{margin:12px 0 7px;font:800 clamp(32px,4vw,46px)/1.08 "Poppins",sans-serif;letter-spacing:-.055em}.dashboard-header p{margin:0;color:var(--body);font-size:16px}.account-chip{display:flex;align-items:center;gap:9px;color:var(--body);font-size:13px}.avatar{width:34px;height:34px;display:grid;place-items:center;border:1px solid #f0abfc;border-radius:50%;background:#fdf4ff;color:#a21caf;font:800 14px/1 "Poppins",sans-serif}.metric-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:34px 0 52px}.metric-card{min-height:116px;padding:18px 20px;border:1px solid var(--line);border-radius:16px;background:var(--surface);box-shadow:1px 2px 4px rgba(0,0,0,.03)}.metric-card-dark{border-color:var(--dark);background:var(--dark);color:#fff}.metric-card .utility{color:var(--muted)}.metric-card-dark .utility{color:#a3a3a3}.metric-card strong{display:block;margin:11px 0 5px;font:800 30px/1 "Poppins",sans-serif;letter-spacing:-.05em}.metric-card>span:last-child{color:var(--muted);font-size:12px}.metric-card-dark>span:last-child{color:#a3a3a3}.metric-ready{color:#4ade80!important;font-size:22px!important;letter-spacing:0!important}.dashboard-section{margin-bottom:54px}.section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px}.section-head h2{margin:9px 0 0;font:700 24px/1.2 "Poppins",sans-serif;letter-spacing:-.035em}.section-intro{margin:7px 0 0;color:var(--muted);font-size:13px}.organization-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin-top:18px}.organization-card{min-height:76px;display:flex;align-items:center;gap:12px;padding:14px;border:1px solid var(--line);border-radius:14px;background:var(--surface);color:var(--ink);text-align:left;box-shadow:1px 2px 4px rgba(0,0,0,.025);transition:border-color .18s ease,background .18s ease,transform .18s ease}.organization-card:hover,.organization-card.selected{border-color:#e879f9;background:#fff;transform:translateY(-1px)}.org-index{display:grid;place-items:center;flex:none;width:34px;height:34px;border-radius:10px;background:#cffafe;color:#0891b2;font:700 11px/1 "Space Mono",monospace}.organization-card:nth-child(2n) .org-index{background:#fef9c3;color:#854d0e}.org-details{flex:1;min-width:0}.org-details strong,.org-details small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.org-details strong{font-size:14px}.org-details small{margin-top:4px;color:var(--muted);font:11px "Space Mono",monospace}.org-count{color:var(--muted);font-size:11px}.integration-grid{display:grid;grid-template-columns:minmax(0,1.12fr) minmax(280px,.88fr);gap:12px;margin-top:18px}.keys-panel,.quickstart-panel{padding:22px;border:1px solid var(--line);border-radius:16px;background:var(--surface)}.subpanel-header{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}.subpanel-header h3,.quickstart-panel h3{margin:9px 0 0;font:700 19px/1.25 "Poppins",sans-serif;letter-spacing:-.03em}.subpanel-copy{max-width:520px;margin:12px 0 0;color:var(--body);font-size:13px}.key-list{margin-top:18px}.key-row{display:flex;align-items:center;gap:11px;padding:12px 0;border-top:1px solid var(--line)}.key-dot{width:8px;height:8px;border-radius:50%;background:#a3a3a3}.key-dot.active{background:#22c55e}.key-name{flex:1;min-width:0}.key-name strong,.key-name small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.key-name strong{font:600 12px "Space Mono",monospace}.key-name small{margin-top:4px;color:var(--muted);font:10px "Space Mono",monospace}.key-status{color:#16a34a;font:700 10px "Space Mono",monospace;text-transform:uppercase}.quickstart-panel{border-color:var(--dark);background:var(--dark);color:#fff}.quickstart-panel .utility{color:#a3a3a3}.quickstart-panel h3{color:#fff}.quickstart-code{margin:20px 0;padding:15px;border:1px solid #404040;border-radius:12px;background:#262329;color:#f5f5f5;font:12px/1.7 "Space Mono",monospace;white-space:pre-wrap;overflow:auto}.quickstart-foot{color:#a3a3a3;font-size:12px;line-height:1.5}.secret-reveal{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:16px;padding:13px;border:1px solid #86efac;border-radius:12px;background:var(--green-soft)}.secret-reveal strong,.secret-reveal small{display:block}.secret-reveal strong{margin-top:5px;color:var(--ink);font:600 12px "Space Mono",monospace;word-break:break-all}.secret-reveal small{color:var(--body);font-size:11px}.empty-card,.loading-card,.empty-row{padding:18px;border:1px dashed #d4d4d4;border-radius:12px;background:var(--surface);color:var(--muted);font-size:13px}.empty-card,.loading-card{grid-column:1/-1}.console-dialog{width:min(430px,calc(100vw - 32px));padding:0;border:1px solid var(--line);border-radius:18px;background:var(--surface);color:var(--ink);box-shadow:0 25px 60px rgba(0,0,0,.16)}.console-dialog::backdrop{background:rgba(23,23,23,.38)}.console-dialog form{padding:26px}.console-dialog h2{margin:12px 0 8px;font:700 24px/1.2 "Poppins",sans-serif;letter-spacing:-.04em}.console-dialog p{margin:0 0 22px;color:var(--body);font-size:13px}.dialog-close{float:right;border:1px solid var(--line);border-radius:999px;background:var(--surface);color:var(--body);font-size:12px;padding:6px 10px}.console-dialog label{display:flex;flex-direction:column;gap:6px;margin-bottom:17px;color:var(--body);font-size:13px;font-weight:700}.console-dialog input{width:100%;height:40px;padding:8px 12px;border:1px solid #d4d4d4;border-radius:10px;background:var(--surface);color:var(--ink);font-size:15px}.console-dialog input:focus{border-color:var(--fuchsia);outline:3px solid var(--focus);outline-offset:0}.toast{position:fixed;right:22px;bottom:22px;padding:12px 16px;border:1px solid #404040;border-radius:999px;background:var(--dark);color:#fff;font-size:13px;box-shadow:0 10px 26px rgba(0,0,0,.14)}
.auth-main{display:grid;grid-template-columns:minmax(0,1fr) minmax(360px,460px);gap:80px;align-items:center;min-height:calc(100vh - 68px);padding-top:64px;padding-bottom:64px}.auth-story h1{max-width:560px;margin:16px 0 15px;font:800 clamp(42px,5vw,68px)/1.03 "Poppins",sans-serif;letter-spacing:-.06em}.auth-story>p{max-width:470px;margin:0;color:var(--body);font-size:18px}.auth-story-note{max-width:350px;margin-top:40px;padding:17px 0;border-top:1px solid var(--line);color:var(--body);font-size:14px}.auth-story-note strong{display:block;margin-bottom:6px;color:var(--ink);font:700 18px/1.2 "Poppins",sans-serif}.auth-card{padding:28px;border:1px solid var(--line);border-radius:18px;background:var(--surface);box-shadow:4px 12px 28px rgba(0,0,0,.05)}.auth-card-header h2{margin:11px 0 7px;font:700 24px/1.2 "Poppins",sans-serif;letter-spacing:-.04em}.auth-card-header p{margin:0 0 24px;color:var(--body);font-size:14px}.auth-card form{display:flex;flex-direction:column;gap:15px}.auth-card label{display:flex;flex-direction:column;gap:6px;color:var(--body);font-size:13px;font-weight:700}.auth-card input{width:100%;height:40px;padding:8px 12px;border:1px solid #d4d4d4;border-radius:10px;background:var(--surface);color:var(--ink);font-size:15px}.auth-card input:focus{border-color:var(--fuchsia);outline:3px solid var(--focus);outline-offset:0}.input-pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}.form-hint{margin:-2px 0 0;color:var(--muted);font-size:11px;line-height:1.5}.form-error{padding:11px 13px;border:1px solid #fca5a5;border-left:4px solid var(--red);border-radius:10px;background:var(--red-soft);color:var(--ink);font-size:12px}.auth-switch{margin-top:18px;color:var(--body);text-align:center;font-size:13px}.auth-switch a{color:#a21caf;text-decoration:underline;text-underline-offset:3px}.auth-footer{margin-top:17px;padding-top:14px;border-top:1px solid var(--line);color:var(--muted);font-size:11px}
@media(max-width:980px){.container{padding-left:28px;padding-right:28px}.dashboard-layout{grid-template-columns:188px minmax(0,1fr)}.dashboard-main{padding-left:32px}.auth-main{grid-template-columns:1fr;gap:42px}.auth-story{max-width:720px}.auth-story-note{margin-top:28px}.integration-grid{grid-template-columns:1fr}}
@media(max-width:720px){.container{padding-left:20px;padding-right:20px}.primary-nav{height:auto;min-height:64px}.nav-inner{padding-top:12px;padding-bottom:12px}.nav-right{gap:10px}.console-context{display:none}.nav-right>a:not(.button){display:none}.nav-right .button{padding-left:14px;padding-right:14px}.dashboard-layout{display:block;min-height:0}.doc-sidebar{display:flex;align-items:center;gap:5px;overflow-x:auto;padding:10px 20px;border-right:0;border-bottom:1px solid var(--line)}.sidebar-title,.sidebar-account,.sidebar-rule,.sidebar-help{display:none}.sidebar-nav{display:flex;gap:5px}.side-link{flex:none;white-space:nowrap;padding:9px 11px}.dashboard-main{padding:32px 20px 56px}.dashboard-header{display:block}.account-chip{margin-top:20px}.metric-grid{grid-template-columns:1fr 1fr;margin:28px 0 42px}.metric-card:last-child{grid-column:1/-1}.section-head{align-items:flex-start;flex-direction:column;gap:14px}.section-head .button{width:100%}.organization-list{grid-template-columns:1fr}.keys-panel,.quickstart-panel{padding:19px}.secret-reveal{align-items:flex-start;flex-direction:column}.auth-main{padding-top:40px;padding-bottom:42px}.auth-story h1{font-size:47px}.input-pair{grid-template-columns:1fr}.auth-card{padding:22px}.brand{font-size:19px}}
`;

const CONSOLE_EXTENSION_STYLE = `
.dashboard-header-actions{display:flex;align-items:center;gap:18px}.dashboard-header-actions .account-chip{flex:none}.metric-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.metric-card-alert strong{color:var(--primary)}
.activity-section{padding:22px;border:1px solid var(--hairline);border-radius:6px;background:var(--doc)}.activity-head{display:flex;align-items:flex-end;justify-content:space-between;gap:24px}.activity-head h2{margin:11px 0 0;font-size:21px;font-weight:700;line-height:1.4;letter-spacing:-.5px}.activity-head p{max-width:560px;margin:8px 0 0;color:var(--body);font-size:14px}.activity-refresh{display:flex;align-items:center;gap:9px;color:var(--mute);font-size:12px;white-space:nowrap}.activity-live-dot{width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 0 3px var(--green-soft)}.activity-refresh button{border:0;background:transparent;color:var(--teal);font-size:12px;font-weight:700}.activity-grid{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(0,.92fr);gap:16px;margin-top:20px}.activity-panel{min-width:0;padding:20px;border:1px solid var(--hairline-soft);border-radius:6px;background:var(--surface)}.activity-panel-dark{border-color:var(--dark);background:var(--dark);color:var(--surface)}.activity-panel-header{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}.activity-panel-header h3{margin:8px 0 0;font-size:18px;font-weight:700;line-height:1.35}.activity-count{display:grid;place-items:center;min-width:30px;height:30px;padding:0 8px;border-radius:999px;background:var(--soft);color:var(--body);font-size:12px;font-weight:800}.activity-panel-dark .utility{color:var(--stone)}.activity-panel-dark .activity-count{background:#3b3d35;color:var(--surface)}.activity-list{margin-top:18px}.activity-row{padding:13px 0;border-top:1px solid var(--hairline-soft)}.activity-row:first-child{border-top:0;padding-top:0}.activity-row-top,.activity-row-bottom{display:flex;align-items:center;justify-content:space-between;gap:14px}.activity-event{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:600 12px ui-monospace,SFMono-Regular,Menlo,monospace}.activity-status{flex:none;padding:4px 7px;border-radius:999px;font:700 10px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase}.activity-status.accepted,.activity-status.acknowledged{background:var(--green-soft);color:var(--green)}.activity-status.pending,.activity-status.leased{background:var(--blue-soft);color:var(--blue)}.activity-status.retry-exhausted{background:var(--red-soft);color:var(--red)}.activity-status.neutral{background:var(--soft);color:var(--body)}.activity-row-bottom{margin-top:7px;color:var(--mute);font-size:12px}.activity-panel-dark .activity-row{border-color:#4d4f46}.activity-panel-dark .activity-row-bottom{color:var(--stone)}.activity-empty{padding:15px 0;color:var(--mute);font-size:13px}.activity-panel-dark .activity-empty{color:var(--stone)}
.quick-connect-section{scroll-margin-top:24px}.quick-connect-section .section-head{align-items:flex-start}.quick-connect-card{border:1px solid var(--dark);border-radius:6px;background:var(--dark);color:var(--surface);overflow:hidden}.quick-connect-tabs{display:flex;gap:4px;padding:10px;border-bottom:1px solid #4d4f46;background:#2c2e27}.quick-connect-tab{padding:8px 13px;border:1px solid transparent;border-radius:5px;background:transparent;color:var(--stone);font-size:13px;font-weight:700}.quick-connect-tab:hover{color:var(--surface);background:#3b3d35}.quick-connect-tab[aria-selected="true"]{border-color:var(--primary);background:var(--primary);color:var(--ink)}.quick-connect-panel{padding:24px}.quick-connect-panel[hidden]{display:none}.quick-connect-intro{max-width:680px;margin:0;color:var(--stone);font-size:14px}.quick-connect-step-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:22px}.quick-connect-step{min-width:0;padding:18px;border:1px solid #4d4f46;border-radius:6px;background:#2c2e27}.quick-connect-step-number{display:grid;place-items:center;width:27px;height:27px;border-radius:6px;background:var(--primary);color:var(--ink);font:700 11px ui-monospace,SFMono-Regular,Menlo,monospace}.quick-connect-step h3{margin:14px 0 6px;color:var(--surface);font-size:16px}.quick-connect-step p{margin:0;color:var(--stone);font-size:12px;line-height:1.55}.quick-connect-code{margin:14px 0 0;padding:12px;border:1px solid #55574d;border-radius:5px;background:#1f211b;color:#f5f5ed;font:12px/1.65 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;overflow:auto}.quick-connect-code code{font:inherit}.quick-connect-note{margin:18px 0 0;padding:12px 14px;border-left:3px solid var(--primary);background:#33342d;color:var(--stone);font-size:12px;line-height:1.55}.quick-connect-note strong{color:var(--surface)}.quick-connect-footer{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-top:20px;color:var(--stone);font-size:12px}.quick-connect-footer a{color:var(--primary);font-weight:700}.quick-connect-footer a:hover{text-decoration:underline;text-underline-offset:3px}
.page-summary{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(280px,.9fr);gap:16px;margin-bottom:52px}.summary-card{padding:22px;border:1px solid var(--hairline);border-radius:6px;background:var(--doc)}.summary-card-dark{border-color:var(--dark);background:var(--dark);color:var(--surface)}.summary-card h2{margin:10px 0 7px;font-size:23px;font-weight:700;line-height:1.3;letter-spacing:-.5px}.summary-card p{margin:0;color:var(--body);font-size:14px;line-height:1.55}.summary-card-dark p{color:var(--hairline-soft)}.summary-link{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:20px;padding:13px 0;border-top:1px solid var(--hairline-soft);font-size:14px;font-weight:700}.summary-card-dark .summary-link{border-color:#4d4f46}.summary-link span:last-child{color:var(--teal);font-size:13px}.summary-card-dark .summary-link span:last-child{color:var(--primary)}.setup-summary{display:grid;gap:10px;margin-top:18px}.setup-step{display:grid;grid-template-columns:28px 1fr;gap:11px;align-items:start;padding:12px 0;border-top:1px solid var(--hairline-soft)}.setup-step:first-child{border-top:0;padding-top:0}.setup-step-number{display:grid;place-items:center;width:26px;height:26px;border-radius:6px;background:var(--soft);color:var(--body);font-size:11px;font-weight:800}.setup-step strong{display:block;font-size:14px}.setup-step span{display:block;margin-top:3px;color:var(--mute);font-size:12px}.activity-row-button{display:block;width:100%;border:0;background:transparent;color:inherit;text-align:left;cursor:pointer}.activity-row-button:hover,.activity-row-button:focus-visible{background:var(--soft)}.activity-row-button.is-selected{background:var(--soft)}.activity-panel-dark .activity-row-button:hover,.activity-panel-dark .activity-row-button:focus-visible,.activity-panel-dark .activity-row-button.is-selected{background:#33342d}.activity-detail-layout{display:grid;grid-template-columns:minmax(0,.9fr) minmax(320px,1.1fr);gap:16px;margin-top:22px}.activity-detail-list,.activity-detail-panel{min-width:0;padding:22px;border:1px solid var(--hairline);border-radius:6px;background:var(--doc)}.activity-detail-panel{background:var(--surface)}.activity-detail-list .activity-list{margin-top:16px}.activity-detail-panel h3{margin:9px 0 6px;font-size:22px;font-weight:700;line-height:1.3;letter-spacing:-.5px}.detail-copy{margin:0;color:var(--body);font-size:13px;line-height:1.55}.detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 18px;margin-top:22px}.detail-field{padding:12px 0;border-top:1px solid var(--hairline-soft)}.detail-field dt{color:var(--mute);font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}.detail-field dd{margin:5px 0 0;overflow-wrap:anywhere;color:var(--ink);font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace}.detail-notice{margin-top:20px;padding:12px 14px;border-left:3px solid var(--primary);background:var(--soft);color:var(--body);font-size:12px;line-height:1.55}.detail-empty{padding:28px 0;color:var(--mute);font-size:14px}.detail-empty[hidden]{display:none}.page-header-actions{display:flex;align-items:center;gap:12px}.dashboard-header-status{margin-top:18px}.page-kicker{max-width:720px}.page-kicker h1{max-width:720px}.nav-count{display:inline-grid;place-items:center;min-width:20px;height:20px;margin-left:5px;padding:0 5px;border-radius:999px;background:var(--soft);color:var(--body);font-size:11px;font-weight:800}
.overview-grid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(280px,.9fr);gap:16px;margin-bottom:52px}.overview-grid .summary-card{min-width:0}.overview-grid .button{margin-top:18px}
.organization-open{display:flex;align-items:center;gap:12px;flex:1;min-width:0;padding:0;border:0;background:transparent;color:inherit;text-align:left}.organization-open:hover .org-details strong{text-decoration:underline;text-underline-offset:3px}.org-open{color:var(--teal);font-size:11px;font-weight:800;white-space:nowrap}.org-actions{display:flex;align-items:center;gap:7px;margin-left:auto}.org-delete{color:var(--red)}.org-delete:hover{background:var(--red-soft);color:var(--red)}.workspace-bar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:24px}.workspace-back{color:var(--teal);font-size:13px;font-weight:800}.workspace-back:hover{text-decoration:underline;text-underline-offset:3px}.workspace-id{color:var(--mute);font:11px ui-monospace,SFMono-Regular,Menlo,monospace}.workspace-summary{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(280px,.9fr);gap:16px;margin-bottom:52px}.workspace-summary .summary-card{min-width:0}.workspace-identity{display:flex;align-items:center;gap:13px;margin-top:18px}.workspace-identity-mark{display:grid;place-items:center;width:42px;height:42px;border-radius:12px;background:var(--blue-soft);color:var(--blue);font:800 14px ui-monospace,SFMono-Regular,Menlo,monospace}.workspace-identity strong,.workspace-identity span{display:block}.workspace-identity span{margin-top:3px;color:var(--mute);font-size:12px}.danger-zone{margin-top:22px;padding-top:17px;border-top:1px solid var(--hairline-soft)}.danger-zone p{margin:0 0 10px;color:var(--mute);font-size:12px}.organization-setup-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:18px}.organization-setup-step{min-width:0;padding:18px;border:1px solid var(--hairline-soft);border-radius:6px;background:var(--surface)}.organization-setup-step h3{margin:12px 0 5px;font-size:16px}.organization-setup-step p{margin:0;color:var(--body);font-size:12px;line-height:1.55}.organization-setup-step .quick-connect-code{margin-top:13px}.organization-setup-step-number{display:grid;place-items:center;width:28px;height:28px;border-radius:6px;background:var(--primary);color:var(--ink);font:800 11px ui-monospace,SFMono-Regular,Menlo,monospace}
.docs-page{background:var(--canvas)}.docs-layout{display:grid;grid-template-columns:220px minmax(0,1fr);width:min(1200px,100%);margin:0 auto;min-height:calc(100vh - 68px)}.docs-aside{padding:38px 25px 60px 0;border-right:1px solid var(--hairline-soft)}.docs-aside h2{margin:8px 12px 20px;font-size:18px}.docs-aside nav{display:grid;gap:3px}.docs-aside a{padding:9px 12px;border-radius:6px;color:var(--body);font-size:13px;font-weight:700}.docs-aside a:hover{background:var(--soft);color:var(--ink)}.docs-aside-note{margin:30px 12px 0;padding-top:18px;border-top:1px solid var(--hairline-soft);color:var(--mute);font-size:12px;line-height:1.55}.docs-main{min-width:0;padding:52px 0 80px 48px}.docs-hero{max-width:800px;padding-bottom:40px}.docs-hero h1{max-width:720px;margin:13px 0 10px;font-size:42px;font-weight:800;line-height:1.18;letter-spacing:-1px}.docs-hero p{max-width:670px;margin:0;color:var(--body);font-size:17px;line-height:1.6}.docs-section{max-width:900px;margin-top:48px;scroll-margin-top:25px}.docs-section>h2{margin:10px 0 7px;font-size:27px;font-weight:800;letter-spacing:-.6px}.docs-section>p{max-width:720px;margin:0;color:var(--body);font-size:14px}.docs-callout{margin-top:20px;padding:17px 19px;border-left:3px solid var(--primary);background:var(--soft);color:var(--body);font-size:13px;line-height:1.6}.docs-callout strong{color:var(--ink)}.docs-code{margin:18px 0 0;padding:17px;border:1px solid #4d4f46;border-radius:6px;background:var(--dark);color:#f5f5ed;font:12px/1.7 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;overflow:auto}.docs-card-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px}.docs-card{min-width:0;padding:18px;border:1px solid var(--hairline-soft);border-radius:6px;background:var(--surface)}.docs-card h3{margin:11px 0 5px;font-size:16px}.docs-card p{margin:0;color:var(--body);font-size:13px;line-height:1.55}.docs-card-number{display:grid;place-items:center;width:28px;height:28px;border-radius:6px;background:var(--primary);color:var(--ink);font:800 11px ui-monospace,SFMono-Regular,Menlo,monospace}.docs-methods{display:grid;gap:0;margin-top:20px;border-top:1px solid var(--hairline-soft)}.docs-method{display:grid;grid-template-columns:170px 1fr;gap:18px;padding:16px 0;border-bottom:1px solid var(--hairline-soft)}.docs-method code{color:var(--teal);font:700 12px ui-monospace,SFMono-Regular,Menlo,monospace}.docs-method strong{display:block;font-size:14px}.docs-method span{display:block;margin-top:4px;color:var(--body);font-size:13px;line-height:1.5}.docs-footer{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:40px;padding-top:20px;border-top:1px solid var(--hairline-soft);color:var(--mute);font-size:12px}
@media(max-width:980px){.metric-grid{grid-template-columns:repeat(2,1fr)}.activity-grid,.quick-connect-step-grid{grid-template-columns:1fr}.activity-head{align-items:flex-start;flex-direction:column;gap:12px}}
@media(max-width:720px){.dashboard-header-actions{align-items:flex-start;flex-direction:column;gap:14px;margin-top:20px}.dashboard-header-actions .button{width:100%}.metric-grid{grid-template-columns:1fr 1fr}.activity-section{padding:18px}.activity-panel{padding:18px}.activity-row-top,.activity-row-bottom{align-items:flex-start;flex-direction:column;gap:7px}.quick-connect-panel{padding:18px}.quick-connect-tabs{overflow-x:auto}.quick-connect-tab{flex:none}.quick-connect-footer{align-items:flex-start;flex-direction:column}.page-summary,.activity-detail-layout,.overview-grid,.workspace-summary{grid-template-columns:1fr}.activity-detail-list,.activity-detail-panel{padding:18px}.detail-grid{grid-template-columns:1fr}.page-header-actions{align-items:flex-start;flex-direction:column}.page-header-actions .button{width:100%}.workspace-bar{align-items:flex-start;flex-direction:column}.organization-setup-grid,.docs-card-grid{grid-template-columns:1fr}.organization-card{align-items:flex-start}.org-actions{align-items:flex-end;flex-direction:column}.org-open{display:none}.docs-layout{display:block;min-height:0}.docs-aside{padding:12px 20px;border-right:0;border-bottom:1px solid var(--hairline-soft)}.docs-aside h2,.docs-aside-note{display:none}.docs-aside nav{display:flex;gap:5px;overflow-x:auto}.docs-aside a{flex:none;white-space:nowrap}.docs-main{padding:34px 20px 58px}.docs-hero h1{font-size:34px}.docs-hero p{font-size:16px}.docs-section{margin-top:38px}.docs-method{grid-template-columns:1fr;gap:7px}.docs-footer{align-items:flex-start;flex-direction:column}}
`;

const DASHBOARD_REFINEMENT_STYLE = `
.dashboard-page .dashboard-main{padding-top:38px}.dashboard-page .doc-sidebar{background:#f7f8f4}.dashboard-page .sidebar-help{padding:16px 12px;border:1px solid var(--hairline-soft);border-radius:10px;background:var(--surface)}.dashboard-page .sidebar-help .eyebrow{color:var(--teal)}.dashboard-page .page-kicker h1{letter-spacing:-1px}.dashboard-page .dashboard-header-status{display:flex;align-items:center;gap:9px}.dashboard-page .dashboard-section{scroll-margin-top:22px}.dashboard-page .summary-card,.dashboard-page .activity-section,.dashboard-page .quick-connect-card,.dashboard-page .workspace-summary,.dashboard-page .keys-panel,.dashboard-page .quickstart-panel{box-shadow:0 5px 18px rgba(35,37,29,.045)}.dashboard-page .organization-card{box-shadow:none}.dashboard-page .organization-card:hover{box-shadow:0 7px 16px rgba(35,37,29,.07)}.workspace-summary .summary-card-dark h2{max-width:320px}.workspace-setup-intro{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:18px}.workspace-setup-intro h2{margin:8px 0 0;font-size:25px;letter-spacing:-.5px}.workspace-setup-intro p{max-width:480px;margin:0;color:var(--body);font-size:13px;line-height:1.55}.workspace-setup-progress{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:52px}.workspace-setup-progress article{min-width:0;padding:18px;border:1px solid var(--hairline-soft);border-radius:10px;background:var(--surface)}.workspace-setup-progress article.is-ready{border-color:#b9d9c4;background:#f6fbf7}.workspace-setup-number{display:grid;place-items:center;width:28px;height:28px;border-radius:8px;background:var(--soft);color:var(--body);font:800 11px ui-monospace,SFMono-Regular,Menlo,monospace}.workspace-setup-progress article.is-ready .workspace-setup-number{background:var(--green-soft);color:var(--green)}.workspace-setup-progress h3{margin:13px 0 5px;font-size:15px}.workspace-setup-progress p{margin:0;color:var(--mute);font-size:12px;line-height:1.5}.docs-hero .docs-callout{max-width:760px}.docs-variable-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:20px}.docs-variable{padding:16px;border:1px solid var(--hairline-soft);border-radius:6px;background:var(--surface)}.docs-variable code{display:block;color:var(--teal);font:700 12px ui-monospace,SFMono-Regular,Menlo,monospace}.docs-variable strong{display:block;margin-top:8px;font-size:13px}.docs-variable span{display:block;margin-top:4px;color:var(--body);font-size:12px;line-height:1.45}@media(max-width:720px){.workspace-setup-intro{align-items:flex-start;flex-direction:column}.workspace-setup-progress,.docs-variable-grid{grid-template-columns:1fr}}
`;

const ORGANIZATION_CHOOSER_STYLE = `
.organization-chooser-page{min-height:100vh;background:var(--canvas)}.organization-chooser-page .primary-nav{background:var(--surface)}.organization-chooser-main{display:grid;place-items:center;min-height:calc(100vh - 68px);padding:56px 20px 80px}.organization-chooser{width:min(720px,100%)}.organization-chooser-header{max-width:560px}.organization-chooser-header h1{margin:12px 0 10px;font:800 clamp(36px,6vw,58px)/1.05 "Poppins",sans-serif;letter-spacing:-.06em}.organization-chooser-header p{margin:0;color:var(--body);font-size:17px;line-height:1.55}.organization-chooser-actions{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:34px}.organization-chooser-actions h2{margin:0;font:700 20px/1.25 "Poppins",sans-serif;letter-spacing:-.03em}.organization-chooser-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:16px}.organization-chooser-list .organization-card{min-height:96px;padding:18px}.organization-chooser-list .organization-open{width:100%}.organization-chooser-list .org-open{font-size:12px}.organization-chooser-empty{display:grid;place-items:center;margin-top:16px;padding:42px 24px;border:1px dashed var(--hairline);border-radius:16px;background:var(--surface);text-align:center}.organization-chooser-empty strong{font:700 18px/1.3 "Poppins",sans-serif}.organization-chooser-empty p{max-width:390px;margin:8px 0 20px;color:var(--body);font-size:14px}.organization-chooser-page .organization-card:hover{border-color:var(--primary);background:var(--surface);transform:translateY(-1px)}.organization-chooser-page .console-dialog{z-index:20}@media(max-width:720px){.organization-chooser-main{align-items:start;padding-top:46px}.organization-chooser-actions{align-items:flex-start;flex-direction:column}.organization-chooser-actions .button{width:100%}.organization-chooser-list{grid-template-columns:1fr}}
`;

const ORGANIZATION_DASHBOARD_STYLE = `
.organization-dashboard .dashboard-layout{grid-template-columns:236px minmax(0,1fr)}.organization-dashboard .doc-sidebar{padding-top:38px}.organization-dashboard .sidebar-account{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.organization-dashboard .dashboard-main{max-width:960px}.organization-dashboard .dashboard-header{padding-bottom:28px;border-bottom:1px solid var(--hairline-soft)}.organization-dashboard .dashboard-header h1{max-width:620px}.organization-dashboard .dashboard-header p{max-width:560px}.organization-dashboard .dashboard-header-actions{display:flex;align-items:flex-start;gap:10px}.organization-dashboard .workspace-label{display:inline-flex;align-items:center;gap:8px;margin-top:5px;color:var(--mute);font-size:12px}.organization-dashboard .workspace-label::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--green)}.organization-overview{max-width:780px;padding:56px 0 20px}.organization-overview h2{max-width:620px;margin:12px 0 12px;font-size:clamp(30px,4vw,48px);font-weight:800;line-height:1.08;letter-spacing:-1.4px}.organization-overview>p{max-width:590px;margin:0;color:var(--body);font-size:17px;line-height:1.55}.organization-overview-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;max-width:640px;margin-top:32px}.organization-action{display:flex;align-items:center;justify-content:space-between;gap:18px;min-height:104px;padding:20px 21px;border:1px solid var(--hairline);border-radius:8px;background:var(--surface);color:var(--ink);text-align:left;box-shadow:0 4px 16px rgba(35,37,29,.04);transition:transform .15s ease,border-color .15s ease,box-shadow .15s ease}.organization-action:hover{border-color:var(--primary-active);box-shadow:0 8px 22px rgba(35,37,29,.08);transform:translateY(-2px)}.organization-action strong,.organization-action span{display:block}.organization-action strong{font-size:16px}.organization-action span{margin-top:5px;color:var(--mute);font-size:12px;line-height:1.45}.organization-action-arrow{color:var(--teal);font-size:21px}.organization-boundary-note{max-width:640px;margin-top:24px;padding:14px 16px;border-left:3px solid var(--primary);background:var(--soft);color:var(--body);font-size:13px;line-height:1.5}.organization-boundary-note strong{color:var(--ink)}.organization-page-section{max-width:960px}.organization-page-section .activity-section{margin-top:12px}.organization-contract-list{display:grid;gap:10px;margin-top:22px;max-width:780px}.organization-contract{display:grid;grid-template-columns:150px minmax(0,1fr);gap:20px;padding:18px 0;border-top:1px solid var(--hairline-soft)}.organization-contract:first-child{border-top:0}.organization-contract strong{font-size:14px}.organization-contract p{margin:0;color:var(--body);font-size:14px;line-height:1.55}.organization-contract code{color:var(--teal);font:700 12px ui-monospace,SFMono-Regular,Menlo,monospace}.drawer-backdrop{position:fixed;inset:0;z-index:29;background:rgba(35,37,29,.34);opacity:0;pointer-events:none;transition:opacity .2s ease}.drawer-backdrop.is-open{opacity:1;pointer-events:auto}.drawer{position:fixed;inset:0 0 0 auto;z-index:30;width:min(560px,100vw);overflow:auto;background:var(--surface);box-shadow:-18px 0 40px rgba(35,37,29,.16);transform:translateX(100%);visibility:hidden;transition:transform .22s ease,visibility .22s ease}.drawer.is-open{transform:translateX(0);visibility:visible}.drawer-header{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;padding:28px 30px 22px;border-bottom:1px solid var(--hairline-soft)}.drawer-header h2{margin:8px 0 0;font-size:25px;font-weight:800;line-height:1.2;letter-spacing:-.5px}.drawer-header p{max-width:410px;margin:8px 0 0;color:var(--body);font-size:13px;line-height:1.5}.drawer-close{flex:none;width:34px;height:34px;border:1px solid var(--hairline);border-radius:50%;background:var(--surface);color:var(--body);font-size:20px;line-height:1}.drawer-body{padding:26px 30px 42px}.drawer-section{margin-top:28px}.drawer-section:first-child{margin-top:0}.drawer-section h3{margin:8px 0 0;font-size:17px}.drawer-section>p{margin:7px 0 0;color:var(--body);font-size:13px;line-height:1.5}.drawer-tabs{display:flex;gap:6px;margin-top:20px;padding:4px;border-radius:7px;background:var(--soft)}.drawer-tab{flex:1;padding:9px 12px;border:0;border-radius:5px;background:transparent;color:var(--body);font-size:13px;font-weight:700}.drawer-tab[aria-selected="true"]{background:var(--surface);color:var(--ink);box-shadow:0 1px 3px rgba(35,37,29,.08)}.drawer-panel[hidden]{display:none}.drawer-code-wrap{margin-top:14px}.drawer-code{margin:0;padding:15px;border:1px solid #45483e;border-radius:6px;background:var(--dark);color:#f5f5ed;font:12px/1.65 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;overflow:auto}.drawer-copy{display:flex;justify-content:flex-end;margin-top:8px}.drawer-copy .button{min-height:34px;padding:6px 11px;font-size:12px}.drawer-callout{margin-top:22px;padding:14px 16px;border:1px solid var(--hairline-soft);border-radius:6px;background:var(--doc);color:var(--body);font-size:13px;line-height:1.5}.drawer-callout strong{color:var(--ink)}.drawer-secret-card{padding:18px;border:1px solid var(--green);border-radius:7px;background:var(--green-soft)}.drawer-secret-card code{display:block;margin-top:9px;color:var(--ink);font:700 13px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;word-break:break-all}.drawer-secret-card p{margin:9px 0 0;color:var(--body);font-size:12px}.drawer-credential{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:13px 0;border-top:1px solid var(--hairline-soft)}.drawer-credential:first-child{border-top:0}.drawer-credential code{min-width:0;overflow:hidden;text-overflow:ellipsis;color:var(--teal);font:700 12px ui-monospace,SFMono-Regular,Menlo,monospace}.drawer-credential .button{flex:none;min-height:34px;padding:6px 11px;font-size:12px}.drawer-empty-secret{margin-top:16px;padding:14px;border:1px dashed var(--hairline);border-radius:6px;color:var(--body);font-size:13px;line-height:1.5}.organization-dashboard .nav-count{float:right;margin-left:6px;color:var(--mute);font-size:11px;font-weight:700}@media(max-width:720px){.organization-dashboard .dashboard-layout{display:block}.organization-dashboard .dashboard-main{max-width:none;padding-top:32px}.organization-overview{padding-top:36px}.organization-overview-actions{grid-template-columns:1fr}.organization-contract{grid-template-columns:1fr;gap:6px}.drawer-header{padding:22px 20px 18px}.drawer-body{padding:22px 20px 34px}}
.organization-action-open{color:var(--teal);font:800 10px/1.2 "Space Mono",monospace;letter-spacing:.08em;text-transform:uppercase}
.drawer-close{width:auto;height:auto;min-height:34px;padding:7px 12px;border-radius:999px;font-size:12px;font-weight:700}
`;

const ACCOUNT_DEVICE_STYLE = `
.connector-panel{max-width:780px;margin-top:34px;padding:22px;border:1px solid var(--hairline);border-radius:9px;background:var(--surface);box-shadow:0 5px 18px rgba(35,37,29,.045)}.connector-panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:20px}.connector-panel-head h3{margin:8px 0 0;font-size:19px}.connector-panel-head p{max-width:520px;margin:7px 0 0;color:var(--body);font-size:13px;line-height:1.5}.connector-count{padding:5px 9px;border-radius:999px;background:var(--green-soft);color:var(--green);font:700 10px ui-monospace,SFMono-Regular,Menlo,monospace}.connector-list{display:grid;gap:8px;margin-top:18px}.connector-device{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:13px 14px;border:1px solid var(--hairline-soft);border-radius:7px;background:var(--doc)}.connector-device strong,.connector-device span{display:block}.connector-device span{margin-top:3px;color:var(--mute);font-size:12px}.connector-device-state{flex:none;color:var(--green);font:700 10px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.06em}.connector-empty{padding:14px;border:1px dashed var(--hairline);border-radius:7px;color:var(--body);font-size:13px}.connector-install{margin-top:16px;padding-top:16px;border-top:1px solid var(--hairline-soft)}.connector-install p{margin:0 0 10px;color:var(--body);font-size:12px}.connector-install pre{margin:0;padding:13px;border-radius:6px;background:var(--dark);color:#f5f5ed;font:11px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;overflow:auto}.connector-install-actions{display:flex;justify-content:flex-end;margin-top:8px}.connector-install-actions .button{min-height:34px;padding:6px 11px;font-size:12px}@media(max-width:720px){.connector-panel-head,.connector-device{align-items:flex-start;flex-direction:column}.connector-device-state{margin-top:2px}}
`;

const CONNECTOR_AUTH_STYLE = `
.connector-auth-page{min-height:100vh;background:#11120f;color:#f5f5ed;overflow:hidden;position:relative}.connector-auth-page:before{content:"";position:fixed;inset:0;pointer-events:none;background:linear-gradient(115deg,rgba(247,165,1,.08),transparent 27%,rgba(44,140,102,.09) 75%,transparent 92%);opacity:.8}.connector-auth-nav,.connector-auth-main,.connector-auth-footer-bar{position:relative;z-index:1}.connector-auth-nav{display:flex;align-items:center;justify-content:space-between;width:min(1160px,calc(100% - 48px));margin:0 auto;padding:28px 0}.connector-auth-brand{color:#f5f5ed;font-size:21px;font-weight:800;letter-spacing:-.6px}.connector-auth-nav-status{color:#a9aca1;font:700 10px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em}.connector-auth-main{display:grid;grid-template-columns:minmax(0,1fr) minmax(390px,460px);gap:96px;align-items:center;width:min(1160px,calc(100% - 48px));min-height:calc(100vh - 132px);margin:0 auto;padding:44px 0 86px}.connector-auth-story{max-width:620px}.connector-auth-kicker{color:#f7b52b;font:700 11px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase}.connector-auth-story h1{max-width:600px;margin:21px 0 17px;color:#fff;font-size:clamp(44px,6vw,76px);font-weight:800;line-height:.98;letter-spacing:-.075em}.connector-auth-story>p{max-width:520px;margin:0;color:#c1c4ba;font-size:18px;line-height:1.55}.connector-auth-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;max-width:560px;margin-top:52px}.connector-auth-step{display:flex;gap:10px;min-height:78px;padding:13px;border:1px solid #30332b;border-radius:10px;background:#191a16}.connector-auth-step.is-active{border-color:rgba(247,181,43,.68);background:#242117}.connector-auth-step>span{display:grid;place-items:center;flex:none;width:26px;height:26px;border-radius:7px;background:#2c3028;color:#b9bdb0;font:700 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace}.connector-auth-step.is-active>span{background:#f7b52b;color:#1b1b16}.connector-auth-step strong,.connector-auth-step small{display:block}.connector-auth-step strong{font-size:13px}.connector-auth-step small{margin-top:4px;color:#92968c;font-size:11px;line-height:1.3}.connector-auth-note{display:flex;gap:11px;max-width:520px;margin-top:25px;padding-top:18px;border-top:1px solid #30332b;color:#aeb2a7;font-size:12px;line-height:1.55}.connector-auth-note>span{flex:none;width:7px;height:7px;margin-top:6px;border-radius:50%;background:#6cc48a;box-shadow:0 0 0 5px rgba(108,196,138,.1)}.connector-auth-note p{margin:0}.connector-auth-note strong{color:#f5f5ed}.connector-auth-card{padding:31px;border:1px solid #3a3d33;border-radius:18px;background:rgba(29,30,25,.92);box-shadow:0 24px 80px rgba(0,0,0,.34)}.connector-auth-back{display:inline-flex;align-items:center;gap:6px;margin-bottom:34px;color:#aeb2a7;font-size:12px;text-decoration:none}.connector-auth-back:hover{color:#f5f5ed}.connector-auth-card-kicker{color:#9aa094;font:700 10px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;text-transform:uppercase}.connector-auth-card h2{margin:13px 0 9px;color:#fff;font-size:29px;line-height:1.08;letter-spacing:-.055em}.connector-auth-card-intro{margin:0 0 25px;color:#afb3a8;font-size:14px;line-height:1.5}.connector-auth-form{display:flex;flex-direction:column;gap:15px}.connector-auth-form label{display:flex;flex-direction:column;gap:7px;color:#d6d9cf;font-size:12px;font-weight:700}.connector-auth-form input{width:100%;height:43px;padding:9px 12px;border:1px solid #474a40;border-radius:9px;background:#11120f;color:#f5f5ed;font-size:15px;outline:0}.connector-auth-form input::placeholder{color:#6f7369}.connector-auth-form input:focus{border-color:#f7b52b;box-shadow:0 0 0 3px rgba(247,181,43,.16)}.connector-auth-form .form-hint{margin:-2px 0 0;color:#858a7f;font-size:11px;line-height:1.45}.connector-auth-form .form-error{border-color:#b85c55;border-left-color:#e77d73;background:#3a2421;color:#ffd9d4}.connector-auth-form .button{min-height:45px;border:0;border-radius:9px;background:#f7b52b;color:#191a16;font-weight:800}.connector-auth-form .button:hover{background:#ffca52}.connector-auth-switch{margin:20px 0 0;color:#aeb2a7;text-align:center;font-size:13px}.connector-auth-switch a{color:#f7c454;text-decoration:underline;text-underline-offset:3px}.connector-auth-footnote{margin:22px 0 0;padding-top:17px;border-top:1px solid #30332b;color:#80857a;font-size:11px;line-height:1.5}.connector-auth-footer-bar{width:min(1160px,calc(100% - 48px));margin:0 auto;padding:0 0 24px;color:#73786d;font:10px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.04em;text-transform:uppercase}@media(max-width:900px){.connector-auth-main{grid-template-columns:1fr;gap:45px;min-height:auto;padding-top:40px}.connector-auth-story{max-width:720px}.connector-auth-card{max-width:520px}.connector-auth-steps{margin-top:36px}}@media(max-width:560px){.connector-auth-nav,.connector-auth-main,.connector-auth-footer-bar{width:min(100% - 32px,520px)}.connector-auth-nav{padding-top:22px}.connector-auth-nav-status{font-size:9px}.connector-auth-main{padding-top:34px;padding-bottom:52px}.connector-auth-story h1{font-size:48px}.connector-auth-story>p{font-size:16px}.connector-auth-steps{grid-template-columns:1fr;gap:7px;margin-top:30px}.connector-auth-step{min-height:0}.connector-auth-card{padding:23px 20px;border-radius:15px}.connector-auth-back{margin-bottom:27px}.connector-auth-card h2{font-size:26px}}
`;

const STYLE = [
  '@import url("https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=Poppins:wght@600;700;800&family=Space+Mono:wght@400;700&display=swap");',
  ':root{--primary:#f7a501;--primary-pressed:#dd9001;--primary-active:#b17816;--ink:#23251d;--body:#4d4f46;--mute:#6c6e63;--ash:#9b9c92;--stone:#b6b7af;--hairline:#bfc1b7;--hairline-soft:#dcdfd2;--canvas:#eeefe9;--soft:#e5e7e0;--surface:#fff;--doc:#fcfcfa;--dark:#23251d;--blue:#1d4ed8;--blue-soft:#dceaf6;--teal:#1078a3;--green:#2c8c66;--green-soft:#d9eddf;--red:#cd4239;--red-soft:#f7d6d3;--focus:rgba(59,130,246,.5)}',
  '*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--canvas);color:var(--ink);font:400 16px/1.5 "IBM Plex Sans","IBM Plex Sans Variable",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}a{color:inherit;text-decoration:none}button,input{font:inherit}button{cursor:pointer}img{display:block;max-width:100%}:focus-visible{outline:2px solid var(--focus);outline-offset:3px}',
  '.page{min-height:100vh}.container{width:min(1280px,100%);margin:0 auto;padding-left:48px;padding-right:48px}.primary-nav{height:56px;border-bottom:1px solid var(--hairline-soft);background:var(--canvas)}.nav-inner{height:100%;display:flex;align-items:center;justify-content:space-between}.brand{display:inline-flex;align-items:center;gap:10px;font-size:19px;font-weight:800;letter-spacing:-.4px}.brand-avatar{width:35px;height:35px;object-fit:contain;border:1px solid var(--hairline);border-radius:50%;background:var(--surface)}.brand-name{display:flex;align-items:baseline;gap:7px}.brand-name small{font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--mute)}.nav-right{display:flex;align-items:center;gap:25px;color:var(--body);font-size:14px}.nav-right>a:hover{color:var(--ink)}',
  '.button{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:8px 16px;border:1px solid transparent;border-radius:6px;font-size:14px;font-weight:700;line-height:1.5;transition:background .15s ease,border-color .15s ease}.button-primary{background:var(--primary);color:var(--ink)}.nav-right .button-primary{border-radius:999px}.button-primary:hover{background:var(--primary-pressed)}.button-primary:active{background:var(--primary-active);color:var(--surface)}.button-secondary{background:var(--soft);border-color:var(--hairline-soft);color:var(--ink)}.button-secondary:hover{background:var(--surface);border-color:var(--hairline)}.button-tertiary{background:transparent;color:var(--ink);padding:8px 12px}.button-tertiary:hover{background:var(--soft)}.button-wide{width:100%}.button:disabled{cursor:wait;opacity:.55}.utility{font-size:12px;font-weight:700;line-height:1.33;letter-spacing:.08em;text-transform:uppercase;color:var(--body)}.muted{color:var(--mute)}.pill{display:inline-flex;align-items:center;padding:3px 8px;border-radius:999px;font-size:12px;font-weight:600;line-height:1.33}.pill-green{background:var(--green-soft);color:var(--green)}.pill-blue{background:var(--blue-soft);color:var(--blue)}',
  '.eyebrow{font-size:12px;font-weight:700;line-height:1.33;letter-spacing:.08em;text-transform:uppercase;color:var(--body)}.landing-hero{display:grid;grid-template-columns:minmax(0,1.02fr) minmax(390px,.98fr);gap:80px;align-items:center;padding-top:80px;padding-bottom:80px}.landing-copy h1{max-width:700px;margin:20px 0 22px;font-size:clamp(48px,6vw,78px);font-weight:800;line-height:1.03;letter-spacing:-1.9px}.landing-copy h1 span{display:block;color:var(--body)}.landing-copy>p{max-width:590px;margin:0;color:var(--body);font-size:20px;line-height:1.5}.hero-actions{display:flex;align-items:center;gap:12px;margin-top:30px}.hero-caption{display:flex;align-items:center;gap:9px;margin-top:30px;color:var(--mute);font-size:13px}.caption-dot{width:9px;height:9px;border-radius:50%;background:var(--green);border:2px solid var(--green-soft)}',
  '.hero-board{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:end}.mascot-card,.manifest-card,.feature-card,.doc-card,.auth-card,.metric-card,.organization-card,.keys-panel,.quickstart-panel{border:1px solid var(--hairline);border-radius:6px;background:var(--surface)}.mascot-card{grid-column:1/-1;padding:23px 23px 0;display:grid;grid-template-columns:1fr 1fr;min-height:390px;overflow:hidden}.mascot-card-copy{padding:6px 0 25px}.mascot-card-copy h2{max-width:270px;margin:16px 0 10px;font-size:28px;line-height:1.2;letter-spacing:-.6px}.mascot-card-copy p{max-width:260px;margin:0;color:var(--body);font-size:15px}.mascot-card-image{display:flex;align-items:flex-end;justify-content:center}.mascot-card-image img{width:250px;max-height:365px;object-fit:contain;object-position:center bottom}.manifest-card{padding:18px;background:var(--doc)}.manifest-card .utility{margin-bottom:13px}.manifest-card pre{margin:0;background:var(--dark);border-radius:6px;padding:15px 16px;color:var(--surface);font:14px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap}.manifest-card pre .key{color:#b9e2d3}.manifest-card pre .value{color:var(--primary)}.return-note{border-left:4px solid var(--primary);padding:16px;background:var(--surface);color:var(--body);font-size:14px}.return-note strong{display:block;color:var(--ink);font-size:16px;margin-bottom:4px}',
  '.signal-strip{border-top:1px solid var(--hairline);border-bottom:1px solid var(--hairline);padding:20px 0}.signal-grid{display:grid;grid-template-columns:1fr 1px 1fr;gap:30px;align-items:center}.signal-grid>div{display:flex;flex-direction:column;gap:5px}.signal-grid strong{font-size:18px;font-weight:600;line-height:1.4}.signal-grid .divider{height:42px;background:var(--hairline)}.section{padding-top:80px;padding-bottom:80px}.section-heading{max-width:680px}.section-heading h2{margin:14px 0 12px;font-size:36px;font-weight:800;line-height:1.25;letter-spacing:-.8px}.section-heading p{margin:0;color:var(--body);font-size:17px}.feature-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:32px}.feature-card{min-height:290px;padding:24px;display:flex;flex-direction:column}.feature-card .mascot-mini{width:82px;height:82px;object-fit:contain;object-position:center top;margin:-10px 0 8px -8px}.feature-card .utility{margin-top:auto}.feature-card h3{margin:12px 0 6px;font-size:21px;font-weight:700;line-height:1.4}.feature-card p{max-width:280px;margin:0;color:var(--body);font-size:15px;line-height:1.6}.feature-card.feature-dark{background:var(--dark);border-color:var(--dark);color:var(--surface)}.feature-card.feature-dark p{color:var(--hairline-soft)}.feature-card.feature-dark .utility{color:var(--stone)}',
  '.manifest-section{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:48px;align-items:center;padding-top:10px}.manifest-section .doc-card{padding:24px;background:var(--doc)}.doc-card pre{margin:0;background:var(--dark);border-radius:6px;padding:20px;color:var(--surface);font:14px/1.7 ui-monospace,SFMono-Regular,Menlo,monospace;overflow:auto}.doc-card pre .muted-code{color:var(--ash)}.doc-card pre .blue-code{color:#91c5ef}.doc-card pre .green-code{color:#b9e2d3}.doc-card pre .orange-code{color:var(--primary)}.doc-card .code-footer{display:flex;align-items:center;justify-content:space-between;margin-top:14px;color:var(--mute);font-size:13px}.site-footer{border-top:1px solid var(--hairline);padding:32px 0}.footer-grid{display:grid;grid-template-columns:1.5fr repeat(4,1fr);gap:24px}.footer-brand-copy{max-width:200px;margin-top:12px;color:var(--body);font-size:14px}.footer-column{display:flex;flex-direction:column;gap:8px;color:var(--body);font-size:14px}.footer-column .utility{margin-bottom:4px}.footer-column a:hover{color:var(--teal)}.footer-bottom{display:flex;align-items:center;justify-content:space-between;margin-top:32px;padding-top:16px;border-top:1px solid var(--hairline-soft);color:var(--mute);font-size:12px}',
  '.auth-page{min-height:100vh}.auth-main{display:grid;grid-template-columns:minmax(0,1fr) minmax(360px,480px);gap:90px;align-items:center;min-height:calc(100vh - 56px);padding-top:70px;padding-bottom:70px}.auth-story h1{max-width:580px;margin:18px 0 16px;font-size:clamp(42px,5vw,66px);font-weight:800;line-height:1.05;letter-spacing:-1.5px}.auth-story>p{max-width:460px;margin:0;color:var(--body);font-size:18px}.auth-story-figure{display:flex;align-items:flex-end;gap:25px;margin-top:40px}.auth-story-figure img{width:205px;height:215px;object-fit:contain;object-position:center bottom}.auth-story-note{max-width:235px;padding:15px 0;border-top:1px solid var(--hairline);color:var(--body);font-size:14px}.auth-story-note strong{display:block;margin-bottom:6px;color:var(--ink);font-size:18px}.auth-card{padding:32px;background:var(--doc)}.auth-card-header h2{margin:12px 0 8px;font-size:24px;font-weight:800;line-height:1.33;letter-spacing:-.6px}.auth-card-header p{margin:0 0 28px;color:var(--body);font-size:15px}.auth-card form{display:flex;flex-direction:column;gap:17px}.auth-card label,.console-dialog label{display:flex;flex-direction:column;gap:6px;color:var(--body);font-size:13px;font-weight:600}.auth-card input,.console-dialog input{width:100%;height:36px;padding:8px 12px;border:1px solid var(--hairline);border-radius:6px;background:var(--surface);color:var(--ink);font-size:16px}.auth-card input:focus,.console-dialog input:focus{border-color:var(--blue);outline:2px solid var(--focus);outline-offset:0}.input-pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}.form-hint{margin:-5px 0 0;color:var(--mute);font-size:12px;line-height:1.5}.form-error{padding:12px 14px;border:1px solid var(--red);border-left:4px solid var(--red);border-radius:6px;background:var(--red-soft);color:var(--ink);font-size:13px}.auth-switch{margin-top:20px;color:var(--body);text-align:center;font-size:14px}.auth-switch a{color:var(--teal);text-decoration:underline;text-underline-offset:3px}.auth-footer{margin-top:18px;padding-top:16px;border-top:1px solid var(--hairline-soft);color:var(--mute);font-size:12px}',
  '.sub-nav{height:40px;background:var(--soft);border-bottom:1px solid var(--hairline-soft)}.sub-nav-inner{height:100%;display:flex;align-items:center;justify-content:space-between;color:var(--body);font-size:14px}.sub-nav-links{display:flex;gap:22px}.sub-nav a:hover{color:var(--ink)}.dashboard-layout{display:grid;grid-template-columns:240px minmax(0,1fr);max-width:1280px;margin:0 auto;min-height:calc(100vh - 96px)}.doc-sidebar{padding:32px 20px 32px 0;border-right:1px solid var(--hairline-soft)}.sidebar-title{padding:0 12px 12px;color:var(--mute);font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.side-link{display:block;padding:9px 12px;border:1px solid transparent;border-radius:6px;color:var(--body);font-size:14px}.side-link:hover{color:var(--ink);background:var(--soft)}.side-link.active{border-color:var(--hairline);background:var(--surface);color:var(--ink);font-weight:600}.sidebar-rule{height:1px;margin:24px 12px;background:var(--hairline-soft)}.sidebar-mascot{display:flex;align-items:flex-end;gap:8px;padding:12px}.sidebar-mascot img{width:64px;height:68px;object-fit:contain;object-position:center bottom}.sidebar-mascot p{margin:0;color:var(--mute);font-size:12px;line-height:1.4}.dashboard-main{min-width:0;padding:48px}.dashboard-header{display:flex;align-items:flex-start;justify-content:space-between;gap:30px}.dashboard-header h1{margin:13px 0 7px;font-size:36px;font-weight:800;line-height:1.25;letter-spacing:-.8px}.dashboard-header p{margin:0;color:var(--body);font-size:16px}.account-chip{display:flex;align-items:center;gap:9px;color:var(--body);font-size:13px}.avatar{width:32px;height:32px;display:grid;place-items:center;border:1px solid var(--hairline);border-radius:50%;background:var(--primary);color:var(--ink);font-weight:800}.metric-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:40px 0 56px}.metric-card{min-height:132px;padding:20px 22px}.metric-card-dark{background:var(--dark);border-color:var(--dark);color:var(--surface)}.metric-card .utility{color:var(--body)}.metric-card-dark .utility{color:var(--stone)}.metric-card strong{display:block;margin:9px 0 4px;font-size:30px;font-weight:800;line-height:1.1;letter-spacing:-.6px}.metric-card>span:last-child{color:var(--mute);font-size:13px}.metric-card-dark>span:last-child{color:var(--stone)}.metric-ready{color:var(--green)!important;font-size:24px!important}.dashboard-section{margin-bottom:56px}.section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px}.section-head h2{margin:11px 0 0;font-size:21px;font-weight:700;line-height:1.4;letter-spacing:-.5px}.organization-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin-top:20px}.organization-card{min-height:82px;display:flex;align-items:center;gap:12px;padding:15px;text-align:left}.organization-card:hover,.organization-card.selected{border-color:var(--primary-active);background:var(--surface)}.org-index{display:grid;place-items:center;width:34px;height:34px;border:1px solid var(--hairline);border-radius:6px;background:var(--soft);color:var(--body);font-size:12px;font-weight:700}.org-details{flex:1;min-width:0}.org-details strong,.org-details small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.org-details strong{font-size:14px}.org-details small{margin-top:4px;color:var(--mute);font:12px ui-monospace,SFMono-Regular,Menlo,monospace}.org-count{color:var(--mute);font-size:12px}.integration-grid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(280px,.9fr);gap:16px;margin-top:20px}.keys-panel,.quickstart-panel{padding:24px}.subpanel-header{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}.subpanel-header h3,.quickstart-panel h3{margin:10px 0 0;font-size:20px;font-weight:700;line-height:1.4}.subpanel-copy{max-width:540px;margin:13px 0 0;color:var(--body);font-size:14px}.key-list{margin-top:20px}.key-row{display:flex;align-items:center;gap:11px;padding:13px 0;border-top:1px solid var(--hairline-soft)}.key-dot{width:8px;height:8px;border-radius:50%;background:var(--stone)}.key-dot.active{background:var(--green)}.key-name{flex:1;min-width:0}.key-name strong,.key-name small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.key-name strong{font:600 13px ui-monospace,SFMono-Regular,Menlo,monospace}.key-name small{margin-top:4px;color:var(--mute);font:12px ui-monospace,SFMono-Regular,Menlo,monospace}.key-status{color:var(--green);font-size:12px;font-weight:700;text-transform:uppercase}.quickstart-panel{background:var(--dark);border-color:var(--dark);color:var(--surface)}.quickstart-panel .utility{color:var(--stone)}.quickstart-panel h3{color:var(--surface)}.quickstart-code{margin:22px 0;padding:16px;border:1px solid #4d4f46;border-radius:6px;background:#33342d;color:#f5f5ed;font:14px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;overflow:auto}.quickstart-foot{color:var(--stone);font-size:13px;line-height:1.5}.secret-reveal{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:16px;padding:14px;border:1px solid var(--green);border-radius:6px;background:var(--green-soft)}.secret-reveal strong,.secret-reveal small{display:block}.secret-reveal strong{margin-top:5px;color:var(--ink);font:600 12px ui-monospace,SFMono-Regular,Menlo,monospace;word-break:break-all}.secret-reveal small{color:var(--body);font-size:12px}.empty-card,.loading-card,.empty-row{padding:22px;border:1px dashed var(--hairline);border-radius:6px;background:var(--doc);color:var(--mute);font-size:14px}.empty-card,.loading-card{grid-column:1/-1}.console-dialog{width:min(430px,calc(100vw - 32px));padding:0;border:1px solid var(--hairline);border-radius:6px;background:var(--doc);color:var(--ink)}.console-dialog::backdrop{background:rgba(35,37,29,.35)}.console-dialog form{padding:28px}.console-dialog h2{margin:12px 0 8px;font-size:24px;line-height:1.33;letter-spacing:-.6px}.console-dialog p{margin:0 0 24px;color:var(--body);font-size:14px}.dialog-close{float:right;border:1px solid var(--hairline);border-radius:6px;background:var(--surface);color:var(--body);font-size:13px;padding:5px 9px}.console-dialog label{margin-bottom:18px}.toast{position:fixed;right:24px;bottom:24px;padding:11px 15px;border:1px solid var(--hairline);border-radius:6px;background:var(--ink);color:var(--surface);font-size:13px}',
  '@media(max-width:980px){.container{padding-left:32px;padding-right:32px}.landing-hero,.auth-main{grid-template-columns:1fr;gap:46px}.landing-copy{max-width:760px}.hero-board{max-width:680px}.auth-main{padding-top:50px;padding-bottom:50px}.auth-story-figure{margin-top:25px}.dashboard-layout{grid-template-columns:200px minmax(0,1fr)}.dashboard-main{padding:40px 32px}.integration-grid{grid-template-columns:1fr}.footer-grid{grid-template-columns:1.5fr repeat(2,1fr)}}',
  '@media(max-width:720px){.container{padding-left:20px;padding-right:20px}.primary-nav{height:auto;min-height:56px}.nav-inner{padding-top:10px;padding-bottom:10px}.nav-right{gap:12px}.nav-right>a:not(.button){display:none}.nav-right .button{padding-left:12px;padding-right:12px}.landing-hero{padding-top:52px;padding-bottom:52px}.landing-copy h1{font-size:48px;letter-spacing:-1px}.landing-copy>p{font-size:18px}.hero-actions{align-items:stretch;flex-direction:column}.hero-actions .button{width:100%}.hero-board{grid-template-columns:1fr}.mascot-card{grid-template-columns:1fr;min-height:0}.mascot-card-image{order:-1;justify-content:flex-end}.mascot-card-image img{width:190px;max-height:235px}.signal-grid{grid-template-columns:1fr;gap:17px}.signal-grid .divider{width:100%;height:1px}.section{padding-top:56px;padding-bottom:56px}.section-heading h2{font-size:31px}.feature-grid{grid-template-columns:1fr}.manifest-section{grid-template-columns:1fr;gap:28px}.footer-grid{grid-template-columns:1fr 1fr}.footer-bottom{align-items:flex-start;flex-direction:column;gap:8px}.auth-main{padding-top:40px}.auth-story h1{font-size:46px}.auth-story-figure{align-items:center}.auth-story-figure img{width:150px;height:165px}.input-pair{grid-template-columns:1fr}.dashboard-layout{display:block;min-height:0}.doc-sidebar{display:flex;align-items:center;gap:6px;overflow-x:auto;padding:12px 20px;border-right:0;border-bottom:1px solid var(--hairline-soft)}.sidebar-title,.sidebar-rule,.sidebar-mascot{display:none}.side-link{flex:none;white-space:nowrap}.dashboard-main{padding:32px 20px}.dashboard-header{display:block}.account-chip{margin-top:22px}.metric-grid{grid-template-columns:1fr 1fr;margin:32px 0 46px}.metric-card:last-child{grid-column:1/-1}.section-head{align-items:flex-start;flex-direction:column;gap:14px}.section-head .button{width:100%}.organization-list{grid-template-columns:1fr}.keys-panel,.quickstart-panel{padding:20px}.secret-reveal{align-items:flex-start;flex-direction:column}.sub-nav-links{gap:14px;overflow-x:auto;white-space:nowrap}.sub-nav-inner{overflow:hidden}}',
].join("") + CONSOLE_POLISH_STYLE + CONSOLE_EXTENSION_STYLE + ORGANIZATION_CHOOSER_STYLE + DASHBOARD_REFINEMENT_STYLE + ORGANIZATION_DASHBOARD_STYLE + ACCOUNT_DEVICE_STYLE + CONNECTOR_AUTH_STYLE;

export function renderLanding() {
  return pageShell(
    "Re-entry Cloud — return infrastructure for software",
    '<div class="page landing-page"><header class="primary-nav"><div class="container nav-inner"><a class="brand" href="/"><img class="brand-avatar" src="/assets/reentry-hedgehog-engineer.png" alt=""><span class="brand-name"><span>re-entry</span><small>cloud</small></span></a><nav class="nav-right"><a href="#platform">Platform</a><a href="#how-it-works">How it works</a><a href="/login">Log in</a><a class="button button-primary" href="/register">Get started — free</a></nav></div></header><main><section class="container landing-hero"><div class="landing-copy"><div class="eyebrow">RE-ENTRY CLOUD / RETURN INFRASTRUCTURE</div><h1>Bring unfinished work <span>back to where it belongs.</span></h1><p>Re-entry gives software a safe, visible route back when a task pauses, needs a human decision, or must continue on the page where it started.</p><div class="hero-actions"><a class="button button-primary" href="/register">Create a workspace</a><a class="button button-secondary" href="#how-it-works">See how it works</a></div><div class="hero-caption"><span class="caption-dot"></span><span>Application-neutral infrastructure for WebMCP-compatible hosts.</span></div></div><div class="hero-board" aria-label="Re-entry product overview"><article class="mascot-card"><div class="mascot-card-copy"><div class="utility">THE RETURN PATH</div><h2>Pause here. Continue there.</h2><p>A small control plane for the moments between a website, a person, and an agent.</p></div><div class="mascot-card-image"><img src="/assets/reentry-hedgehog-engineer.png" alt="Re-entry engineer hedgehog holding a notebook"></div></article><article class="manifest-card"><div class="utility">MANIFEST / HOST</div><pre>{\n  <span class="key">"workflow"</span>: <span class="value">"your-workflow"</span>,\n  <span class="key">"event"</span>: <span class="value">"ready_to_continue"</span>\n}</pre></article><div class="return-note"><strong>Made for the messy middle.</strong><span>Offers, consent, and return delivery stay explicit and scoped.</span></div></div></section><section class="signal-strip"><div class="container signal-grid"><div><span class="utility">THE IDEA</span><strong>A pause is not the end of the workflow.</strong></div><div class="divider"></div><div><span class="utility">THE JOB</span><strong>Make the return explicit, scoped, and observable.</strong></div></div></section><section class="container section" id="how-it-works"><div class="section-heading"><div class="eyebrow">THE RE-ENTRY LOOP</div><h2>Three blocks. One clear return.</h2><p>The Cloud Receiver keeps the handoff understandable: a Host offers work, a person approves the boundary, and a Connector brings the agent back.</p></div><div class="feature-grid" id="platform"><article class="feature-card"><img class="mascot-mini" src="/assets/reentry-hedgehog-engineer.png" alt="Re-entry engineer hedgehog"><div class="utility">01 / MANIFEST</div><h3>Offer the next step</h3><p>The Host describes the workflow and the exact event that may happen later.</p></article><article class="feature-card feature-dark"><img class="mascot-mini" src="/assets/reentry-hedgehog-engineer.png" alt="Re-entry engineer hedgehog"><div class="utility">02 / GRANT</div><h3>Keep a person in control</h3><p>The user sees the boundary and gives a narrow, human decision before work is resumed.</p></article><article class="feature-card"><img class="mascot-mini" src="/assets/reentry-hedgehog-engineer.png" alt="Re-entry engineer hedgehog"><div class="utility">03 / DELIVERY</div><h3>Return to the page</h3><p>The local Connector polls for approved work and hands it back to the right agent context.</p></article></div></section><section class="container section manifest-section"><div class="section-heading"><div class="eyebrow">BUILT FOR DEVELOPERS</div><h2>The control layer between a website and its next step.</h2><p>Keep business truth in the Host. Let Re-entry carry only the signed, bounded handoff that makes continuation possible.</p><a class="button button-tertiary" href="/register">Start with the local preview</a></div><article class="doc-card"><pre><span class="muted-code">{</span>\n  <span class="blue-code">"manifest"</span>: <span class="green-code">"what may continue"</span>,\n  <span class="blue-code">"grant"</span>: <span class="green-code">"what the user allowed"</span>,\n  <span class="blue-code">"delivery"</span>: <span class="green-code">"where the agent returns"</span>,\n  <span class="blue-code">"effect"</span>: <span class="orange-code">"verified by the Host"</span>\n<span class="muted-code">}</span></pre><div class="code-footer"><span class="pill pill-green">SCOPED BY DESIGN</span><span>Core protocol / v0.1</span></div></article></section></main><footer class="site-footer"><div class="container"><div class="footer-grid"><div><a class="brand" href="/"><img class="brand-avatar" src="/assets/reentry-hedgehog-engineer.png" alt=""><span class="brand-name"><span>re-entry</span><small>cloud</small></span></a><p class="footer-brand-copy">Give unfinished work a route home.</p></div><div class="footer-column"><span class="utility">PRODUCT</span><a href="#platform">Platform</a><a href="#how-it-works">How it works</a></div><div class="footer-column"><span class="utility">BUILD</span><a href="/register">Create workspace</a><a href="/login">Log in</a></div><div class="footer-column"><span class="utility">PROTOCOL</span><a href="#platform">Manifest</a><a href="#how-it-works">Connector</a></div><div class="footer-column"><span class="utility">STATUS</span><span>Local preview</span><span>v0.1</span></div></div><div class="footer-bottom"><span>Re-entry Cloud / local product preview</span><span>Application-neutral by design.</span></div></div></footer></div>',
  );
}


export function renderAuthPage(mode) {
  const register = mode === "register";
  const heading = register ? "Create your Re-entry workspace" : "Welcome back to the return path";
  const helper = register
    ? "Start with a lightweight local account. Add organizations and keys from the dashboard."
    : "Continue to your organizations, keys, and integration setup.";
  const formHint = register
    ? "Use an email and password for this local preview."
    : "Use the email and password you created.";
  return pageShell(
    (register ? "Create workspace" : "Log in") + " — Re-entry Cloud",
    '<div class="page auth-page"><header class="primary-nav"><div class="container nav-inner"><a class="brand" href="/"><img class="brand-avatar" src="/assets/reentry-hedgehog-engineer.png" alt=""><span class="brand-name"><span>re-entry</span><small>cloud</small></span></a><nav class="nav-right"><span class="muted">' + (register ? "Already building with Re-entry?" : "New to Re-entry?") + '</span><a class="button button-secondary" href="' + (register ? "/login" : "/register") + '">' + (register ? "Log in" : "Create workspace") + '</a></nav></div></header><main class="container auth-main"><section class="auth-story"><div class="eyebrow">' + (register ? "A NEW RETURN PATH" : "WELCOME BACK") + '</div><h1>' + (register ? "Make the next step feel close." : "Keep the work moving.") + '</h1><p>' + (register ? "Give your Host a calm, explicit way to pause and return when the browser needs help." : "Your organizations and Host connections are waiting where you left them.") + '</p><div class="auth-story-figure"><img src="/assets/reentry-hedgehog-engineer.png" alt="Re-entry engineer hedgehog holding a notebook"><div class="auth-story-note"><strong>' + (register ? "Small setup. Clear boundaries." : "The return path is still yours.") + '</strong><span>' + (register ? "One workspace gives you a place to explore the control plane." : "Re-entry keeps the next action visible before anything continues.") + '</span></div></div></section><section class="auth-card"><div class="auth-card-header"><div class="utility">' + (register ? "NEW WORKSPACE" : "YOUR WORKSPACE") + '</div><h2>' + heading + '</h2><p>' + helper + '</p></div><form id="auth-form" data-mode="' + mode + '"><label>Username or email<input name="identity" type="text" autocomplete="username" placeholder="you@example.com" required maxlength="160"></label>' + (register ? '<label>First organization<input name="organization_name" type="text" autocomplete="organization" placeholder="Acme Studio" required maxlength="120"></label>' : "") + '<div class="input-pair"><label>3-digit workspace code<input name="account_code" inputmode="numeric" pattern="[0-9]{3}" maxlength="3" placeholder="123" required></label><label>4-digit access PIN<input name="access_pin" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" placeholder="2468" required></label></div><p class="form-hint">' + formHint + ' Your credential is stored as a hash in this local preview.</p><div id="form-error" class="form-error" role="alert" hidden></div><button class="button button-primary button-wide" type="submit">' + (register ? "Create workspace" : "Log in") + '</button></form><div class="auth-switch">' + (register ? "Already have a workspace?" : "Need a workspace?") + ' <a href="' + (register ? "/login" : "/register") + '">' + (register ? "Log in" : "Create one") + '</a></div><div class="auth-footer">Local preview only. Production identity, recovery, and anti-abuse controls are not enabled.</div></section></main></div><script>' + AUTH_SCRIPT + '</script>',
  );
}

export function renderDashboard() {
  return pageShell(
    "Dashboard — Re-entry Cloud",
    '<div class="page dashboard-page"><header class="primary-nav"><div class="container nav-inner"><a class="brand" href="/"><img class="brand-avatar" src="/assets/reentry-hedgehog-engineer.png" alt=""><span class="brand-name"><span>re-entry</span><small>cloud</small></span></a><nav class="nav-right"><a href="/">Product</a><a href="#integration">Docs</a><button id="logout-button" class="button button-secondary" type="button">Log out</button></nav></div></header><div class="sub-nav"><div class="container sub-nav-inner"><div class="sub-nav-links"><a href="#overview">Control room</a><a href="#organizations">Organizations</a><a href="#integration">Integration</a></div><span class="pill pill-green">LOCAL PREVIEW</span></div></div><div class="dashboard-layout"><aside class="doc-sidebar"><div class="sidebar-title">Re-entry Cloud</div><a class="side-link active" href="#overview">Overview</a><a class="side-link" href="#organizations">Organizations</a><a class="side-link" href="#integration">Host connection</a><div class="sidebar-rule"></div><div class="sidebar-mascot"><img src="/assets/reentry-hedgehog-engineer.png" alt="Re-entry engineer hedgehog"><p>Make the return path visible.</p></div></aside><main class="dashboard-main" id="overview"><header class="dashboard-header"><div><div class="eyebrow">RE-ENTRY / CONTROL ROOM</div><h1>Your return paths.</h1><p>Manage the places where approved continuation can begin.</p></div><div class="account-chip"><span class="avatar">R</span><span id="account-identity">loading…</span></div></header><section class="metric-grid"><article class="metric-card metric-card-dark"><span class="utility">WORKSPACES</span><strong id="metric-orgs">—</strong><span>organizations under your account</span></article><article class="metric-card"><span class="utility">API KEYS</span><strong id="metric-keys">—</strong><span>active credentials for Hosts</span></article><article class="metric-card"><span class="utility">RECEIVER</span><strong class="metric-ready">READY</strong><span>local control plane online</span></article></section><section class="dashboard-section" id="organizations"><div class="section-head"><div><div class="eyebrow">01 / ORGANIZATIONS</div><h2>Choose a workspace</h2></div><button id="new-org-button" class="button button-primary" type="button">New organization</button></div><div id="organization-list" class="organization-list"><div class="loading-card">Loading your organizations…</div></div></section><section class="dashboard-section" id="integration"><div class="section-head"><div><div class="eyebrow">02 / CONNECT</div><h2 id="selected-org-title">Your Host connection</h2></div><span class="pill pill-blue">SERVER-SIDE ONLY</span></div><div class="integration-grid"><article class="keys-panel"><div class="subpanel-header"><div><div class="utility">ORGANIZATION API KEYS</div><h3>Give this to your Host backend.</h3></div><button id="new-key-button" class="button button-secondary" type="button">Create key</button></div><p class="subpanel-copy">Keys authenticate the Host backend to Re-entry Cloud. Keep them in environment variables; never put them in browser code.</p><div id="key-list" class="key-list"><div class="loading-row">Select an organization to view keys.</div></div><div id="new-secret" class="secret-reveal" hidden></div></article><article class="quickstart-panel"><div class="utility">QUICKSTART</div><h3>Connect your server in one step.</h3><pre id="quickstart-code" class="quickstart-code">REENTRY_ORGANIZATION_API_KEY=create a key\nREENTRY_RECEIVER_ORIGIN=http://127.0.0.1:43218</pre><div class="quickstart-foot">The browser renders the control surface. Keep credentials server-side.</div></article></div></section></main></div><dialog id="org-dialog" class="console-dialog"><form method="dialog" id="org-form"><button class="dialog-close" value="cancel" aria-label="Close" type="submit">Close</button><div class="utility">NEW ORGANIZATION</div><h2>Create another workspace.</h2><p>Organizations keep Host credentials and return paths separated.</p><label>Organization name<input name="name" type="text" placeholder="Northstar Labs" required maxlength="120"></label><div id="org-error" class="form-error" role="alert" hidden></div><button class="button button-primary button-wide" value="default" type="submit">Create organization</button></form></dialog><div id="toast" class="toast" role="status" hidden></div></div><script>' + DASHBOARD_SCRIPT + '</script>',
  );
}

function pageShell(title, body) {
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#fafafa"><title>' + title + '</title><style>' + STYLE + '</style></head><body>' + body + '</body></html>';
}

const AUTH_SCRIPT = "(function(){\nvar form=document.querySelector('#auth-form');var errorBox=document.querySelector('#form-error');\nvar requestedNext=new URLSearchParams(window.location.search).get('next');var safeNext=requestedNext&&requestedNext.startsWith('/')&&!requestedNext.startsWith('//')?requestedNext:'/dashboard/organizations';\nform.addEventListener('submit',async function(event){event.preventDefault();errorBox.hidden=true;var button=form.querySelector('button[type=submit]');button.disabled=true;var body=Object.fromEntries(new FormData(form).entries());var route=form.dataset.mode==='register'?'/api/auth/register':'/api/auth/login';\ntry{var response=await fetch(route,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});var result=await response.json().catch(function(){return {}});if(!response.ok)throw new Error(result.error&&result.error.code||'Unable to continue');window.location.assign(safeNext)}catch(error){errorBox.textContent=error.message.replaceAll('_',' ');errorBox.hidden=false;button.disabled=false}});})();";

const DASHBOARD_SCRIPT = String.raw`
(function () {
  var state = {
    organizations: [],
    connectors: [],
    selected: null,
    activity: null,
    activityBusy: false,
    activityTimer: null,
  };
  var $ = function (selector) {
    return document.querySelector(selector);
  };
  var api = async function (path, options) {
    options = options || {};
    var response = await fetch(path, Object.assign({}, options, {
      headers: Object.assign({ "content-type": "application/json" }, options.headers || {}),
    }));
    var result = await response.json().catch(function () {
      return {};
    });
    if (response.status === 401) {
      window.location.assign("/login");
      throw new Error("session required");
    }
    if (!response.ok) {
      throw new Error(result.error && result.error.code || "request failed");
    }
    return result;
  };
  var toast = function (message) {
    var node = $("#toast");
    if (!node) return;
    node.textContent = message;
    node.hidden = false;
    window.setTimeout(function () {
      node.hidden = true;
    }, 2800);
  };
  var openDrawer = function (id) {
    var drawer = $("#" + id);
    if (!drawer) return;
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    var backdrop = $("#" + id + "-backdrop");
    if (backdrop) backdrop.classList.add("is-open");
    var close = drawer.querySelector(".drawer-close");
    if (close) close.focus();
  };
  var closeDrawer = function (id) {
    var drawer = $("#" + id);
    if (!drawer) return;
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    var backdrop = $("#" + id + "-backdrop");
    if (backdrop) backdrop.classList.remove("is-open");
  };
  var closeAllDrawers = function () {
    closeDrawer("quick-connect-drawer");
    closeDrawer("secrets-drawer");
  };
  var make = function (tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  var formatTime = function (value) {
    if (typeof value !== "string") return "—";
    try {
      return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(value));
    } catch {
      return "—";
    }
  };
  var statusClass = function (status) {
    return {
      accepted: "accepted",
      acknowledged: "acknowledged",
      pending: "pending",
      leased: "leased",
      retry_exhausted: "retry-exhausted",
    }[status] || "neutral";
  };
  var statusLabel = function (status) {
    if (typeof status !== "string" || status.length === 0) return "not delivered";
    return status.replaceAll("_", " ");
  };
  var renderOrganizations = function () {
    var list = $("#organization-list");
    if (!list) return;
    var manager = Boolean($("#organization-manager"));
    list.textContent = "";
    if (!state.organizations.length) {
      list.appendChild(make("div", "empty-card", "No organizations yet. Create one to give a Host a return path."));
      return;
    }
    state.organizations.forEach(function (org, index) {
      var card = make(
        "article",
        "organization-card" + (
          state.selected && state.selected.organization_id === org.organization_id ? " selected" : ""
        ),
      );
      var open = make("button", "organization-open");
      open.type = "button";
      open.append(make("span", "org-index", String(index + 1).padStart(2, "0")));
      var details = make("span", "org-details");
      details.append(
        make("strong", "", org.name),
        make("small", "", org.organization_id),
      );
      open.append(
        details,
        make("span", "org-open", "Open workspace"),
      );
      open.addEventListener("click", function () {
        window.location.assign("/" + encodeURIComponent(org.organization_id) + "/dashboard");
      });
      card.appendChild(open);
      var meta = make("div", "org-actions");
      meta.append(make("span", "org-count", org.api_key_count + " active key" + (
        org.api_key_count === 1 ? "" : "s"
      )));
      if (manager) {
        var remove = make("button", "button button-tertiary org-delete", "Delete");
        remove.type = "button";
        remove.addEventListener("click", function () {
          deleteOrganization(org);
        });
        meta.appendChild(remove);
      }
      card.appendChild(meta);
      list.appendChild(card);
    });
  };
  var renderConnectors = function () {
    var list = $("#connector-list");
    var count = $("#connector-count");
    if (count) count.textContent = state.connectors.length + " CONNECTED";
    if (!list) return;
    list.textContent = "";
    if (!state.connectors.length) {
      list.appendChild(make("div", "connector-empty", "No Mac is connected yet. Run the install command once on the Mac where Codex should open."));
      return;
    }
    state.connectors.forEach(function (connector) {
      var row = make("article", "connector-device");
      var copy = make("div");
      copy.append(
        make("strong", "", connector.device_name),
        make("span", "", "Connected " + formatTime(connector.connected_at)),
      );
      row.append(copy, make("span", "connector-device-state", "CODEX READY"));
      list.appendChild(row);
    });
  };
  var renderKeys = function (keys) {
    var list = $("#key-list");
    if (list) {
      list.textContent = "";
      if (!keys.length) list.appendChild(make("div", "empty-row", "No keys yet."));
      keys.forEach(function (key) {
        var row = make("div", "key-row");
        row.append(make("span", "key-dot " + (key.status === "active" ? "active" : "")));
        var name = make("span", "key-name");
        name.append(
          make("strong", "", key.key_prefix + "…"),
          make("small", "", key.api_key_id),
        );
        row.append(name, make("span", "key-status", key.status));
        if (key.status === "active") {
          var revoke = make("button", "button button-tertiary", "Revoke");
          revoke.type = "button";
          revoke.addEventListener("click", async function () {
            try {
              await api(
                "/api/organizations/" + encodeURIComponent(state.selected.organization_id) +
                  "/api-keys/" + encodeURIComponent(key.api_key_id) + "/revoke",
                { method: "POST" },
              );
              toast("API key revoked");
              await refreshOrganizations();
              await selectOrganization(state.selected.organization_id);
            } catch (error) {
              if (error.message !== "session required") {
                toast(error.message.replaceAll("_", " "));
              }
            }
          });
          row.append(revoke);
        }
        list.appendChild(row);
      });
    }
    var drawerList = $("#drawer-key-list");
    if (drawerList) {
      drawerList.textContent = "";
      if (!keys.length) drawerList.appendChild(make("div", "drawer-empty-secret", "No keys yet. Create a new key to receive a one-time secret."));
      keys.forEach(function (key) {
        var row = make("div", "drawer-credential");
        row.append(
          make("code", "", key.key_prefix + "…"),
          make("span", "key-status", key.status),
        );
        drawerList.appendChild(row);
      });
    }
  };
  var detailFields = [
    ["event_id", "Event ID"],
    ["event_type", "Event type"],
    ["workflow_id", "Workflow ID"],
    ["workflow_type", "Workflow type"],
    ["received_at", "Received"],
    ["delivery_id", "Delivery ID"],
    ["delivery_status", "Delivery status"],
    ["attempt", "Current attempt"],
    ["maximum_attempts", "Maximum attempts"],
    ["leased_at", "Lease started"],
    ["lease_expires_at", "Lease expires"],
    ["acknowledged_at", "Acknowledged"],
    ["terminal_reason", "Terminal reason"],
    ["updated_at", "Last updated"],
  ];
  var activityId = function (item) {
    return String(item.event_id || "") + "|" + String(item.delivery_id || "");
  };
  var renderActivityDetail = function (kind, item) {
    var detail = $("#" + kind + "-detail");
    var empty = $("#" + kind + "-detail-empty");
    if (!detail || !empty) return;
    detail.hidden = false;
    empty.hidden = true;
    detail.textContent = "";
    detail.append(
      make("h3", "", kind === "pending" ? "Delivery " + (item.delivery_id || "not created") : item.event_type || "Event"),
      make("p", "detail-copy", kind === "pending"
        ? "This is the redacted delivery record associated with the selected event."
        : "This is the redacted lifecycle record. The event body and private context stay outside the console."),
    );
    var grid = make("dl", "detail-grid");
    detailFields.forEach(function (field) {
      var value = item[field[0]];
      var text = value === null || value === undefined || value === "" ? "—" : String(value);
      if (field[0].endsWith("_at") && text !== "—") text = formatTime(text);
      var wrapper = make("div", "detail-field");
      wrapper.append(make("dt", "", field[1]), make("dd", "", text));
      grid.appendChild(wrapper);
    });
    detail.append(
      grid,
      make("div", "detail-notice", "Payload, subjects, bindings, receipts, and connector tokens are intentionally not shown here."),
    );
  };
  var selectActivityDetail = function (kind, item) {
    if (kind === "pending") state.selectedPendingId = activityId(item);
    else state.selectedEventId = activityId(item);
    renderActivityDetail(kind, item);
  };
  var renderActivityRows = function (selector, items, emptyMessage, pending, interactive) {
    var list = $(selector);
    if (!list) return;
    list.textContent = "";
    if (!items.length) {
      list.appendChild(make("div", "activity-empty", emptyMessage));
      return;
    }
    items.forEach(function (item) {
      var row = make("article", "activity-row" + (interactive ? " activity-row-button" : ""));
      if (interactive) {
        row.setAttribute("role", "button");
        row.tabIndex = 0;
        row.addEventListener("click", function () {
          selectActivityDetail(pending ? "pending" : "event", item);
        });
        row.addEventListener("keydown", function (event) {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectActivityDetail(pending ? "pending" : "event", item);
          }
        });
      }
      var top = make("div", "activity-row-top");
      top.append(
        make("span", "activity-event", item.event_type || "unknown event"),
        make(
          "span",
          "activity-status " + statusClass(item.delivery_status),
          statusLabel(item.delivery_status),
        ),
      );
      var bottom = make("div", "activity-row-bottom");
      bottom.append(
        make("span", "", item.workflow_id || "unknown workflow"),
        make("time", "", formatTime(item.received_at || item.updated_at)),
      );
      row.append(top, bottom);
      if (pending) {
        var attempt = Number(item.attempt) || 0;
        var maximum = Number(item.maximum_attempts) || 0;
        var attemptText = maximum
          ? "Attempt " + attempt + "/" + maximum
          : "Waiting for claim";
        row.append(make("div", "activity-row-bottom", attemptText));
      }
      list.appendChild(row);
    });
    if (interactive) {
      var selectedId = pending ? state.selectedPendingId : state.selectedEventId;
      var selected = items.find(function (item) {
        return activityId(item) === selectedId;
      }) || items[0];
      if (selected) selectActivityDetail(pending ? "pending" : "event", selected);
    }
  };
  var renderActivity = function (payload) {
    payload = payload && typeof payload === "object" ? payload : {};
    state.activity = payload;
    var counts = payload.counts && typeof payload.counts === "object" ? payload.counts : {};
    var eventCount = Number(counts.events);
    var pendingCount = Number(counts.pending_work);
    if ($("#metric-events")) {
      $("#metric-events").textContent = Number.isFinite(eventCount) ? String(eventCount) : "0";
    }
    if ($("#metric-pending")) {
      $("#metric-pending").textContent = Number.isFinite(pendingCount) ? String(pendingCount) : "0";
    }
    if ($("#event-count")) {
      $("#event-count").textContent = Number.isFinite(eventCount) ? String(eventCount) : "0";
    }
    if ($("#pending-count")) {
      $("#pending-count").textContent = Number.isFinite(pendingCount) ? String(pendingCount) : "0";
    }
    if ($("#summary-event-count")) {
      $("#summary-event-count").textContent = Number.isFinite(eventCount) ? String(eventCount) : "0";
    }
    if ($("#summary-pending-count")) {
      $("#summary-pending-count").textContent = Number.isFinite(pendingCount) ? String(pendingCount) : "0";
    }
    if ($("#nav-pending-count")) {
      $("#nav-pending-count").textContent = Number.isFinite(pendingCount) ? String(pendingCount) : "0";
      $("#nav-pending-count").hidden = !pendingCount;
    }
    var updated = $("#activity-updated");
    if (updated) {
      updated.textContent = payload.available
        ? "Updated " + formatTime(payload.generated_at)
        : "Receiver activity unavailable";
    }
    var available = payload.available !== false;
    renderActivityRows(
      "#event-list",
      Array.isArray(payload.events) ? payload.events : [],
      available
        ? "No events have reached this Receiver yet."
        : "Receiver activity is not connected in this preview.",
      false,
      true,
    );
    renderActivityRows(
      "#overview-event-list",
      Array.isArray(payload.events) ? payload.events.slice(0, 3) : [],
      available
        ? "No events have reached this Receiver yet."
        : "Receiver activity is not connected in this preview.",
      false,
      false,
    );
    renderActivityRows(
      "#pending-list",
      Array.isArray(payload.pending_work) ? payload.pending_work : [],
      available
        ? "No pending work. The Connector is caught up."
        : "Receiver activity is not connected in this preview.",
      true,
      true,
    );
    renderActivityRows(
      "#overview-pending-list",
      Array.isArray(payload.pending_work) ? payload.pending_work.slice(0, 3) : [],
      available
        ? "No pending work. The Connector is caught up."
        : "Receiver activity is not connected in this preview.",
      true,
      false,
    );
  };
  var unavailableActivity = function () {
    return {
      available: false,
      counts: { events: 0, pending_work: 0 },
      events: [],
      pending_work: [],
    };
  };
  var refreshActivity = async function (notify) {
    if (state.activityBusy) return;
    state.activityBusy = true;
    try {
      renderActivity(await api("/api/activity"));
    } catch (error) {
      if (error.message === "session required") return;
      renderActivity(unavailableActivity());
      if (notify) toast("Activity could not be refreshed");
    } finally {
      state.activityBusy = false;
    }
  };
  var refreshOrganizations = async function () {
    var result = await api("/api/organizations");
    state.organizations = result.organizations;
    if ($("#metric-orgs")) $("#metric-orgs").textContent = state.organizations.length;
    if ($("#metric-keys")) $("#metric-keys").textContent = state.organizations.reduce(function (sum, org) {
      return sum + Number(org.api_key_count || 0);
    }, 0);
    renderOrganizations();
  };
  var refreshConnectors = async function () {
    var result = await api("/v0.1/account/connectors");
    state.connectors = Array.isArray(result.connectors) ? result.connectors : [];
    renderConnectors();
  };
  var selectOrganization = async function (organizationId) {
    state.selected = state.organizations.find(function (org) {
      return org.organization_id === organizationId;
    }) || null;
    renderOrganizations();
    if (!state.selected) return;
    if ($("#selected-org-title")) $("#selected-org-title").textContent = state.selected.name + " connection";
    if ($("#workspace-name")) $("#workspace-name").textContent = state.selected.name;
    if ($("#workspace-id")) $("#workspace-id").textContent = state.selected.organization_id;
    var result = await api(
      "/api/organizations/" + encodeURIComponent(organizationId) + "/api-keys",
    );
    renderKeys(result.api_keys);
  };
  var deleteOrganization = async function (organization) {
    if (!organization || !window.confirm("Delete " + organization.name + " and all of its API keys?")) return;
    try {
      await api("/api/organizations/" + encodeURIComponent(organization.organization_id), {
        method: "DELETE",
      });
      toast("Organization deleted");
      if (state.selected && state.selected.organization_id === organization.organization_id) {
        state.selected = null;
      }
      if (document.querySelector("[data-organization-id]")) {
        window.location.assign("/dashboard/organizations");
        return;
      }
      await refreshOrganizations();
    } catch (error) {
      if (error.message !== "session required") toast(error.message.replaceAll("_", " "));
    }
  };
  var showSecret = function (secret) {
    var box = $("#new-secret");
    var drawerContent = $("#secret-drawer-content");
    if (drawerContent) {
      drawerContent.textContent = "";
      var card = make("div", "drawer-secret-card");
      card.append(
        make("strong", "", "New organization key"),
        make("code", "", secret),
        make("p", "", "Copy this now. Re-entry will not show the full secret again."),
      );
      var copy = make("button", "button button-secondary", "Copy key");
      copy.type = "button";
      copy.addEventListener("click", async function () {
        if (navigator.clipboard) await navigator.clipboard.writeText(secret);
        toast("API key copied");
      });
      card.appendChild(copy);
      drawerContent.appendChild(card);
      openDrawer("secrets-drawer");
      return;
    }
    if (!box) return;
    box.hidden = false;
    box.textContent = "";
    var copy = make("button", "button button-secondary", "Copy key");
    var content = make("div");
    content.append(
      make("span", "utility", "COPY THIS ONCE"),
      make("strong", "", secret),
      make("small", "", "It will not be shown again."),
    );
    box.append(content, copy);
    copy.addEventListener("click", async function () {
      if (navigator.clipboard) await navigator.clipboard.writeText(secret);
      toast("API key copied");
    });
  };
  var setQuickstartTab = function (selected) {
    document.querySelectorAll("[data-quickstart-tab]").forEach(function (tab) {
      var active = tab.getAttribute("data-quickstart-tab") === selected;
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
    document.querySelectorAll("[data-quickstart-panel]").forEach(function (panel) {
      panel.hidden = panel.getAttribute("data-quickstart-panel") !== selected;
    });
  };
  var load = async function () {
    try {
      var session = await api("/api/session");
      var accountIdentity = $("#account-identity");
      if (accountIdentity) accountIdentity.textContent = session.account.identity;
      await refreshOrganizations();
      await refreshConnectors();
      document.querySelectorAll("[data-receiver-command]").forEach(function (node) {
        node.textContent = "npm install --global /path/to/OpenAI-Web-MCP-Challenge/runtime/local-connector &&\\\n  reentry install --receiver " + window.location.origin + " --codex-cd /absolute/path/to/project";
      });
      if ($("#organization-chooser")) return;
      var workspace = $("[data-organization-id]");
      var requestedOrganizationId = workspace && workspace.getAttribute("data-organization-id");
      if (requestedOrganizationId) {
        if (!state.organizations.some(function (org) {
          return org.organization_id === requestedOrganizationId;
        })) {
          window.location.assign("/dashboard/organizations");
          return;
        }
        await selectOrganization(requestedOrganizationId);
      } else if ($("#key-list") && state.organizations[0]) {
        await selectOrganization(state.organizations[0].organization_id);
      }
      await refreshActivity(false);
      if (!state.activityTimer) {
        state.activityTimer = window.setInterval(function () {
          refreshActivity(false);
        }, 5000);
      }
      var pending = sessionStorage.getItem("reentry_pending_api_key");
      if (pending) {
        showSecret(pending);
        sessionStorage.removeItem("reentry_pending_api_key");
      }
    } catch (error) {
      if (error.message !== "session required") {
        toast(error.message.replaceAll("_", " "));
      }
    }
  };
  var quickConnectButton = $("#quick-connect-button");
  if (quickConnectButton) {
    quickConnectButton.addEventListener("click", function () {
      if ($("#quick-connect-drawer")) {
        openDrawer("quick-connect-drawer");
        return;
      }
      var section = $("#quick-connect");
      if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
      var tab = $("#nextjs-tab");
      if (tab) tab.focus();
    });
  }
  var secretsButton = $("#secrets-button");
  if (secretsButton) secretsButton.addEventListener("click", function () {
    openDrawer("secrets-drawer");
  });
  document.querySelectorAll("[data-drawer-close]").forEach(function (button) {
    button.addEventListener("click", function () {
      closeDrawer(button.getAttribute("data-drawer-close"));
    });
  });
  document.querySelectorAll("[data-copy-target]").forEach(function (button) {
    button.addEventListener("click", async function () {
      var target = document.getElementById(button.getAttribute("data-copy-target"));
      if (!target) return;
      if (navigator.clipboard) await navigator.clipboard.writeText(target.textContent);
      var original = button.textContent;
      button.textContent = "Copied";
      window.setTimeout(function () { button.textContent = original; }, 1500);
      toast("Copied to clipboard");
    });
  });
  document.querySelectorAll("[data-drawer-tab]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      var selected = tab.getAttribute("data-drawer-tab");
      document.querySelectorAll("[data-drawer-tab]").forEach(function (item) {
        item.setAttribute("aria-selected", item === tab ? "true" : "false");
      });
      document.querySelectorAll("[data-drawer-panel]").forEach(function (panel) {
        panel.hidden = panel.getAttribute("data-drawer-panel") !== selected;
      });
    });
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeAllDrawers();
  });
  document.querySelectorAll("[data-quickstart-tab]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      setQuickstartTab(tab.getAttribute("data-quickstart-tab"));
    });
  });
  var refreshButton = $("#refresh-activity");
  if (refreshButton) {
    refreshButton.addEventListener("click", function () {
      refreshActivity(true);
    });
  }
  var newOrgButton = $("#new-org-button");
  if (newOrgButton) newOrgButton.addEventListener("click", function () {
    $("#org-dialog").showModal();
  });
  var orgForm = $("#org-form");
  if (orgForm) orgForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (event.submitter && event.submitter.value === "cancel") {
      event.target.closest("dialog").close();
      return;
    }
    var error = $("#org-error");
    error.hidden = true;
    try {
      var result = await api("/api/organizations", {
        method: "POST",
        body: JSON.stringify({ name: new FormData(event.target).get("name") }),
      });
      $("#org-dialog").close();
      if ($("#organization-chooser")) {
        sessionStorage.setItem("reentry_pending_api_key", result.api_key.secret);
        window.location.assign("/" + encodeURIComponent(result.organization.organization_id) + "/dashboard");
        return;
      }
      showSecret(result.api_key.secret);
      await refreshOrganizations();
      await selectOrganization(result.organization.organization_id);
      toast("Organization created");
    } catch (caught) {
      if (caught.message !== "session required") {
        error.textContent = caught.message.replaceAll("_", " ");
        error.hidden = false;
      }
    }
  });
  var deleteOrgButton = $("#delete-org-button");
  if (deleteOrgButton) deleteOrgButton.addEventListener("click", function () {
    deleteOrganization(state.selected);
  });
  document.querySelectorAll("#new-key-button, #drawer-new-key-button").forEach(function (newKeyButton) {
    newKeyButton.addEventListener("click", async function () {
    if (!state.selected) return;
    try {
      var result = await api(
        "/api/organizations/" + encodeURIComponent(state.selected.organization_id) + "/api-keys",
        { method: "POST" },
      );
      showSecret(result.api_key.secret);
      await refreshOrganizations();
      await selectOrganization(state.selected.organization_id);
      toast("New API key created");
    } catch (error) {
      if (error.message !== "session required") {
        toast(error.message.replaceAll("_", " "));
      }
    }
    });
  });
  var logoutButton = $("#logout-button");
  if (logoutButton) logoutButton.addEventListener("click", async function () {
    await api("/api/auth/logout", { method: "POST" });
    window.location.assign("/");
  });
  setQuickstartTab("nextjs");
  load();
})();
`;
export function renderAuthPageSimple(mode) {
  const register = mode === "register";
  const heading = register ? "Create your workspace" : "Welcome back";
  const helper = register
    ? "One account for your organizations and Host keys."
    : "Sign in to manage your organizations and Host keys.";
  const formHint = register
    ? "Use an email you can recognize and a password with at least 8 characters."
    : "Use the email and password you created.";
  return pageShell(
    (register ? "Create workspace" : "Log in") + " — Re-entry Cloud",
    `<div class="page auth-page">
  <header class="primary-nav">
    <div class="container nav-inner">
      <a class="brand" href="/" aria-label="Re-entry Cloud home"><span class="brand-word">re-entry</span></a>
      <nav class="nav-right">
        <span class="muted">${register ? "Already have an account?" : "New to Re-entry?"}</span>
        <a class="button button-secondary" href="${register ? "/login" : "/register"}">${register ? "Log in" : "Create workspace"}</a>
      </nav>
    </div>
  </header>
  <main class="container auth-main">
    <section class="auth-story">
      <div class="eyebrow">${register ? "A NEW RETURN PATH" : "WELCOME BACK"}</div>
      <h1>${register ? "Make the next step feel close." : "Return to your workspace."}</h1>
      <p>${register ? "Give your Host a clear place to pause, ask, and return." : "Your organizations and Host connections are ready."}</p>
      <div class="auth-story-note"><strong>${register ? "Small setup. Clear boundaries." : "One place for every Host."}</strong><span>${register ? "Create a workspace, then add the organizations your products need." : "Keep each organization’s credentials separate and easy to find."}</span></div>
    </section>
    <section class="auth-card">
      <div class="auth-card-header"><div class="utility">${register ? "NEW WORKSPACE" : "YOUR WORKSPACE"}</div><h2>${heading}</h2><p>${helper}</p></div>
      <form id="auth-form" data-mode="${mode}">
        <label>Email<input name="identity" type="email" autocomplete="email" placeholder="you@example.com" required maxlength="160"></label>
        <label>Password<input name="password" type="password" autocomplete="${register ? "new-password" : "current-password"}" minlength="8" maxlength="256" placeholder="At least 8 characters" required></label>
        <p class="form-hint">${formHint} Credentials are stored as a hash in this local preview.</p>
        <div id="form-error" class="form-error" role="alert" hidden></div>
        <button class="button button-primary button-wide" type="submit">${register ? "Create workspace" : "Log in"}</button>
      </form>
      <div class="auth-switch">${register ? "Already have a workspace?" : "Need a workspace?"} <a href="${register ? "/login" : "/register"}">${register ? "Log in" : "Create one"}</a></div>
      <div class="auth-footer">Local preview only. Production identity controls are not enabled.</div>
    </section>
  </main>
</div><script>${AUTH_SCRIPT}</script>`,
  );
}

export function renderConnectorAuthPage(mode, { next } = {}) {
  const register = mode === "register";
  const safeNext = isConnectorReturnPath(next) ? next : "/";
  const encodedNext = encodeURIComponent(safeNext);
  const alternatePath = register
    ? `/login?flow=connector&next=${encodedNext}`
    : `/register?flow=connector&next=${encodedNext}`;
  const title = register ? "Create an account to connect this Mac" : "Log in to connect this Mac";
  const heading = register ? "Create your account. Then connect this Mac." : "Welcome back. Then connect this Mac.";
  const helper = register
    ? "Create your Re-entry account to keep this Mac connected to the return path."
    : "Sign in to continue the pending connection for this Mac.";
  const formHint = register
    ? "Use an email you can recognize and a password with at least 8 characters."
    : "Use the email and password you created for Re-entry.";
  return pageShell(
    title,
    `<div class="connector-auth-page">
  <header class="connector-auth-nav">
    <a class="connector-auth-brand" href="/" aria-label="Re-entry Cloud home">re-entry</a>
    <span class="connector-auth-nav-status">CONNECTOR SETUP / 01 OF 03</span>
  </header>
  <main class="connector-auth-main">
    <section class="connector-auth-story" aria-labelledby="connector-auth-title">
      <div class="connector-auth-kicker">A one-time connection</div>
      <h1 id="connector-auth-title">${heading}</h1>
      <p>Re-entry links your browser account to the Local Connector on your Mac. Once connected, approved work can return to Codex without another setup step.</p>
      <div class="connector-auth-steps" aria-label="Connector setup progress">
        <div class="connector-auth-step is-active"><span>01</span><div><strong>Account</strong><small>Sign in or create one</small></div></div>
        <div class="connector-auth-step"><span>02</span><div><strong>Approve Mac</strong><small>Confirm the device</small></div></div>
        <div class="connector-auth-step"><span>03</span><div><strong>Ready</strong><small>Connector stays running</small></div></div>
      </div>
      <div class="connector-auth-note"><span aria-hidden="true"></span><p><strong>Clear boundary.</strong> Your Re-entry session stays in this browser. The Connector receives its device credential only after you approve this Mac.</p></div>
    </section>
    <section class="connector-auth-card" aria-labelledby="connector-auth-form-title">
      <a class="connector-auth-back" href="${escapeHtml(safeNext)}">← Back to device approval</a>
      <div class="connector-auth-card-kicker">RE-ENTRY ACCOUNT</div>
      <h2 id="connector-auth-form-title">${register ? "Create an account" : "Log in"}</h2>
      <p class="connector-auth-card-intro">${helper}</p>
      <form id="auth-form" class="connector-auth-form" data-mode="${mode}">
        <label>Email<input name="identity" type="email" autocomplete="${register ? "email" : "username"}" placeholder="you@example.com" required maxlength="160"></label>
        <label>Password<input name="password" type="password" autocomplete="${register ? "new-password" : "current-password"}" minlength="8" maxlength="256" placeholder="At least 8 characters" required></label>
        <p class="form-hint">${formHint}</p>
        <div id="form-error" class="form-error" role="alert" hidden></div>
        <button class="button button-primary button-wide" type="submit">${register ? "Create account and continue" : "Log in and continue"}</button>
      </form>
      <p class="connector-auth-switch">${register ? "Already have an account?" : "New to Re-entry?"} <a href="${escapeHtml(alternatePath)}">${register ? "Log in" : "Create an account"}</a></p>
      <p class="connector-auth-footnote">After you continue, Re-entry will show the final <strong>Connect this Mac</strong> approval. Nothing is connected by signing in alone.</p>
    </section>
  </main>
  <footer class="connector-auth-footer-bar">Re-entry Cloud / account-linked Local Connector / local preview</footer>
</div><script>${AUTH_SCRIPT}</script>`,
  );
}

export function renderDeveloperDocsPage() {
  const body = `
<div class="page docs-page">
  <header class="primary-nav console-nav">
    <div class="container nav-inner">
      <a class="brand" href="/" aria-label="Re-entry Cloud home"><span class="brand-word">re-entry</span></a>
      <nav class="nav-right" aria-label="Developer documentation navigation">
        <a href="/">Product</a><a href="/login">Log in</a><a class="button button-primary" href="/register">Start free</a>
      </nav>
    </div>
  </header>
  <div class="docs-layout">
    <aside class="docs-aside">
      <div class="eyebrow">SDK / V0.1</div><h2>Developer docs</h2>
      <nav aria-label="Documentation sections"><a href="#overview">Overview</a><a href="#install">Install</a><a href="#server-setup">Server setup</a><a href="#flow">Request flow</a><a href="#reference">Reference</a><a href="#security">Security</a></nav>
      <div class="docs-aside-note">Re-entry is the return path between your Host website, a person, and a local agent Connector.</div>
    </aside>
    <main class="docs-main">
      <section id="overview" class="docs-hero">
        <div class="eyebrow">DEVELOPER DOCUMENTATION / HOST SDK</div>
        <h1>Connect your website to a safe return path.</h1>
        <p>Re-entry lets a website pause work, ask a person for permission on Re-entry, and continue later through an account-linked Local Connector. Your Host remains the source of business truth; Re-entry stores only the bounded handoff.</p>
        <div class="docs-callout"><strong>Start here:</strong> connect the user’s Mac once, create an organization key, then add the SDK to the Host server. Later consent uses the person’s existing Re-entry browser session.</div>
      </section>
      <section id="install" class="docs-section">
        <div class="eyebrow">01 / INSTALL</div><h2>Connect both ends once.</h2>
        <p>The Local Connector belongs to the person’s account. The Host SDK belongs to one organization and stays on the Host server.</p>
        <div class="docs-card-grid"><article class="docs-card"><span class="docs-card-number">01</span><h3>Connect the Mac</h3><p>Run the installer where Codex is available. It opens Re-entry, links the signed-in account, and starts at login.</p><pre class="docs-code">npm install --global /path/to/runtime/local-connector\nreentry install --receiver https://your-reentry.example --codex-cd /path/to/project</pre></article><article class="docs-card"><span class="docs-card-number">02</span><h3>Create the Host key</h3><p>Create an organization, reveal its API key once, and keep that value in the Host server environment.</p></article><article class="docs-card"><span class="docs-card-number">03</span><h3>Install the SDK</h3><p>This preview uses the local package; the SDK is not published to npm yet.</p><pre class="docs-code">npm install /path/to/OpenAI-Web-MCP-Challenge/runtime/host-sdk</pre></article></div>
      </section>
      <section id="server-setup" class="docs-section">
        <div class="eyebrow">02 / SERVER SETUP</div><h2>Configure the server boundary.</h2>
        <p>The SDK owns signing and Re-entry calls. Put every value below in the Host server environment, never in browser code.</p>
        <div class="docs-variable-grid"><div class="docs-variable"><code>HOST_ORIGIN</code><strong>Your website origin</strong><span>The origin Re-entry binds to the signed request.</span></div><div class="docs-variable"><code>RECEIVER_ORIGIN</code><strong>Your Re-entry URL</strong><span>The cloud Receiver endpoint used by the SDK.</span></div><div class="docs-variable"><code>REENTRY_KEY_ID</code><strong>Host signing key id</strong><span>The public key identifier registered with Re-entry.</span></div><div class="docs-variable"><code>REENTRY_PRIVATE_KEY</code><strong>Host signing secret</strong><span>Used only by the Host server to sign Manifests and Events.</span></div><div class="docs-variable"><code>REENTRY_ORGANIZATION_API_KEY</code><strong>Organization credential</strong><span>Authorizes Host control requests for this organization.</span></div></div>
        <pre class="docs-code">HOST_ORIGIN=https://your-app.example
RECEIVER_ORIGIN=https://your-reentry.example
REENTRY_KEY_ID=host_key_your_app
REENTRY_PRIVATE_KEY=your_host_private_key
REENTRY_ORGANIZATION_API_KEY=re_org_...</pre>
        <pre class="docs-code">import { createHostSdk } from "@webmcp-challenge/host-sdk/server";

const reentry = createHostSdk({
  origin: process.env.HOST_ORIGIN,
  receiverOrigin: process.env.RECEIVER_ORIGIN,
  privateKey: process.env.REENTRY_PRIVATE_KEY,
  keyId: process.env.REENTRY_KEY_ID,
  organizationApiKey: process.env.REENTRY_ORGANIZATION_API_KEY,
});</pre>
      </section>
      <section id="flow" class="docs-section">
        <div class="eyebrow">03 / REQUEST FLOW</div><h2>Follow the return path.</h2>
        <p>There are two separate moments: first ask for consent, then send the approved continuation event.</p>
        <div class="docs-card-grid"><article class="docs-card"><span class="docs-card-number">01</span><h3>Browser triggers Host</h3><p>A button, user, or WebMCP tool calls a Host-owned server route.</p></article><article class="docs-card"><span class="docs-card-number">02</span><h3>Host signs the offer</h3><p>The server loads its authenticated user and current workflow, then creates a signed Manifest.</p></article><article class="docs-card"><span class="docs-card-number">03</span><h3>SDK opens Re-entry</h3><p>The Host sends the Manifest server-to-server. The SDK receives an opaque consent URL and opens it from the browser click.</p></article><article class="docs-card"><span class="docs-card-number">04</span><h3>Account user decides</h3><p>Re-entry uses its own signed-in account, shows the exact scope, and lets the person choose a connected Mac.</p></article><article class="docs-card"><span class="docs-card-number">05</span><h3>Host receives a binding</h3><p>Approval creates one scoped Grant. The Host receives only an opaque binding, never the Re-entry account or Connector credential.</p></article><article class="docs-card"><span class="docs-card-number">06</span><h3>Event returns to Codex</h3><p>The Host sends the signed Event. The background Connector claims it and starts one fresh local Codex session.</p></article></div>
        <div class="docs-callout"><strong>Important:</strong> opening the Re-entry page is not approval. Only the authenticated action on that page creates the Grant and binding.</div>
      </section>
      <section id="reference" class="docs-section">
        <div class="eyebrow">04 / API REFERENCE</div><h2>Use the smallest server API.</h2>
        <div class="docs-methods"><div class="docs-method"><code>registerHostKey({ hostId })</code><div><strong>Register the Host</strong><span>Send only the public key. Re-entry uses it to verify later Manifest and Event signatures.</span></div></div><div class="docs-method"><code>createManifest(input)</code><div><strong>Create a signed offer</strong><span>Returns a signed Manifest locally; it does not send or approve anything.</span></div></div><div class="docs-method"><code>createConsentSession(input)</code><div><strong>Start consent</strong><span>Sends the Manifest to Re-entry and returns the opaque Re-entry consent URL.</span></div></div><div class="docs-method"><code>getConsentSession(input)</code><div><strong>Read the decision</strong><span>Returns pending, approved, or declined. Approval includes the opaque binding required to send the Event.</span></div></div><div class="docs-method"><code>sendEvent(input)</code><div><strong>Send approved continuation</strong><span>Signs an Event and sends it with the approved binding. The Host still owns the final business effect.</span></div></div></div>
      </section>
      <section id="security" class="docs-section">
        <div class="eyebrow">05 / SECURITY BOUNDARY</div><h2>Keep each responsibility in one place.</h2>
        <div class="docs-methods"><div class="docs-method"><code>Host server</code><div><strong>Business truth and Host secrets</strong><span>Loads its user, workflow state, private signing key, and organization API key.</span></div></div><div class="docs-method"><code>Host browser</code><div><strong>Trigger and handoff</strong><span>Calls the Host route and opens the exact Re-entry consent URL from a user gesture.</span></div></div><div class="docs-method"><code>Re-entry account</code><div><strong>Consent and routing</strong><span>Authenticates the person, records the decision, and maps approval to one account-linked Connector.</span></div></div><div class="docs-method"><code>Local Connector</code><div><strong>Outbound polling and Codex</strong><span>Uses only its local device credential to claim approved work and open Codex.</span></div></div></div>
        <div class="docs-callout"><strong>Do not mix credentials:</strong> organization keys stay on the Host server; browser session cookies stay on Re-entry; Connector tokens stay on the Mac.</div>
      </section>
      <div class="docs-footer"><span>Re-entry Host SDK / local preview</span><a class="workspace-back" href="/dashboard/quick-connect">Open Quick connect</a></div>
    </main>
  </div>
</div>`;
  return pageShell("Developer docs — Re-entry Cloud", body);
}

const DASHBOARD_VIEWS = Object.freeze({
  overview: { title: "Overview", kicker: "CONTROL ROOM / OVERVIEW", heading: "See what needs your attention.", description: "One calm view of your workspaces, return activity, and next setup step." },
  activity: { title: "Activity", kicker: "RECEIVER / ACTIVITY", heading: "Every event, clearly traced.", description: "Inspect the signed event metadata that reached this Re-entry Receiver." },
  pending: { title: "Pending work", kicker: "CONNECTOR / PENDING WORK", heading: "Work waiting to return.", description: "See what the Local Connector has not acknowledged yet, including lease and retry state." },
  organizations: { title: "Organizations", kicker: "CONTROL PLANE / ORGANIZATIONS", heading: "Keep each Host setup separate.", description: "Create organizations and manage the server credentials that belong to each one." },
  organization: { title: "Organization", kicker: "WORKSPACE / CONNECTION", heading: "One clear home for this Host.", description: "Manage this organization’s key and follow the exact setup path for its Host integration." },
  "quick-connect": { title: "Quick connect", kicker: "HOST SETUP / QUICK CONNECT", heading: "Connect your Host in three steps.", description: "Install the SDK, add server-only environment values, and send your first signed request." },
});

export function renderOrganizationChooserPage() {
  const header = '<header class="primary-nav console-nav"><div class="container nav-inner"><a class="brand" href="/" aria-label="Re-entry Cloud home"><span class="brand-word">re-entry</span></a><nav class="nav-right"><button id="logout-button" class="button button-secondary" type="button">Log out</button></nav></div></header>';
  const dialog = '<dialog id="org-dialog" class="console-dialog"><form method="dialog" id="org-form"><button class="dialog-close" aria-label="Close" type="button" onclick="this.closest(&quot;dialog&quot;).close()">Close</button><div class="utility">NEW ORGANIZATION</div><h2>Create an organization.</h2><p>Use an organization for one product or environment.</p><label>Organization name<input name="name" type="text" placeholder="Northstar Labs" required maxlength="120"></label><div id="org-error" class="form-error" role="alert" hidden></div><button class="button button-primary button-wide" value="default" type="submit">Create organization</button></form></dialog><div id="toast" class="toast" role="status" hidden></div>';
  const body = '<div id="organization-chooser" class="page organization-chooser-page" data-dashboard-view="organizations">' + header + '<main class="organization-chooser-main"><section class="organization-chooser" aria-labelledby="organization-chooser-title"><div class="organization-chooser-header"><div class="eyebrow">RE-ENTRY / YOUR ACCOUNT</div><h1 id="organization-chooser-title">Choose an organization.</h1><p>Pick the organization you want to work in, or create one to get started. Your organization’s keys and setup stay separate.</p></div><div class="organization-chooser-actions"><h2>Your organizations</h2><button id="new-org-button" class="button button-primary" type="button">Create organization</button></div><div id="organization-list" class="organization-chooser-list"><div class="loading-card">Loading your organizations…</div></div></section></main>' + dialog + '</div><script>' + DASHBOARD_SCRIPT + '</script>';
  return pageShell("Choose an organization — Re-entry Cloud", body);
}

export function renderOrganizationDashboardPage(view = "overview", organizationId = undefined) {
  const safeId = organizationId || "unknown";
  const activeView = view === "organization" ? "overview" : view;
  const viewAttribute = view === "organization" ? "organization" : activeView;
  const nav = (key, label, countId) => {
    const active = activeView === key ? " active" : "";
    const href = "/" + encodeURIComponent(safeId) + "/dashboard" + (key === "overview" ? "" : "/" + key);
    const count = countId ? '<span id="' + countId + '" class="nav-count" hidden></span>' : "";
    return '<a class="side-link' + active + '" href="' + href + '">' + label + count + "</a>";
  };
  const header = '<header class="primary-nav console-nav"><div class="container nav-inner"><a class="brand" href="/" aria-label="Re-entry Cloud home"><span class="brand-word">re-entry</span></a><nav class="nav-right"><span class="console-context">Organization workspace</span><a href="/docs">Developer docs</a><button id="logout-button" class="button button-secondary" type="button">Log out</button></nav></div></header>';
  const sidebar = '<aside class="doc-sidebar"><div class="sidebar-title">Organization</div><div id="workspace-name" class="sidebar-account">Loading organization…</div><nav class="sidebar-nav" aria-label="Organization dashboard navigation">' + nav("overview", "Overview") + nav("activity", "Activity") + nav("pending", "Pending work", "nav-pending-count") + nav("contracts", "Contracts") + '</nav><div class="sidebar-rule"></div><a class="workspace-back" href="/dashboard/organizations">Switch organization</a><button id="delete-org-button" class="button button-tertiary org-delete" type="button">Delete organization</button></aside>';
  const heading = activeView === "activity"
    ? "Activity"
    : activeView === "pending"
      ? "Pending work"
      : activeView === "contracts"
        ? "Contracts"
        : "Overview";
  const description = activeView === "activity"
    ? "A redacted history of what reached this Re-entry preview."
    : activeView === "pending"
      ? "Work accepted by Re-entry that still needs the Local Connector."
      : activeView === "contracts"
        ? "The small set of boundaries that connect your Host to Re-entry."
        : "A simple home for this organization’s Host connection.";
  const overview = `<section class="organization-overview" aria-labelledby="organization-overview-title">
    <div class="eyebrow">TWO ONE-TIME CONNECTIONS</div>
    <h2 id="organization-overview-title">Connect the Host. Connect the Mac. Then leave it alone.</h2>
    <p>The Host SDK asks for consent. Your account chooses a connected Mac. The background Connector opens approved work in Codex.</p>
    <div class="organization-overview-actions">
      <button id="quick-connect-button" class="organization-action" type="button"><span><strong>Connect the Host</strong><span>Install the SDK and copy setup instructions for your coding agent.</span></span><span class="organization-action-open">Open</span></button>
      <button id="secrets-button" class="organization-action" type="button"><span><strong>Host secrets</strong><span>Create the server-only API key for this organization.</span></span><span class="organization-action-open">Open</span></button>
    </div>
    <div class="organization-boundary-note"><strong>Simple boundary:</strong> Host credentials stay on the Host server. Connector credentials stay on the Mac.</div>
    <section class="connector-panel" aria-labelledby="connector-panel-title">
      <div class="connector-panel-head"><div><div class="eyebrow">YOUR LOCAL CODEX</div><h3 id="connector-panel-title">Connected Macs</h3><p>Install once. Re-entry starts the Connector at login and delivers only work you approve.</p></div><span id="connector-count" class="connector-count">0 CONNECTED</span></div>
      <div id="connector-list" class="connector-list"><div class="connector-empty">Checking your connected Macs…</div></div>
      <div class="connector-install"><p>On the Mac where Codex is installed, run this from the repository preview:</p><pre id="connector-install-code" data-receiver-command>Preparing your install command…</pre><div class="connector-install-actions"><button class="button button-secondary" type="button" data-copy-target="connector-install-code">Copy install command</button></div></div>
    </section>
  </section>`;
  const content = activeView === "activity"
    ? renderActivityDetailPage(false)
    : activeView === "pending"
      ? renderActivityDetailPage(true)
      : activeView === "contracts"
        ? renderOrganizationContractsPage()
        : overview;
  const drawers = renderOrganizationDrawers(safeId);
  const body = '<div id="organization-dashboard" class="page dashboard-page organization-dashboard" data-dashboard-view="' + viewAttribute + '" data-organization-id="' + safeId + '" data-organization-dashboard="true">' + header + '<div class="dashboard-layout">' + sidebar + '<main class="dashboard-main"><header class="dashboard-header"><div><div class="eyebrow">RE-ENTRY / ORGANIZATION</div><h1>' + heading + '</h1><p>' + description + '</p></div><div class="workspace-label">' + safeId + '</div></header><div id="new-secret" class="secret-reveal" hidden></div>' + content + '</main></div>' + drawers + '<div id="toast" class="toast" role="status" hidden></div></div><script>' + DASHBOARD_SCRIPT + '</script>';
  return pageShell(heading + " — Re-entry Cloud", body);
}

function renderOrganizationContractsPage() {
  return '<section class="organization-page-section" aria-labelledby="organization-contracts-title"><div class="organization-overview" style="padding-top:28px"><div class="eyebrow">THE CONNECTION</div><h2 id="organization-contracts-title">Four small contracts keep the return path clear.</h2><p>Each block has one job, one credential boundary, and a testable input and output.</p></div><div class="organization-contract-list"><article class="organization-contract"><strong><code>Host → Re-entry</code></strong><p>Your server sends a signed Manifest or Event using this organization’s server-only API key.</p></article><article class="organization-contract"><strong><code>Person → Re-entry</code></strong><p>The person signs in and approves the exact request on a Re-entry-owned consent page.</p></article><article class="organization-contract"><strong><code>Connector → Re-entry</code></strong><p>The outbound background Connector polls with its device-only credential and claims approved delivery work.</p></article><article class="organization-contract"><strong><code>Connector → Codex</code></strong><p>The Connector starts one fresh local Codex session with bounded workflow context; the Host still owns the final business effect.</p></article></div></section>';
}

function renderOrganizationDrawers(organizationId) {
  const aiInstructions = `Configure Re-entry from this repository. Read runtime/host-sdk/README.md and runtime/local-connector/README.md first. Install the Host SDK only in server code. Keep the organization API key and Ed25519 private key out of browser code, logs, and git. Add the account-first consent route, poll the consent status, and send an Event only after approval returns a binding. On the user Mac, install the Local Connector globally, run reentry install once, approve the browser page, and verify with reentry status. Run each package verify command and report any unverified production assumptions.`;
  return `<div id="quick-connect-drawer-backdrop" class="drawer-backdrop" data-drawer-close="quick-connect-drawer" aria-hidden="true"></div>
  <aside id="quick-connect-drawer" class="drawer" aria-hidden="true" aria-labelledby="quick-connect-title">
    <div class="drawer-header"><div><div class="eyebrow">PLUG IN RE-ENTRY</div><h2 id="quick-connect-title">Two installs. One return path.</h2><p>Connect the user’s Mac once, then add the server SDK to the Host.</p></div><button class="drawer-close" type="button" data-drawer-close="quick-connect-drawer">Close</button></div>
    <div class="drawer-body">
      <div class="drawer-tabs" role="tablist" aria-label="Re-entry setup"><button class="drawer-tab" type="button" role="tab" aria-selected="true" data-drawer-tab="mac">Local Mac</button><button class="drawer-tab" type="button" role="tab" aria-selected="false" data-drawer-tab="nextjs">Next.js</button><button class="drawer-tab" type="button" role="tab" aria-selected="false" data-drawer-tab="node">Node.js</button></div>
      <section class="drawer-section drawer-panel" data-drawer-panel="mac">
        <div class="eyebrow">INSTALL ONCE</div><div class="drawer-code-wrap"><pre id="mac-install-code" class="drawer-code" data-receiver-command>Preparing your install command…</pre><div class="drawer-copy"><button class="button button-secondary" type="button" data-copy-target="mac-install-code">Copy command</button></div></div>
        <div class="drawer-callout"><strong>What happens:</strong> the CLI checks Node and Codex, opens Re-entry in the browser, links the Mac to the signed-in account, and installs a macOS LaunchAgent that starts at login.</div>
      </section>
      <section class="drawer-section drawer-panel" data-drawer-panel="nextjs" hidden>
        <div class="eyebrow">01 / INSTALL ON THE HOST</div><div class="drawer-code-wrap"><pre id="nextjs-install-code" class="drawer-code">npm install /path/to/OpenAI-Web-MCP-Challenge/runtime/host-sdk</pre><div class="drawer-copy"><button class="button button-secondary" type="button" data-copy-target="nextjs-install-code">Copy command</button></div></div>
        <div class="drawer-code-wrap"><div class="eyebrow">02 / SERVER ENVIRONMENT</div><pre id="nextjs-env-code" class="drawer-code">HOST_ORIGIN=https://your-app.example\nRECEIVER_ORIGIN=https://your-reentry.example\nREENTRY_KEY_ID=host_key_your_app\nREENTRY_PRIVATE_KEY=your_ed25519_private_key\nREENTRY_ORGANIZATION_ID=${organizationId}\nREENTRY_ORGANIZATION_API_KEY=re_org_...</pre><div class="drawer-copy"><button class="button button-secondary" type="button" data-copy-target="nextjs-env-code">Copy variables</button></div></div>
      </section>
      <section class="drawer-section drawer-panel" data-drawer-panel="node" hidden>
        <div class="eyebrow">01 / INSTALL ON THE HOST</div><div class="drawer-code-wrap"><pre id="node-install-code" class="drawer-code">npm install /path/to/OpenAI-Web-MCP-Challenge/runtime/host-sdk</pre><div class="drawer-copy"><button class="button button-secondary" type="button" data-copy-target="node-install-code">Copy command</button></div></div>
        <div class="drawer-callout"><strong>Next:</strong> create the SDK only inside the Node server, register the Host public key, and expose a small Host route that returns the Re-entry consent URL to the browser.</div>
      </section>
      <div class="drawer-code-wrap"><div class="eyebrow">GIVE THIS TO YOUR CODING AGENT</div><pre id="agent-install-code" class="drawer-code">${aiInstructions}</pre><div class="drawer-copy"><button class="button button-secondary" type="button" data-copy-target="agent-install-code">Copy agent instructions</button></div></div>
    </div>
  </aside>
  <div id="secrets-drawer-backdrop" class="drawer-backdrop" data-drawer-close="secrets-drawer" aria-hidden="true"></div>
  <aside id="secrets-drawer" class="drawer" aria-hidden="true" aria-labelledby="secrets-title"><div class="drawer-header"><div><div class="eyebrow">ORGANIZATION CREDENTIALS</div><h2 id="secrets-title">Host secrets.</h2><p>The full API key appears only once and belongs only in the Host server environment.</p></div><button class="drawer-close" type="button" data-drawer-close="secrets-drawer">Close</button></div><div class="drawer-body"><div id="secret-drawer-content"></div><section class="drawer-section"><div class="drawer-credential"><code id="secret-org-id">${organizationId}</code><button class="button button-secondary" type="button" data-copy-target="secret-org-id">Copy organization ID</button></div><div id="drawer-key-list" class="key-list"><div class="drawer-empty-secret">No new secret is waiting. Create a key to reveal it once.</div></div><div class="drawer-copy"><button id="drawer-new-key-button" class="button button-primary" type="button">Create new key</button></div></section><div class="drawer-callout"><strong>Security boundary:</strong> Re-entry stores only a digest. The full secret cannot be recovered after this page is closed.</div></div></aside>`;
}

export function renderDashboardPage(view = "overview", organizationId = undefined) {
  const currentView = DASHBOARD_VIEWS[view] || DASHBOARD_VIEWS.overview;
  const nav = (key, label, countId) => {
    const active = view === key ? " active" : "";
    const href = key === "overview" ? "/dashboard" : "/dashboard/" + key;
    const count = countId ? '<span id="' + countId + '" class="nav-count" hidden></span>' : "";
    return '<a class="side-link' + active + '" href="' + href + '">' + label + count + "</a>";
  };
  const header = '<header class="primary-nav console-nav"><div class="container nav-inner"><a class="brand" href="/" aria-label="Re-entry Cloud home"><span class="brand-word">re-entry</span></a><nav class="nav-right"><span class="console-context">Local preview</span><a href="/">Product</a><a href="/docs">Developer docs</a><button id="logout-button" class="button button-secondary" type="button">Log out</button></nav></div></header>';
  const sidebar = '<aside class="doc-sidebar"><div class="sidebar-title">Re-entry Cloud</div><div class="sidebar-account">Control plane</div><nav class="sidebar-nav" aria-label="Dashboard navigation">' + nav("overview", "Overview") + nav("activity", "Activity") + nav("pending", "Pending work", "nav-pending-count") + nav("organizations", "Organizations") + nav("quick-connect", "Quick connect") + '</nav><div class="sidebar-rule"></div><div class="sidebar-help"><div class="eyebrow">YOUR SETUP</div><p>Start with an organization, connect a Host, then watch its return path here.</p></div></aside>';
  const pageHeader = '<header class="dashboard-header"><div class="page-kicker"><div class="eyebrow">RE-ENTRY / ' + currentView.kicker + '</div><h1>' + currentView.heading + '</h1><p>' + currentView.description + '</p><div class="dashboard-header-status"><span class="pill pill-green">LOCAL RECEIVER READY</span></div></div><div class="dashboard-header-actions"><a class="button button-primary" href="/dashboard/quick-connect">Quick connect</a><div class="account-chip"><span class="avatar">R</span><span id="account-identity">loading…</span></div></div></header>';
  const dialog = '<dialog id="org-dialog" class="console-dialog"><form method="dialog" id="org-form"><button class="dialog-close" aria-label="Close" type="button" onclick="this.closest(&quot;dialog&quot;).close()">Close</button><div class="utility">NEW ORGANIZATION</div><h2>Create an organization.</h2><p>Separate Host credentials by product or environment.</p><label>Organization name<input name="name" type="text" placeholder="Northstar Labs" required maxlength="120"></label><div id="org-error" class="form-error" role="alert" hidden></div><button class="button button-primary button-wide" value="default" type="submit">Create organization</button></form></dialog><div id="toast" class="toast" role="status" hidden></div>';
  const organizationAttribute = organizationId ? ' data-organization-id="' + organizationId + '"' : "";
  return pageShell(currentView.title + " — Re-entry Cloud", '<div class="page dashboard-page" data-dashboard-view="' + view + '"' + organizationAttribute + '>' + header + '<div class="dashboard-layout">' + sidebar + '<main class="dashboard-main">' + pageHeader + '<div id="new-secret" class="secret-reveal" hidden></div>' + renderDashboardViewPage(view, organizationId) + "</main></div>" + dialog + '</div><script>' + DASHBOARD_SCRIPT + "</script>");
}

function renderDashboardViewPage(view, organizationId) {
  if (view === "activity") return renderActivityDetailPage(false);
  if (view === "pending") return renderActivityDetailPage(true);
  if (view === "organizations") return renderOrganizationsDetailPage();
  if (view === "organization") return renderOrganizationWorkspacePage(organizationId);
  if (view === "quick-connect") return renderQuickConnectDetailPage();
  return renderOverviewDetailPage();
}

function renderDashboardMetricGrid() {
  return '<section class="metric-grid" aria-label="Workspace summary"><article class="metric-card metric-card-dark"><span class="utility">WORKSPACES</span><strong id="metric-orgs">—</strong><span>under this account</span></article><article class="metric-card"><span class="utility">API KEYS</span><strong id="metric-keys">—</strong><span>active Host credentials</span></article><article class="metric-card"><span class="utility">EVENTS</span><strong id="metric-events">—</strong><span>received by this preview</span></article><article class="metric-card metric-card-alert"><span class="utility">PENDING WORK</span><strong id="metric-pending">—</strong><span>not acknowledged yet</span></article></section>';
}

function renderOverviewDetailPage() {
  return renderDashboardMetricGrid() + '<section class="page-summary" aria-label="Re-entry summary"><article class="summary-card"><div class="eyebrow">START HERE</div><h2>Build one return path.</h2><p>Use this order once for every Host integration.</p><div class="setup-summary"><div class="setup-step"><span class="setup-step-number">1</span><div><strong>Create an organization</strong><span>Keep a product or environment boundary.</span></div></div><div class="setup-step"><span class="setup-step-number">2</span><div><strong>Create a server key</strong><span>Store the secret in your Host environment.</span></div></div><div class="setup-step"><span class="setup-step-number">3</span><div><strong>Connect the Host SDK</strong><span>Send signed manifests and events from your server.</span></div></div></div><a class="summary-link" href="/dashboard/quick-connect">Open the three-step setup</a></article><article class="summary-card summary-card-dark"><div class="eyebrow">LIVE SIGNAL</div><h2>Is the return path moving?</h2><p>Events show what arrived. Pending work shows what still needs a Connector acknowledgement.</p><a class="summary-link" href="/dashboard/activity"><span>Review all events</span><span id="summary-event-count">—</span></a><a class="summary-link" href="/dashboard/pending"><span>Review pending work</span><span id="summary-pending-count">—</span></a></article></section><section class="dashboard-section overview-grid" aria-label="Workspace overview"><article class="summary-card"><div class="section-head"><div><div class="eyebrow">WORKSPACES</div><h2>Your organizations</h2><p class="section-intro">Each organization owns its own Host credentials.</p></div><a class="button button-secondary" href="/dashboard/organizations">Manage</a></div><div id="organization-list" class="organization-list"><div class="loading-card">Loading your organizations…</div></div></article><article class="summary-card"><div class="eyebrow">NEXT STEP</div><h2>Connect the first Host.</h2><p>Choose Next.js or Node.js, copy the server environment values, and keep all credentials out of browser code.</p><a class="button button-primary" href="/dashboard/quick-connect">Open Quick connect</a></article></section><section class="dashboard-section activity-section" aria-labelledby="overview-activity-title"><div class="activity-head"><div><div class="eyebrow">RECEIVER / SNAPSHOT</div><h2 id="overview-activity-title">Current activity</h2><p>A quick pulse of the return paths. Open Activity or Pending work for full details.</p></div><div class="activity-refresh"><span class="activity-live-dot" aria-hidden="true"></span><span id="activity-updated" aria-live="polite">Loading activity…</span><button id="refresh-activity" type="button">Refresh</button></div></div><div class="activity-grid"><article class="activity-panel"><div class="activity-panel-header"><div><div class="utility">RECENT EVENTS</div><h3>What reached Re-entry</h3></div><span id="event-count" class="activity-count">—</span></div><div id="overview-event-list" class="activity-list" aria-live="polite"><div class="activity-empty">Loading events…</div></div><a class="summary-link" href="/dashboard/activity">Open event history</a></article><article class="activity-panel activity-panel-dark"><div class="activity-panel-header"><div><div class="utility">PENDING WORK</div><h3>What still needs attention</h3></div><span id="pending-count" class="activity-count">—</span></div><div id="overview-pending-list" class="activity-list" aria-live="polite"><div class="activity-empty">Loading pending work…</div></div><a class="summary-link" href="/dashboard/pending">Open pending queue</a></article></div></section>';
}

function renderActivityDetailPage(pending) {
  const title = pending ? "Pending work" : "Event history";
  const kicker = pending ? "CONNECTOR / DELIVERY QUEUE" : "RECEIVER / REDACTED READ MODEL";
  const intro = pending ? "See the delivery state that the Local Connector must claim or retry." : "Choose an event to inspect its workflow, delivery, lease, and acknowledgement metadata.";
  const listLabel = pending ? "OPEN DELIVERIES" : "ALL EVENTS";
  const listTitle = pending ? "Waiting for acknowledgement" : "Received by Re-entry";
  const listId = pending ? "pending-list" : "event-list";
  const detailId = pending ? "pending-detail" : "event-detail";
  const emptyId = pending ? "pending-detail-empty" : "event-detail-empty";
  return '<section class="dashboard-section activity-section" aria-labelledby="' + (pending ? "pending" : "activity") + '-page-title"><div class="activity-head"><div><div class="eyebrow">' + kicker + '</div><h2 id="' + (pending ? "pending" : "activity") + '-page-title">' + title + '</h2><p>' + intro + '</p></div><div class="activity-refresh"><span class="activity-live-dot" aria-hidden="true"></span><span id="activity-updated" aria-live="polite">Loading activity…</span><button id="refresh-activity" type="button">Refresh</button></div></div><div class="activity-detail-layout"><article class="activity-detail-list' + (pending ? " activity-panel-dark" : "") + '"><div class="activity-panel-header"><div><div class="utility">' + listLabel + '</div><h3>' + listTitle + '</h3></div><span id="' + (pending ? "pending" : "event") + '-count" class="activity-count">—</span></div><div id="' + listId + '" class="activity-list" aria-live="polite"><div class="activity-empty">Loading ' + (pending ? "pending work" : "events") + '…</div></div></article><article class="activity-detail-panel"><div class="utility">' + (pending ? "DELIVERY DETAILS" : "EVENT DETAILS") + '</div><div id="' + detailId + '" hidden></div><div id="' + emptyId + '" class="detail-empty">Select ' + (pending ? "pending work" : "an event") + ' to inspect its redacted lifecycle metadata.</div></article></div>' + (pending ? '<div class="detail-notice"><strong>Why this is separate:</strong> pending work means Re-entry accepted the event but the Local Connector has not completed the return yet. The Host effect and final acknowledgement are separate facts.</div>' : "") + "</section>";
}

function renderOrganizationsDetailPage() {
  return '<section class="dashboard-section" aria-labelledby="organizations-page-title"><div class="section-head"><div><div class="eyebrow">WORKSPACES / ORGANIZATIONS</div><h2 id="organizations-page-title">Choose before you connect.</h2><p class="section-intro">Create or remove a workspace here. Open one only when you are ready to manage its Host connection.</p></div><button id="new-org-button" class="button button-primary" type="button">New organization</button></div><div id="organization-manager" data-organization-manager="true"><div id="organization-list" class="organization-list"><div class="loading-card">Loading your organizations…</div></div></div></section><section class="dashboard-section page-summary" aria-label="Organization setup guide"><article class="summary-card"><div class="eyebrow">HOW IT WORKS</div><h2>One organization, one connection.</h2><p>Use separate organizations for separate products or environments. Each one gets its own server key and setup page.</p><div class="setup-summary"><div class="setup-step"><span class="setup-step-number">1</span><div><strong>Create or choose a workspace</strong><span>Keep ownership and credentials easy to understand.</span></div></div><div class="setup-step"><span class="setup-step-number">2</span><div><strong>Open its dashboard</strong><span>See keys and installation steps for only that organization.</span></div></div><div class="setup-step"><span class="setup-step-number">3</span><div><strong>Delete when finished</strong><span>Deleting removes its console keys from this preview account.</span></div></div></div></article><article class="summary-card summary-card-dark"><div class="eyebrow">SAFETY NOTE</div><h2>Deleting is permanent here.</h2><p>Deleting an organization also removes its API keys. Re-entry preview event history is not shown on this page and is not automatically erased.</p></article></section>';
}

function renderOrganizationWorkspacePage(organizationId) {
  const safeId = organizationId || "unknown";
  return `
<div class="workspace-bar"><a class="workspace-back" href="/dashboard/organizations">All organizations</a><span id="workspace-id" class="workspace-id">${safeId}</span></div>
<section class="workspace-summary" aria-label="Organization summary">
  <article class="summary-card"><div class="eyebrow">ORGANIZATION WORKSPACE</div><div class="workspace-identity"><span class="workspace-identity-mark">ORG</span><div><strong id="workspace-name">Loading organization…</strong><span>One isolated home for this Host integration.</span></div></div><div class="danger-zone"><p>Need to remove this workspace and its credentials?</p><button id="delete-org-button" class="button button-tertiary org-delete" type="button">Delete organization</button></div></article>
  <article class="summary-card summary-card-dark"><div class="eyebrow">CONNECTION PATH</div><h2>Server to Re-entry.</h2><p>Your Host server signs the request. Re-entry verifies it and routes approved work back through the Connector.</p><a class="summary-link" href="/dashboard/quick-connect">Read framework setup</a></article>
</section>
<section class="dashboard-section workspace-setup-section" aria-labelledby="workspace-setup-title"><div class="workspace-setup-intro"><div><div class="eyebrow">START HERE</div><h2 id="workspace-setup-title">Connect this organization in three steps.</h2></div><p>Complete these once, then use Activity and Pending work to watch the return path.</p></div><div class="workspace-setup-progress"><article><span class="workspace-setup-number">01</span><h3>Create a server key</h3><p>Generate a secret for this organization and keep it in your Host environment.</p></article><article><span class="workspace-setup-number">02</span><h3>Install the SDK</h3><p>Use the server package from a Next.js route or any Node.js server.</p></article><article><span class="workspace-setup-number">03</span><h3>Send a signed event</h3><p>Ask for consent, then send the approved continuation event.</p></article></div></section>
<section class="dashboard-section" aria-labelledby="workspace-credentials-title"><div class="section-head"><div><div class="eyebrow">01 / CREDENTIALS</div><h2 id="workspace-credentials-title">Keys for this organization</h2><p class="section-intro">Create a key, copy its secret once, and store it in your Host server environment.</p></div><span class="pill pill-blue">SERVER-SIDE ONLY</span></div><div class="integration-grid"><article class="keys-panel"><div class="subpanel-header"><div><div class="utility">ORGANIZATION API KEYS</div><h3 id="selected-org-title">Loading…</h3></div><button id="new-key-button" class="button button-secondary" type="button">Create key</button></div><p class="subpanel-copy">Only the key prefix and status are stored for later display. The full secret is revealed once at creation.</p><div id="key-list" class="key-list"><div class="loading-row">Loading keys…</div></div></article><article class="quickstart-panel"><div class="utility">SERVER ENVIRONMENT</div><h3>Put these on the Host server.</h3><pre class="quickstart-code">REENTRY_ORGANIZATION_ID=${safeId}
REENTRY_ORGANIZATION_API_KEY=re_org_...
RECEIVER_ORIGIN=https://your-reentry.example</pre><div class="quickstart-foot">The browser never needs the organization key. Keep it in the Host server process.</div></article></div></section>
<section class="dashboard-section" aria-labelledby="workspace-install-title"><div class="section-head"><div><div class="eyebrow">02 / INSTALL</div><h2 id="workspace-install-title">Install this organization’s connection.</h2><p class="section-intro">The SDK stays the same for every organization; only the organization key changes.</p></div><a class="button button-secondary" href="/dashboard/quick-connect">Open SDK guide</a></div><div class="organization-setup-grid"><article class="organization-setup-step"><span class="organization-setup-step-number">01</span><h3>Install the SDK</h3><pre class="quick-connect-code">npm install /path/to/runtime/host-sdk</pre><p>Use the local package for this hackathon preview.</p></article><article class="organization-setup-step"><span class="organization-setup-step-number">02</span><h3>Add server variables</h3><pre class="quick-connect-code">REENTRY_ORGANIZATION_API_KEY=re_org_...</pre><p>Keep credentials in the server environment.</p></article><article class="organization-setup-step"><span class="organization-setup-step-number">03</span><h3>Send the first event</h3><pre class="quick-connect-code">Host server → Re-entry</pre><p>Use the framework examples for the signed request shape.</p></article></div></section>`;
}

function renderQuickConnectDetailPage() {
  return '<section class="page-summary"><article class="summary-card"><div class="eyebrow">SETUP IN ONE VIEW</div><h2>Three steps from account to event.</h2><p>Follow this order, then use the framework tab below for the exact code shape.</p><div class="setup-summary"><div class="setup-step"><span class="setup-step-number">1</span><div><strong>Create an organization and key</strong><span>Use Organizations and keep the secret server-side.</span></div></div><div class="setup-step"><span class="setup-step-number">2</span><div><strong>Install the Host SDK</strong><span>Use the local package for this preview.</span></div></div><div class="setup-step"><span class="setup-step-number">3</span><div><strong>Send a signed request</strong><span>Call the SDK from a server Route Handler.</span></div></div></div></article><article class="summary-card summary-card-dark"><div class="eyebrow">BOUNDARY CHECK</div><h2>Browser triggers. Server signs.</h2><p>Your browser can start your Host route, but private keys and organization keys stay in the Host server process.</p><a class="summary-link" href="/dashboard/organizations">Manage keys</a></article></section><section class="dashboard-section quick-connect-section" aria-labelledby="quick-connect-title"><div class="section-head"><div><div class="eyebrow">HOST SETUP / FRAMEWORKS</div><h2 id="quick-connect-title">Choose your server shape.</h2><p class="section-intro">The framework changes; the Re-entry boundary does not.</p></div><span class="pill pill-blue">PREVIEW SDK</span></div><div class="quick-connect-card"><div class="quick-connect-tabs" role="tablist" aria-label="Host setup examples"><button id="nextjs-tab" class="quick-connect-tab" role="tab" aria-selected="true" aria-controls="nextjs-panel" data-quickstart-tab="nextjs" type="button">Next.js</button><button id="node-tab" class="quick-connect-tab" role="tab" aria-selected="false" aria-controls="node-panel" data-quickstart-tab="node" type="button">Node.js server</button></div>' + renderQuickConnectPanelDetail("nextjs") + renderQuickConnectPanelDetail("node") + "</div></section>";
}

function renderQuickConnectPanelDetail(kind) {
  const isNext = kind === "nextjs";
  const intro = isNext ? "The server SDK signs the Host request and calls Re-entry. Your browser only triggers your own Host route." : "Use the same server SDK from a Node.js HTTP handler. The framework changes; the Re-entry boundary does not.";
  const third = isNext ? "Create the server SDK" : "Call it from the server";
  const finalCopy = isNext ? "Use this object from a Route Handler or other server-only code." : "Call reentry.createManifest or reentry.sendEvent after loading Host truth.";
  const note = isNext ? "the SDK and dashboard show the contract, while this local Receiver still uses its configured preview Host credential for event ingress." : "the browser may request your route, but only the Host server holds signing credentials and talks to Re-entry.";
  const code = 'import { createHostSdk } from "@webmcp-challenge/host-sdk/server";\\n\\nconst reentry = createHostSdk({\\n  origin: process.env.HOST_ORIGIN,\\n  receiverOrigin: process.env.RECEIVER_ORIGIN,\\n  privateKey: process.env.REENTRY_PRIVATE_KEY,\\n  keyId: process.env.REENTRY_KEY_ID,\\n  organizationApiKey: process.env.REENTRY_ORGANIZATION_API_KEY,\\n});';
  return '<div id="' + kind + '-panel" class="quick-connect-panel" role="tabpanel" aria-labelledby="' + (isNext ? "nextjs" : "node") + '-tab" data-quickstart-panel="' + kind + '"' + (isNext ? "" : " hidden") + '><p class="quick-connect-intro">' + intro + '</p><div class="quick-connect-step-grid"><article class="quick-connect-step"><span class="quick-connect-step-number">01</span><h3>Install the SDK</h3><pre class="quick-connect-code">npm install /path/to/OpenAI-Web-MCP-Challenge/runtime/host-sdk</pre><p>Use the local checkout for this preview. The package is private and not published yet.</p></article><article class="quick-connect-step"><span class="quick-connect-step-number">02</span><h3>' + (isNext ? "Add server environment" : "Set the same variables") + '</h3><pre class="quick-connect-code">HOST_ORIGIN=https://your-app.example\\nRECEIVER_ORIGIN=https://your-reentry.example\\nREENTRY_KEY_ID=host_key_your_app\\nREENTRY_PRIVATE_KEY=your_host_private_key\\nREENTRY_ORGANIZATION_API_KEY=re_org_...</pre><p>Keep private keys and organization keys out of browser code and source control.</p></article><article class="quick-connect-step"><span class="quick-connect-step-number">03</span><h3>' + third + '</h3><pre class="quick-connect-code">' + code + '</pre><p>' + finalCopy + '</p></article></div><div class="quick-connect-note"><strong>Preview boundary:</strong> ' + note + '</div></div>';
}

export function renderDashboardSimple() {
  return pageShell(
    "Dashboard — Re-entry Cloud",
    `<div class="page dashboard-page">
  <header class="primary-nav console-nav">
    <div class="container nav-inner">
      <a class="brand" href="/" aria-label="Re-entry Cloud home"><span class="brand-word">re-entry</span></a>
      <nav class="nav-right"><span class="console-context">Local preview</span><a href="/">Product</a><button id="logout-button" class="button button-secondary" type="button">Log out</button></nav>
    </div>
  </header>
  <div class="dashboard-layout">
    <aside class="doc-sidebar">
      <div class="sidebar-title">Re-entry Cloud</div>
      <div class="sidebar-account">Control plane</div>
      <nav class="sidebar-nav" aria-label="Dashboard navigation">
        <a class="side-link active" href="#overview">Overview</a>
        <a class="side-link" href="#activity">Activity</a>
        <a class="side-link" href="#organizations">Organizations</a>
        <a class="side-link" href="#quick-connect">Quick connect</a>
      </nav>
      <div class="sidebar-rule"></div>
      <div class="sidebar-help"><div class="eyebrow">YOUR SETUP</div><p>Choose an organization, create a key, then connect your Host server.</p></div>
    </aside>
    <main class="dashboard-main" id="overview">
      <header class="dashboard-header">
        <div><div class="eyebrow">RE-ENTRY / CONTROL ROOM</div><h1>Your return paths.</h1><p>Manage the places where approved continuation can begin.</p><div class="dashboard-header-status"><span class="pill pill-green">LOCAL RECEIVER READY</span></div></div>
        <div class="dashboard-header-actions"><button id="quick-connect-button" class="button button-primary" type="button">Quick connect</button><div class="account-chip"><span class="avatar">R</span><span id="account-identity">loading…</span></div></div>
      </header>
      <section class="metric-grid" aria-label="Workspace summary">
        <article class="metric-card metric-card-dark"><span class="utility">WORKSPACES</span><strong id="metric-orgs">—</strong><span>under this account</span></article>
        <article class="metric-card"><span class="utility">API KEYS</span><strong id="metric-keys">—</strong><span>active Host credentials</span></article>
        <article class="metric-card"><span class="utility">EVENTS</span><strong id="metric-events">—</strong><span>received by this preview</span></article>
        <article class="metric-card metric-card-alert"><span class="utility">PENDING WORK</span><strong id="metric-pending">—</strong><span>not acknowledged yet</span></article>
      </section>
      <section class="dashboard-section activity-section" id="activity" aria-labelledby="activity-title">
        <div class="activity-head">
          <div><div class="eyebrow">RECEIVER / LIVE VIEW</div><h2 id="activity-title">Current activity</h2><p>Recent signed events and delivery work that is not finished.</p></div>
          <div class="activity-refresh"><span class="activity-live-dot" aria-hidden="true"></span><span id="activity-updated" aria-live="polite">Loading activity…</span><button id="refresh-activity" type="button">Refresh</button></div>
        </div>
        <div class="activity-grid">
          <article class="activity-panel"><div class="activity-panel-header"><div><div class="utility">RECENT EVENTS</div><h3>What reached Re-entry</h3></div><span id="event-count" class="activity-count">—</span></div><div id="event-list" class="activity-list" aria-live="polite"><div class="activity-empty">Loading events…</div></div></article>
          <article class="activity-panel activity-panel-dark"><div class="activity-panel-header"><div><div class="utility">PENDING WORK</div><h3>What still needs attention</h3></div><span id="pending-count" class="activity-count">—</span></div><div id="pending-list" class="activity-list" aria-live="polite"><div class="activity-empty">Loading pending work…</div></div></article>
        </div>
      </section>
      <section class="dashboard-section quick-connect-section" id="quick-connect" aria-labelledby="quick-connect-title">
        <div class="section-head"><div><div class="eyebrow">HOST SETUP</div><h2 id="quick-connect-title">Connect your Host</h2><p class="section-intro">Choose your server framework, add the environment values, and keep the organization key on the server.</p></div><span class="pill pill-blue">PREVIEW SDK</span></div>
        <div class="quick-connect-card">
          <div class="quick-connect-tabs" role="tablist" aria-label="Host setup examples">
            <button id="nextjs-tab" class="quick-connect-tab" role="tab" aria-selected="true" aria-controls="nextjs-panel" data-quickstart-tab="nextjs" type="button">Next.js</button>
            <button id="node-tab" class="quick-connect-tab" role="tab" aria-selected="false" aria-controls="node-panel" data-quickstart-tab="node" type="button">Node.js server</button>
          </div>
          <div id="nextjs-panel" class="quick-connect-panel" role="tabpanel" aria-labelledby="nextjs-tab" data-quickstart-panel="nextjs">
            <p class="quick-connect-intro">The server SDK signs the Host request and calls Re-entry. Your browser only triggers your own Host route.</p>
            <div class="quick-connect-step-grid">
              <article class="quick-connect-step"><span class="quick-connect-step-number">01</span><h3>Install the SDK</h3><pre class="quick-connect-code">npm install /path/to/OpenAI-Web-MCP-Challenge/runtime/host-sdk</pre><p>Use the local checkout for this preview. The package is private and not published yet.</p></article>
              <article class="quick-connect-step"><span class="quick-connect-step-number">02</span><h3>Add server environment</h3><pre class="quick-connect-code">HOST_ORIGIN=https://your-app.example
RECEIVER_ORIGIN=https://your-reentry.example
REENTRY_KEY_ID=host_key_your_app
REENTRY_PRIVATE_KEY=your_host_private_key
REENTRY_ORGANIZATION_API_KEY=re_org_...</pre><p>Keep the private key and organization key out of browser code and source control.</p></article>
              <article class="quick-connect-step"><span class="quick-connect-step-number">03</span><h3>Create the server SDK</h3><pre class="quick-connect-code">import { createHostSdk } from "@webmcp-challenge/host-sdk/server";

const reentry = createHostSdk({
  origin: process.env.HOST_ORIGIN,
  receiverOrigin: process.env.RECEIVER_ORIGIN,
  privateKey: process.env.REENTRY_PRIVATE_KEY,
  keyId: process.env.REENTRY_KEY_ID,
  organizationApiKey: process.env.REENTRY_ORGANIZATION_API_KEY,
});</pre><p>Use this object from a Route Handler or other server-only code.</p></article>
            </div>
            <div class="quick-connect-note"><strong>What this preview does:</strong> the SDK and dashboard show the contract, while this local Receiver still uses its configured preview Host credential for event ingress.</div>
          </div>
          <div id="node-panel" class="quick-connect-panel" role="tabpanel" aria-labelledby="node-tab" data-quickstart-panel="node" hidden>
            <p class="quick-connect-intro">Use the same server SDK from a Node.js HTTP handler. The framework changes; the Re-entry boundary does not.</p>
            <div class="quick-connect-step-grid">
              <article class="quick-connect-step"><span class="quick-connect-step-number">01</span><h3>Install the SDK</h3><pre class="quick-connect-code">npm install /path/to/OpenAI-Web-MCP-Challenge/runtime/host-sdk</pre><p>Point your application at the local/private package for this preview.</p></article>
              <article class="quick-connect-step"><span class="quick-connect-step-number">02</span><h3>Set the same variables</h3><pre class="quick-connect-code">HOST_ORIGIN=https://your-app.example
RECEIVER_ORIGIN=https://your-reentry.example
REENTRY_KEY_ID=host_key_your_app
REENTRY_PRIVATE_KEY=your_host_private_key
REENTRY_ORGANIZATION_API_KEY=re_org_...</pre><p>These values belong in the Node process environment.</p></article>
              <article class="quick-connect-step"><span class="quick-connect-step-number">03</span><h3>Call it from the server</h3><pre class="quick-connect-code">import { createHostSdk } from "@webmcp-challenge/host-sdk/server";

const reentry = createHostSdk({
  origin: process.env.HOST_ORIGIN,
  receiverOrigin: process.env.RECEIVER_ORIGIN,
  privateKey: process.env.REENTRY_PRIVATE_KEY,
  keyId: process.env.REENTRY_KEY_ID,
  organizationApiKey: process.env.REENTRY_ORGANIZATION_API_KEY,
});</pre><p>Call reentry.createManifest or reentry.sendEvent after loading Host truth.</p></article>
            </div>
            <div class="quick-connect-note"><strong>Keep the boundary clear:</strong> the browser may request your route, but only the Host server holds signing credentials and talks to Re-entry.</div>
          </div>
          <div class="quick-connect-footer"><span>Preview package / server-only credentials</span><a href="/#how-it-works">Read the protocol loop</a></div>
        </div>
      </section>
      <section class="dashboard-section" id="organizations"><div class="section-head"><div><div class="eyebrow">WORKSPACES</div><h2>Organizations</h2><p class="section-intro">Keep each Host setup separate.</p></div><button id="new-org-button" class="button button-primary" type="button">New organization</button></div><div id="organization-list" class="organization-list"><div class="loading-card">Loading your organizations…</div></div></section>
      <section class="dashboard-section" id="integration"><div class="section-head"><div><div class="eyebrow">HOST CREDENTIALS</div><h2 id="selected-org-title">Your Host connection</h2><p class="section-intro">Create and revoke keys for the selected organization.</p></div><span class="pill pill-blue">SERVER-SIDE ONLY</span></div><div class="integration-grid"><article class="keys-panel"><div class="subpanel-header"><div><div class="utility">ORGANIZATION API KEYS</div><h3>Connect a Host</h3></div><button id="new-key-button" class="button button-secondary" type="button">Create key</button></div><p class="subpanel-copy">The full secret appears only once. Store it in your Host server environment.</p><div id="key-list" class="key-list"><div class="loading-row">Select an organization to view keys.</div></div><div id="new-secret" class="secret-reveal" hidden></div></article><article class="quickstart-panel"><div class="utility">RE-ENTRY BOUNDARY</div><h3>Server credentials stay server-side.</h3><pre class="quickstart-code">HOST → signed event → Re-entry
Re-entry → delivery → local Connector</pre><div class="quickstart-foot">The dashboard key authorizes control requests; it is never rendered into a browser bundle.</div></article></div></section>
    </main>
  </div>
  <dialog id="org-dialog" class="console-dialog"><form method="dialog" id="org-form"><button class="dialog-close" aria-label="Close" type="button" onclick="this.closest('dialog').close()">Close</button><div class="utility">NEW ORGANIZATION</div><h2>Create an organization.</h2><p>Separate Host credentials by product or environment.</p><label>Organization name<input name="name" type="text" placeholder="Northstar Labs" required maxlength="120"></label><div id="org-error" class="form-error" role="alert" hidden></div><button class="button button-primary button-wide" value="default" type="submit">Create organization</button></form></dialog>
  <div id="toast" class="toast" role="status" hidden></div>
</div><script>${DASHBOARD_SCRIPT}</script>`,
  );
}

function isConnectorReturnPath(value) {
  if (typeof value !== "string" || value.length > 256) return false;
  let url;
  try {
    url = new URL(value, "http://reentry.local");
  } catch {
    return false;
  }
  if (
    url.origin !== "http://reentry.local" ||
    url.pathname !== "/connect" ||
    url.hash ||
    url.searchParams.getAll("token").length !== 1 ||
    [...url.searchParams.keys()].some((key) => key !== "token")
  ) {
    return false;
  }
  return /^[A-Za-z0-9_-]{43}$/.test(url.searchParams.get("token"));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
