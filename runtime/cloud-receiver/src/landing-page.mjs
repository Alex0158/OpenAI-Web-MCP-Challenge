const STYLE = `
@import url("https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=Poppins:wght@600;700;800&family=Space+Mono:wght@400;700&display=swap");

:root{--fuchsia:#d946ef;--fuchsia-hover:#c026d3;--fuchsia-active:#a21caf;--cyan:#22d3ee;--cyan-deep:#0891b2;--yellow:#facc15;--ink:#171717;--body:#404040;--muted:#737373;--line:#e5e5e5;--canvas:#fafafa;--surface:#fff;--dark:#171717;--focus:rgba(217,70,239,.18)}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--canvas);color:var(--ink);font:400 16px/1.6 "Nunito",sans-serif;-webkit-font-smoothing:antialiased}a{color:inherit;text-decoration:none}button,input{font:inherit}button{cursor:pointer}img{display:block;max-width:100%}:focus-visible{outline:3px solid var(--focus);outline-offset:3px}.mono{font:400 12px/1.5 "Space Mono",monospace;letter-spacing:.02em}.container{width:min(1240px,100%);margin:0 auto;padding:0 48px}.landing-page{min-height:100vh;overflow:hidden}.site-nav{height:72px;background:rgba(250,250,250,.94);border-bottom:1px solid var(--line);position:relative;z-index:5}.nav-inner{height:100%;display:flex;align-items:center;justify-content:space-between}.brand{display:inline-flex;align-items:center;gap:10px;font:800 20px/1 "Poppins",sans-serif;letter-spacing:-.04em}.brand-avatar{width:38px;height:38px;object-fit:contain;border:1px solid #d4d4d4;border-radius:50%;background:var(--surface)}.brand-word{color:var(--ink)}.brand-product{color:var(--muted);font:700 11px/1 "Space Mono",monospace;letter-spacing:.1em;text-transform:uppercase}.nav-links{display:flex;align-items:center;gap:28px;color:var(--body);font-size:14px;font-weight:700}.nav-links>a:not(.nav-cta):hover{color:var(--fuchsia)}.nav-cta,.button-primary{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:11px 24px;border:0;border-radius:9999px;background:var(--fuchsia);color:#fff;font-size:15px;font-weight:800;line-height:1;box-shadow:1px 2px 4px rgba(0,0,0,.08);transition:background .18s ease,transform .18s ease,box-shadow .18s ease}.nav-cta:hover,.button-primary:hover{background:var(--fuchsia-hover);transform:translateY(-2px);box-shadow:4px 8px 14px rgba(217,70,239,.16),2px 4px 7px rgba(0,0,0,.07)}.nav-cta:active,.button-primary:active{background:var(--fuchsia-active);transform:translateY(0);box-shadow:none}.button-secondary{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:10px 24px;border:2px solid var(--fuchsia);border-radius:9999px;background:transparent;color:var(--fuchsia);font-size:15px;font-weight:800;line-height:1;transition:background .18s ease,color .18s ease}.button-secondary:hover{background:#fdf4ff;color:var(--fuchsia-hover)}.eyebrow{display:inline-flex;align-items:center;gap:8px;color:var(--muted);font:700 11px/1.2 "Space Mono",monospace;letter-spacing:.1em;text-transform:uppercase}.eyebrow-dot{width:8px;height:8px;border-radius:50%;background:var(--cyan);box-shadow:0 0 0 4px rgba(34,211,238,.16)}.hero{display:grid;grid-template-columns:minmax(0,.94fr) minmax(480px,1.06fr);gap:70px;align-items:center;min-height:calc(100vh - 72px);padding-top:62px;padding-bottom:74px}.hero-copy{max-width:600px}.hero h1{margin:22px 0 20px;font:800 clamp(48px,6vw,76px)/1.08 "Poppins",sans-serif;letter-spacing:-.055em}.hero h1 span{display:block;color:#525252}.hero-copy>p{max-width:500px;margin:0;color:var(--body);font-size:18px;line-height:1.55}.hero-actions{display:flex;align-items:center;gap:12px;margin-top:30px}.hero-meta{display:flex;align-items:center;gap:12px;margin-top:25px;color:var(--muted);font-size:13px}.meta-chip{padding:5px 9px;border-radius:4px;background:#fef9c3;color:#854d0e;font:700 10px/1.2 "Space Mono",monospace;letter-spacing:.05em}.hero-art{position:relative;min-height:535px;overflow:hidden;border-radius:24px;background:var(--dark);box-shadow:10px 25px 40px rgba(0,0,0,.1),6px 10px 16px rgba(0,0,0,.06)}.shader-canvas{position:absolute;inset:0;width:100%;height:100%;opacity:.96}.art-topline,.art-foot{position:absolute;left:26px;right:26px;display:flex;align-items:center;justify-content:space-between;color:rgba(255,255,255,.72)}.art-topline{top:24px}.art-foot{bottom:24px;color:rgba(255,255,255,.55)}.art-topline .mono,.art-foot .mono{font-size:10px;letter-spacing:.08em}.art-status{display:inline-flex;align-items:center;gap:7px;padding:6px 10px;border:1px solid rgba(34,211,238,.45);border-radius:9999px;color:var(--cyan);font:700 10px/1 "Space Mono",monospace;letter-spacing:.06em}.live-dot{width:6px;height:6px;border-radius:50%;background:var(--cyan)}.art-center-copy{position:absolute;left:34px;top:150px;color:#fff}.art-center-copy .mono{color:var(--yellow);font-size:10px}.art-center-copy h2{margin:14px 0 10px;font:800 42px/1.08 "Poppins",sans-serif;letter-spacing:-.05em}.art-center-copy p{max-width:190px;margin:0;color:rgba(255,255,255,.68);font-size:14px;line-height:1.5}.manifest-float{position:absolute;right:25px;top:120px;width:235px;padding:18px;border:1px solid rgba(23,23,23,.08);border-radius:16px;background:rgba(255,255,255,.96);color:var(--ink);box-shadow:4px 8px 16px rgba(0,0,0,.1),1px 2px 4px rgba(0,0,0,.06);transform:rotate(2deg)}.manifest-float .overline{display:block;margin-bottom:12px;color:var(--muted);font:700 10px/1.2 "Space Mono",monospace;letter-spacing:.08em}.manifest-float strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:700 13px/1.4 "Space Mono",monospace}.manifest-row{display:flex;justify-content:space-between;gap:12px;margin-top:15px;padding-top:12px;border-top:1px solid var(--line);font-size:12px}.cyan-text{color:var(--cyan-deep);font-weight:800}.yellow-text{color:#a16207;font-weight:800}.mascot-stage{position:absolute;right:18px;bottom:25px;display:flex;align-items:flex-end;justify-content:flex-end;width:315px;height:300px}.mascot-stage img{width:275px;height:295px;object-fit:contain;object-position:center bottom;filter:drop-shadow(0 8px 4px rgba(0,0,0,.2))}.art-foot .path{color:rgba(255,255,255,.82);font:700 10px/1.2 "Space Mono",monospace;letter-spacing:.06em}.compact-loop{padding:24px 0 28px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--surface)}.compact-loop-head{display:flex;align-items:end;justify-content:space-between;gap:24px}.compact-loop-head h2{margin:10px 0 0;font:700 28px/1.15 "Poppins",sans-serif;letter-spacing:-.035em}.compact-loop-head>p{margin:0 0 3px;color:var(--muted);font:700 11px/1.2 "Space Mono",monospace;letter-spacing:.06em;text-transform:uppercase}.compact-loop-grid{display:grid;grid-template-columns:repeat(3,1fr);margin-top:22px}.compact-loop-item{display:flex;align-items:center;gap:14px;padding:4px 28px 4px 0}.compact-loop-item+.compact-loop-item{padding-left:28px;border-left:1px solid var(--line)}.compact-loop-item .step-mark{display:grid;place-items:center;flex:none;width:34px;height:34px;border-radius:10px;background:#cffafe;color:var(--cyan-deep);font:700 11px/1 "Space Mono",monospace}.compact-loop-item:nth-child(2) .step-mark{background:#fef9c3;color:#854d0e}.compact-loop-item:nth-child(3) .step-mark{background:#fdf4ff;color:var(--fuchsia)}.compact-loop-item .mono{display:block;color:var(--muted);font-size:9px;letter-spacing:.08em}.compact-loop-item strong{display:block;margin-top:3px;font:700 16px/1.25 "Poppins",sans-serif;letter-spacing:-.02em}.site-footer{padding:25px 0 28px;background:var(--canvas)}.footer-inner{display:flex;align-items:center;justify-content:space-between;gap:24px}.footer-inner .brand{font-size:16px}.footer-inner .brand-avatar{width:30px;height:30px}.footer-inner .brand-product{font-size:9px}.footer-note{color:var(--muted);font-size:13px}.footer-links{display:flex;gap:22px;color:var(--body);font-size:13px;font-weight:700}.footer-links a:hover{color:var(--fuchsia)}
@media(max-width:1040px){.container{padding-left:32px;padding-right:32px}.hero{grid-template-columns:1fr;gap:45px;min-height:0;padding-top:64px}.hero-copy{max-width:760px}.hero-art{max-width:760px;width:100%;min-height:500px}}
@media(max-width:720px){.container{padding-left:20px;padding-right:20px}.site-nav{height:auto;min-height:68px}.nav-inner{padding-top:11px;padding-bottom:11px}.nav-links{gap:10px}.nav-links>a:not(.nav-cta){display:none}.nav-cta{min-height:40px;padding:10px 15px;font-size:13px}.brand{font-size:18px}.brand-avatar{width:34px;height:34px}.hero{padding-top:48px;padding-bottom:56px}.hero h1{font-size:47px}.hero-copy>p{font-size:17px}.hero-actions{align-items:stretch;flex-direction:column}.hero-actions .button-primary,.hero-actions .button-secondary{width:100%}.hero-meta{align-items:flex-start;flex-direction:column;gap:8px}.hero-art{min-height:530px;border-radius:16px}.art-topline,.art-foot{left:18px;right:18px}.art-center-copy{left:22px;top:126px}.art-center-copy h2{font-size:36px}.manifest-float{right:16px;top:94px;width:205px;padding:14px}.mascot-stage{right:-13px;bottom:35px;width:250px;height:250px}.mascot-stage img{width:230px;height:245px}.compact-loop{padding-top:22px;padding-bottom:24px}.compact-loop-head{align-items:flex-start;flex-direction:column;gap:9px}.compact-loop-head h2{font-size:25px}.compact-loop-head>p{margin:0;font-size:9px}.compact-loop-grid{grid-template-columns:1fr;gap:0;margin-top:16px}.compact-loop-item,.compact-loop-item+.compact-loop-item{padding:13px 0;border-left:0;border-top:1px solid var(--line)}.compact-loop-item:first-child{border-top:0}.footer-inner{align-items:flex-start;flex-wrap:wrap}.footer-note{order:3;width:100%;font-size:12px}.footer-links{gap:14px 22px}}
`;
const LANDING_EXTENSION_STYLE = `
.audience-section{border-top:1px solid var(--line);background:var(--canvas)}.audience-section .section-heading{max-width:760px}.audience-tabs{display:flex;gap:4px;margin-top:28px;padding:4px;border:1px solid var(--line);border-radius:999px;background:var(--surface);width:max-content}.audience-tab{min-height:42px;padding:9px 18px;border:0;border-radius:999px;background:transparent;color:var(--body);font-size:14px;font-weight:800}.audience-tab:hover{color:var(--fuchsia)}.audience-tab[aria-selected="true"]{background:var(--dark);color:#fff}.audience-panel{margin-top:20px;padding:24px;border:1px solid var(--line);border-radius:16px;background:var(--surface)}.audience-panel[hidden]{display:none}.audience-panel-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.audience-step{min-width:0;padding:20px;border:1px solid var(--line);border-radius:12px;background:var(--canvas)}.audience-step-number{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:#cffafe;color:var(--cyan-deep);font:700 11px/1 "Space Mono",monospace}.audience-step:nth-child(2) .audience-step-number{background:#fef9c3;color:#854d0e}.audience-step:nth-child(3) .audience-step-number{background:#fdf4ff;color:var(--fuchsia)}.audience-step h3{margin:15px 0 7px;font:700 19px/1.3 "Poppins",sans-serif;letter-spacing:-.03em}.audience-step p{margin:0;color:var(--body);font-size:14px;line-height:1.55}.audience-code{margin:15px 0 0;padding:13px;border-radius:10px;background:var(--dark);color:#fff;font:12px/1.65 "Space Mono",monospace;white-space:pre-wrap;overflow:auto}.audience-note{margin-top:18px;padding:13px 15px;border-left:3px solid var(--fuchsia);background:#fdf4ff;color:var(--body);font-size:13px;line-height:1.55}.audience-note strong{color:var(--ink)}.audience-cta{display:inline-flex;margin-top:20px;color:var(--fuchsia-active);font-size:14px;font-weight:800;text-decoration:underline;text-underline-offset:3px}.audience-cta:hover{color:var(--fuchsia)}
@media(max-width:720px){.audience-tabs{width:100%}.audience-tab{flex:1;padding-left:10px;padding-right:10px}.audience-panel{padding:17px}.audience-panel-grid{grid-template-columns:1fr}.audience-step{padding:17px}}
`;
const AUDIENCE_REDESIGN_STYLE = `
.audience-section{padding-top:96px;padding-bottom:104px;background:linear-gradient(180deg,var(--canvas) 0%,#f4f7f7 100%)}.audience-heading-layout{display:flex;align-items:flex-end;justify-content:space-between;gap:40px}.audience-section .section-heading{max-width:700px}.audience-section .section-heading h2{max-width:640px;margin-top:14px;font-size:clamp(36px,5vw,58px);line-height:1.03;letter-spacing:-.06em}.audience-section .section-heading p{max-width:560px;margin-top:16px;color:var(--body);font-size:17px;line-height:1.55}.audience-heading-note{display:grid;gap:8px;max-width:245px;padding:16px 18px;border-left:3px solid var(--cyan);background:rgba(255,255,255,.68);color:var(--body);font-size:12px;line-height:1.45}.audience-heading-note span{color:var(--cyan-deep);font:700 10px/1.2 "Space Mono",monospace;letter-spacing:.08em}.audience-heading-note strong{font-size:14px;color:var(--ink)}.audience-tabs{margin-top:34px;padding:4px;border:1px solid #d9e1e1;border-radius:14px;background:#e9eeee;width:max-content}.audience-tab{min-height:44px;padding:10px 20px;border-radius:10px}.audience-tab[aria-selected="true"]{background:var(--dark);box-shadow:0 4px 10px rgba(23,23,23,.12)}.audience-panel{margin-top:18px;padding:0;border:1px solid #d9e1e1;border-radius:18px;background:var(--surface);box-shadow:0 18px 45px rgba(23,23,23,.07);overflow:hidden}.audience-panel-header{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:20px 24px;border-bottom:1px solid var(--line);background:#fbfdfd}.audience-panel-header>div{display:flex;align-items:baseline;gap:12px}.audience-panel-kicker{color:var(--muted);font:700 10px/1.2 "Space Mono",monospace;letter-spacing:.08em;text-transform:uppercase}.audience-panel-title{font:800 17px/1.2 "Poppins",sans-serif;letter-spacing:-.025em}.audience-panel-count{padding:6px 9px;border-radius:999px;background:#fef9c3;color:#854d0e;font:700 10px/1.2 "Space Mono",monospace;letter-spacing:.05em}.audience-panel-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0}.audience-step{position:relative;min-width:0;padding:27px 24px 25px;border:0;border-right:1px solid var(--line);border-radius:0;background:var(--surface)}.audience-step:last-child{border-right:0}.audience-step:not(:last-child):after{content:"→";position:absolute;right:-11px;top:31px;z-index:1;display:grid;place-items:center;width:22px;height:22px;border:1px solid #d9e1e1;border-radius:50%;background:var(--surface);color:var(--cyan-deep);font-size:14px}.audience-step-top{display:flex;align-items:center;justify-content:space-between;gap:12px}.audience-step-number{width:34px;height:34px;border-radius:10px;font-size:11px}.audience-step-label{color:var(--muted);font:700 9px/1.2 "Space Mono",monospace;letter-spacing:.1em;text-transform:uppercase}.audience-step h3{margin:20px 0 8px;font-size:20px;line-height:1.2}.audience-step p{min-height:68px;font-size:13px;line-height:1.55}.audience-code-wrap{position:relative;margin-top:20px}.audience-code{min-height:92px;margin:0;padding:15px 44px 15px 15px;border:1px solid #35353a;border-radius:12px;background:#1d1d22;color:#f5f5f5;font-size:11px;line-height:1.7}.audience-copy{position:absolute;top:9px;right:9px;min-height:29px;padding:5px 8px;border:1px solid #55555c;border-radius:7px;background:#303037;color:#fff;font:700 9px/1.2 "Space Mono",monospace;letter-spacing:.03em}.audience-copy:hover{border-color:var(--cyan);color:#a5f3fc}.audience-panel-footer{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:17px 24px;border-top:1px solid var(--line);background:#fbfdfd;color:var(--muted);font-size:12px}.audience-panel-footer strong{color:var(--body)}.audience-cta{margin-top:0;color:var(--fuchsia-active);font-size:12px}.audience-note{margin:0;padding:0;border:0;background:transparent;font-size:12px}.audience-note strong{color:var(--ink)}
@media(max-width:900px){.audience-heading-layout{align-items:flex-start;flex-direction:column;gap:22px}.audience-heading-note{max-width:420px}.audience-panel-grid{grid-template-columns:1fr}.audience-step{border-right:0;border-bottom:1px solid var(--line)}.audience-step:last-child{border-bottom:0}.audience-step:not(:last-child):after{content:"↓";right:24px;top:auto;bottom:-11px}.audience-step p{min-height:0}.audience-step h3{margin-top:15px}}
@media(max-width:720px){.audience-section{padding-top:68px;padding-bottom:74px}.audience-section .section-heading h2{font-size:38px}.audience-section .section-heading p{font-size:16px}.audience-tabs{display:flex;width:100%;margin-top:27px}.audience-tab{flex:1;padding-left:10px;padding-right:10px}.audience-panel{border-radius:14px}.audience-panel-header{align-items:flex-start;flex-direction:column;gap:10px;padding:17px 18px}.audience-panel-header>div{align-items:flex-start;flex-direction:column;gap:6px}.audience-step{padding:22px 18px}.audience-panel-footer{align-items:flex-start;flex-direction:column;padding:16px 18px}.audience-code{font-size:10px}}
`;
const HERO_MESH_STYLE = `
.site-nav{position:absolute;top:0;left:0;right:0;background:linear-gradient(180deg,rgba(6,7,14,.78),rgba(6,7,14,0));border-bottom:1px solid rgba(255,255,255,.13);z-index:10}.site-nav .brand-word,.site-nav .nav-links{color:#fff}.site-nav .nav-links>a:not(.nav-cta):hover{color:var(--cyan)}.site-nav .nav-cta{background:#fff;color:#15151c;box-shadow:none}.site-nav .nav-cta:hover{background:#dffaff;color:#15151c;box-shadow:0 8px 24px rgba(34,211,238,.24)}
.hero{position:relative;display:flex;align-items:center;width:100%;max-width:none;min-height:100svh;padding:128px 0 78px;overflow:hidden;background:#080910;color:#fff;isolation:isolate}.hero .container{position:relative;z-index:2}.hero .shader-canvas{z-index:-2;opacity:1}.hero:before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,rgba(7,8,16,.96) 0%,rgba(7,8,16,.74) 30%,rgba(7,8,16,.18) 70%,rgba(7,8,16,.38) 100%);pointer-events:none}.hero:after{content:"";position:absolute;inset:0;z-index:-1;opacity:.2;background-image:linear-gradient(rgba(255,255,255,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.18) 1px,transparent 1px);background-size:72px 72px;mask-image:linear-gradient(90deg,rgba(0,0,0,.8),transparent 72%);pointer-events:none}.hero-inner{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(340px,.92fr);gap:80px;align-items:center}.hero-copy{max-width:700px}.hero-copy .eyebrow{color:rgba(255,255,255,.74)}.hero-copy .eyebrow-dot{background:var(--cyan);box-shadow:0 0 0 4px rgba(34,211,238,.19)}.hero h1{margin:24px 0 24px;color:#fff;font-size:clamp(58px,8vw,112px);line-height:.96;letter-spacing:-.075em;text-wrap:balance}.hero h1 span{color:#aeb2c4}.hero-copy>p{max-width:560px;color:rgba(255,255,255,.76);font-size:20px;line-height:1.5}.hero .button-primary{background:var(--cyan);color:#071014;box-shadow:0 12px 34px rgba(34,211,238,.2)}.hero .button-primary:hover{background:#67e8f9;color:#071014}.hero .button-secondary{border-color:rgba(255,255,255,.5);color:#fff}.hero .button-secondary:hover{background:rgba(255,255,255,.1);color:#fff}.hero-meta{color:rgba(255,255,255,.6)}.hero-meta .meta-chip{background:rgba(250,204,21,.16);color:#fde68a;border:1px solid rgba(250,204,21,.24)}.hero-signal{position:relative;min-height:470px;padding:28px;border:1px solid rgba(255,255,255,.24);border-radius:28px;background:linear-gradient(145deg,rgba(10,11,22,.2),rgba(10,11,22,.64));box-shadow:0 30px 90px rgba(0,0,0,.28),inset 0 1px rgba(255,255,255,.1);backdrop-filter:blur(8px);overflow:hidden}.hero-signal:before,.hero-signal:after{content:"";position:absolute;border:1px solid rgba(34,211,238,.35);border-radius:50%;pointer-events:none}.hero-signal:before{width:430px;height:430px;right:-130px;bottom:-120px;box-shadow:0 0 0 38px rgba(34,211,238,.035),0 0 0 76px rgba(34,211,238,.025)}.hero-signal:after{width:250px;height:250px;right:-42px;bottom:-28px;border-color:rgba(250,204,21,.3)}.hero-signal .art-topline,.hero-signal .art-foot{z-index:2}.hero-signal .art-center-copy{top:137px;left:30px;z-index:2}.hero-signal .art-center-copy h2{font-size:50px}.hero-signal .manifest-float{top:100px;right:24px;z-index:3;background:rgba(255,255,255,.94)}.hero-signal .art-foot{bottom:24px}.signal-pulse{position:absolute;right:116px;bottom:106px;width:10px;height:10px;border-radius:50%;background:var(--cyan);box-shadow:0 0 0 10px rgba(34,211,238,.12),0 0 34px 12px rgba(34,211,238,.32);animation:signal-pulse 2.4s ease-in-out infinite}.signal-pulse:after{content:"";position:absolute;inset:-32px;border:1px solid rgba(34,211,238,.25);border-radius:50%;animation:signal-ring 2.4s ease-out infinite}@keyframes signal-pulse{0%,100%{transform:scale(.85);opacity:.72}50%{transform:scale(1.2);opacity:1}}@keyframes signal-ring{0%{transform:scale(.55);opacity:.7}100%{transform:scale(1.25);opacity:0}}
@media(max-width:1040px){.hero{padding-top:116px}.hero-inner{grid-template-columns:1fr;gap:42px}.hero-copy{max-width:760px}.hero-signal{max-width:760px;width:100%;min-height:430px}}
@media(max-width:720px){.site-nav{background:linear-gradient(180deg,rgba(6,7,14,.9),rgba(6,7,14,0))}.hero{align-items:flex-start;min-height:100svh;padding-top:116px;padding-bottom:52px}.hero-inner{gap:38px}.hero h1{font-size:clamp(52px,15vw,76px)}.hero-copy>p{font-size:18px}.hero-signal{min-height:370px;padding:18px;border-radius:20px}.hero-signal .art-topline,.hero-signal .art-foot{left:18px;right:18px}.hero-signal .art-center-copy{top:105px;left:20px}.hero-signal .art-center-copy h2{font-size:36px}.hero-signal .manifest-float{top:72px;right:16px;width:196px;padding:14px}.hero-signal .art-foot{bottom:18px}.signal-pulse{right:75px;bottom:90px}.hero:after{background-size:48px 48px}}
@media(prefers-reduced-motion:reduce){.signal-pulse,.signal-pulse:after{animation:none}}
`;
const AUDIENCE_SCRIPT = String.raw`
(function () {
  const tabs = Array.from(document.querySelectorAll("[data-audience-tab]"));
  const panels = Array.from(document.querySelectorAll("[data-audience-panel]"));
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const selected = tab.getAttribute("data-audience-tab");
      tabs.forEach((candidate) => {
        candidate.setAttribute(
          "aria-selected",
          candidate.getAttribute("data-audience-tab") === selected ? "true" : "false",
        );
      });
      panels.forEach((panel) => {
        panel.hidden = panel.getAttribute("data-audience-panel") !== selected;
      });
    });
  });
  const copyButtons = Array.from(document.querySelectorAll("[data-copy-target]"));
  copyButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const target = document.getElementById(button.getAttribute("data-copy-target"));
      if (!target) return;
      const originalLabel = button.textContent;
      try {
        await navigator.clipboard.writeText(target.textContent);
        button.textContent = "Copied";
      } catch {
        button.textContent = "Select code";
      }
      window.setTimeout(() => { button.textContent = originalLabel; }, 1600);
    });
  });
})();
`;
const SHADER_SCRIPT = String.raw`
(function () {
  const canvas = document.querySelector("[data-reentry-mesh]");
  if (!canvas) return;
  const gl = canvas.getContext("webgl", { alpha: false, antialias: true });
  if (!gl) return;

  const vertexSource = [
    "attribute vec2 a_position;",
    "varying vec2 v_uv;",
    "void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}"
  ].join("\n");
  const fragmentSource = [
    "precision mediump float;",
    "uniform float u_time;",
    "uniform vec2 u_resolution;",
    "varying vec2 v_uv;",
    "float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
    "float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}",
    "float fbm(vec2 p){float value=0.;float amplitude=.5;for(int i=0;i<4;i++){value+=amplitude*noise(p);p=p*2.02+vec2(17.1,9.2);amplitude*=.5;}return value;}",
    "void main(){",
    "vec2 uv=v_uv;vec2 p=(gl_FragCoord.xy-.5*u_resolution.xy)/min(u_resolution.x,u_resolution.y);float t=u_time*.22;",
    "float n=fbm(p*2.4+vec2(t,-t*.65));float ribbon=sin((p.x*3.2+p.y*2.2+n*2.)+t*2.4);",
    "float cyanField=smoothstep(.72,.98,1.-length(p-vec2(-.38,.18+n*.08)));",
    "float yellowField=smoothstep(.7,.98,1.-length(p-vec2(.42,-.18+n*.08)));",
    "float gridX=1.-smoothstep(0.,.035,abs(fract((p.x+sin(p.y*2.2+t)*.08+n*.12)*4.8)-.5));",
    "float gridY=1.-smoothstep(0.,.035,abs(fract((p.y+sin(p.x*1.7-t)*.08-n*.12)*4.2)-.5));",
    "float wire=max(gridX,gridY);",
    "vec3 ink=vec3(.055,.045,.07);vec3 cyan=vec3(.03,.55,.68);vec3 yellow=vec3(.9,.57,.05);",
    "vec3 color=mix(ink,cyan,cyanField*.78);color=mix(color,yellow,yellowField*.72);color+=vec3(.11,.07,.13)*smoothstep(-.2,.8,ribbon);",
    "color+=vec3(.04,.2,.23)*wire*.34;color+=vec3(.2,.11,.02)*gridX*.13;color*=.84+.16*(1.-length(p)*.45);",
    "gl_FragColor=vec4(color,1.);",
    "}"
  ].join("\n");

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertexShader = compile(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) return;
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 1, -1, -1, 1,
    -1, 1, 1, -1, 1, 1
  ]), gl.STATIC_DRAW);

  const position = gl.getAttribLocation(program, "a_position");
  const time = gl.getUniformLocation(program, "u_time");
  const resolution = gl.getUniformLocation(program, "u_resolution");
  gl.useProgram(program);
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  let frameId = 0;
  let visible = true;
  const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
    const height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
  }

  function draw(now) {
    if (!visible) return;
    resize();
    gl.uniform1f(time, reducedMotion ? 0 : now * .001);
    gl.uniform2f(resolution, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    if (!reducedMotion) frameId = requestAnimationFrame(draw);
  }

  const observer = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        if (visible && !reducedMotion && !frameId) frameId = requestAnimationFrame(draw);
        if (!visible && frameId) {
          cancelAnimationFrame(frameId);
          frameId = 0;
        }
      }, { threshold: .05 })
    : null;
  if (observer) observer.observe(canvas);
  window.addEventListener("resize", resize, { passive: true });
  resize();
  draw(performance.now());
})();
`;

const PRODUCT_STYLE = `
:root{color-scheme:dark;--paper:#f5f4ed;--muted:#aaa99f;--line:rgba(255,255,255,.16);--cyan:#7ee7f2;--lime:#b8f28d;--ink:#080a0b}*{box-sizing:border-box}html{background:var(--ink);scroll-behavior:smooth}body{margin:0;background:var(--ink);color:var(--paper);font:15px/1.5 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}a{color:inherit;text-decoration:none}:focus-visible{outline:3px solid rgba(126,231,242,.45);outline-offset:4px}.page{position:relative;min-height:100svh;overflow:hidden;isolation:isolate}.mesh{position:absolute;inset:0;z-index:-3;width:100%;height:100%;opacity:.96}.page:before{position:absolute;inset:0;z-index:-2;background:linear-gradient(90deg,rgba(6,8,9,.97) 0%,rgba(6,8,9,.78) 46%,rgba(6,8,9,.2) 78%,rgba(6,8,9,.55) 100%);content:""}.page:after{position:absolute;inset:0;z-index:-1;background-image:linear-gradient(rgba(255,255,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.07) 1px,transparent 1px);background-size:74px 74px;mask-image:linear-gradient(90deg,#000,transparent 78%);content:""}.shell{width:min(1380px,100%);margin:0 auto;padding-inline:clamp(22px,5vw,72px)}.nav{display:flex;align-items:center;justify-content:space-between;height:78px;border-bottom:1px solid var(--line)}.wordmark{font-size:21px;font-weight:720;letter-spacing:-.06em}.nav-links{display:flex;align-items:center;gap:26px;color:rgba(245,244,237,.72);font-size:13px;font-weight:650}.nav-links a:hover{color:var(--paper)}.nav-links .nav-cta{padding:10px 16px;border-radius:999px;background:var(--paper);color:#0b0c0c}.hero{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(330px,.75fr);gap:clamp(46px,7vw,110px);align-items:center;min-height:calc(100svh - 78px);padding-block:clamp(56px,8vh,96px)}.kicker{display:flex;align-items:center;gap:10px;color:rgba(245,244,237,.67);font:700 10px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.13em;text-transform:uppercase}.kicker:before{width:8px;height:8px;border-radius:50%;background:var(--cyan);box-shadow:0 0 0 7px rgba(126,231,242,.08),0 0 28px rgba(126,231,242,.55);content:""}.hero h1{max-width:850px;margin:24px 0 26px;font-size:clamp(64px,9vw,134px);font-weight:720;line-height:.88;letter-spacing:-.085em;text-wrap:balance}.hero h1 span{display:block;color:rgba(245,244,237,.49)}.hero-copy>p{max-width:560px;margin:0;color:rgba(245,244,237,.7);font-size:clamp(17px,2vw,21px);line-height:1.5}.actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:32px}.button{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 20px;border:1px solid var(--line);border-radius:999px;font-weight:720;transition:transform .18s ease,background .18s ease,border-color .18s ease}.button:hover{transform:translateY(-2px);border-color:rgba(255,255,255,.36);background:rgba(255,255,255,.07)}.button.primary{border-color:var(--cyan);background:var(--cyan);color:#061013}.button.primary:hover{background:#a7f3fa}.signal{position:relative;min-height:440px;padding:28px;border:1px solid rgba(255,255,255,.24);border-radius:26px;background:linear-gradient(145deg,rgba(9,11,12,.22),rgba(9,11,12,.72));box-shadow:0 30px 100px rgba(0,0,0,.28);backdrop-filter:blur(12px)}.signal-head,.signal-foot{display:flex;align-items:center;justify-content:space-between;color:rgba(245,244,237,.55);font:700 10px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em}.live{display:flex;align-items:center;gap:7px;color:var(--cyan)}.live:before{width:6px;height:6px;border-radius:50%;background:var(--cyan);box-shadow:0 0 18px var(--cyan);content:""}.signal-body{display:flex;min-height:330px;flex-direction:column;justify-content:center}.signal-body>span{color:var(--lime);font:700 10px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em}.signal h2{max-width:320px;margin:15px 0 12px;font-size:clamp(40px,5vw,64px);line-height:.96;letter-spacing:-.06em}.signal p{max-width:270px;margin:0;color:rgba(245,244,237,.62);font-size:14px}.route{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;margin-top:28px;border:1px solid var(--line);border-radius:16px;background:var(--line);overflow:hidden}.route div{padding:16px;background:rgba(8,10,11,.86)}.route small,.route strong{display:block}.route small{color:rgba(245,244,237,.42);font:700 9px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.11em}.route strong{margin-top:7px;font-size:12px}.signal-foot{padding-top:20px;border-top:1px solid var(--line)}.signal-foot span:last-child{color:var(--lime)}.fineprint{position:absolute;right:clamp(22px,5vw,72px);bottom:22px;color:rgba(245,244,237,.38);font-size:11px}@media(max-width:900px){.hero{grid-template-columns:1fr;min-height:auto}.signal{max-width:680px}.fineprint{position:static;padding-bottom:22px}.page{min-height:100svh}}@media(max-width:620px){.nav{height:68px}.nav-links>a:not(.nav-cta){display:none}.hero{padding-block:46px}.hero h1{font-size:clamp(58px,18vw,84px)}.signal{min-height:370px;padding:21px;border-radius:20px}.signal-body{min-height:270px}.route{grid-template-columns:1fr}.route div{padding:12px 14px}.actions{align-items:stretch;flex-direction:column}.button{width:100%}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.button{transition:none}}
`;

export function renderLanding() {
  const body = `
<div class="page">
  <canvas class="mesh" data-reentry-mesh aria-hidden="true"></canvas>
  <header class="shell nav">
    <a class="wordmark" href="/" aria-label="Re-entry home">re-entry</a>
    <nav class="nav-links" aria-label="Primary navigation">
      <a href="/docs">Developers</a>
      <a href="/login">Log in</a>
      <a class="nav-cta" href="/register">Create account</a>
    </nav>
  </header>
  <main class="shell hero">
    <section class="hero-copy" aria-labelledby="hero-title">
      <div class="kicker">Return infrastructure for agentic software</div>
      <h1 id="hero-title">Work can <span>come back.</span></h1>
      <p>Pause a workflow. Ask once. Re-entry delivers the approved next step to Codex when it is ready.</p>
      <div class="actions">
        <a class="button primary" href="/register">Start with Re-entry</a>
        <a class="button" href="/docs">See the protocol</a>
      </div>
    </section>
    <aside class="signal" aria-label="Re-entry connection flow">
      <div class="signal-head"><span>RE-ENTRY / LIVE PATH</span><span class="live">CONNECTED</span></div>
      <div class="signal-body">
        <span>ONE APPROVED RETURN</span>
        <h2>The thread is ready again.</h2>
        <p>Your Host keeps the business truth. Re-entry keeps consent and delivery. Codex opens locally.</p>
        <div class="route" aria-label="Host to Re-entry to Codex">
          <div><small>01 / HOST</small><strong>Signs</strong></div>
          <div><small>02 / RE-ENTRY</small><strong>Asks + routes</strong></div>
          <div><small>03 / CODEX</small><strong>Continues</strong></div>
        </div>
      </div>
      <div class="signal-foot"><span>OUTBOUND CONNECTOR</span><span>READY</span></div>
    </aside>
  </main>
  <div class="fineprint">Independent preview · not an official OpenAI product</div>
</div>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#080a0b"><meta name="description" content="Re-entry routes approved web workflow continuations back to a local Codex agent."><title>Re-entry — work can come back</title><style>${PRODUCT_STYLE}</style></head><body>${body}<script>${SHADER_SCRIPT}</script></body></html>`;
}
