import Image from "next/image";
import Link from "next/link";

import styles from "./judge-guide.module.css";

export const metadata = {
  title: "OpenAI-WebMCP-Challenge-Judge-Guide | Sleepless Kingdom",
  description:
    "A judge-first walkthrough of Sleepless Kingdom, the Re-entry vision, and the WebMCP path.",
};

const quickStart = [
  {
    number: "01",
    label: "LOCAL CONNECTOR",
    title: "Install the bridge",
    copy:
      "On the Mac where Codex should return, install the current preview CLI. Use Node 24+ and keep the package README beside you for its compatibility note.",
    code: "npx --yes @4xeoz/re-entry install",
    link: {
      label: "Open the install guide",
      href: "https://github.com/Alex0158/OpenAI-Web-MCP-Challenge/blob/main/runtime/local-connector/README.md",
    },
  },
  {
    number: "02",
    label: "MANIFEST → CONSENT",
    title: "Get the signed Manifest",
    copy:
      "In the Host flow, create the signed Manifest, review what the later return may do, approve the connected Mac, and keep the opaque binding on the Host.",
    link: {
      label: "Read the Host SDK flow",
      href: "https://github.com/Alex0158/OpenAI-Web-MCP-Challenge/tree/main/runtime/host-sdk",
    },
  },
  {
    number: "03",
    label: "CANONICAL GAME PAGE",
    title: "Open one shared world",
    copy:
      "Sign in as a demo player, keep the second player visible, and read the shelter, mission, and world-time panels before choosing a mission.",
    link: { label: "Open Sleepless Kingdom", href: "/" },
  },
  {
    number: "04",
    label: "OBSERVE → RETURN",
    title: "Leave one clear trace",
    copy:
      "Assign a gatherer to Wood or Rock, leave the page, and let the world continue. A meaningful event becomes one bounded signal; the Agent rereads current state before acting.",
    link: undefined,
  },
] as const;

const judgePath = [
  {
    number: "01",
    title: "Start at the shelter",
    copy: "Read the server-owned snapshot: shelter, soldiers, nearby resources, and world time.",
    tag: "Human view",
  },
  {
    number: "02",
    title: "Give one soldier a job",
    copy: "Assign a gatherer to Wood or Rock. The role fixes the tool, route, and return rule.",
    tag: "One clear choice",
  },
  {
    number: "03",
    title: "Let the world move",
    copy: "Leave the page. The server keeps advancing the world, moving the soldier, and recording change.",
    tag: "Persistent world",
  },
  {
    number: "04",
    title: "Read the cause",
    copy: "A seeded monster encounter can destroy exposed cargo. The event history keeps the why visible.",
    tag: "Causal event",
  },
  {
    number: "05",
    title: "Watch the Agent return",
    copy: "One coalesced signal points the Agent back to the same context. It reads fresh state before deciding.",
    tag: "Re-entry",
  },
];

const tools = [
  ["inspect_shelter_state", "Read", "Current shelter, coins, resources, and world time."],
  ["inspect_client_snapshot", "Read", "The player-scoped snapshot used by the page."],
  ["inspect_missions", "Read", "Role, route, cargo, risk, and next mission state."],
  ["inspect_mission_history", "Read", "The bounded causal record behind the signal."],
  ["force_recall_soldier", "Action", "A server-checked recall when the live revision permits it."],
] as const;

const boundaries = [
  {
    title: "The server owns truth",
    copy: "World time, position, mission state, cargo, combat, settlement, and player scope stay on the Game server.",
    tone: "green",
  },
  {
    title: "The Agent gets context",
    copy: "The Agent receives a bounded signal and rereads the authenticated page. It may choose a safe action or do nothing.",
    tone: "lime",
  },
  {
    title: "The player keeps consequence",
    copy: "Migration, siege, upgrades, and other consequential choices remain visible human decisions with normal server checks.",
    tone: "blue",
  },
] as const;

export default function OpenAIWebMCPChallengeJudgeGuidePage() {
  return (
    <main className={styles.guidePage}>
      <div className={styles.grain} aria-hidden="true" />

      <header className={styles.nav}>
        <Link className={styles.brand} href="/" aria-label="Return to Sleepless Kingdom">
          <Image src="/icon.svg" alt="" width={42} height={42} priority />
          <span>
            <small>OpenAI WebMCP Challenge</small>
            <strong>Sleepless Kingdom</strong>
          </span>
        </Link>
        <nav className={styles.navLinks} aria-label="Guide sections">
          <a href="#start-here">Start here</a>
          <a href="#vision">Vision</a>
          <a href="#video">Video</a>
          <a href="#judge-path">Game path</a>
          <a href="#mini-apps">Mini apps</a>
        </nav>
        <span className={styles.navStatus}>
          <span className={styles.statusDot} aria-hidden="true" />
          Judge briefing
        </span>
      </header>

      <section className={styles.hero} aria-labelledby="guide-title">
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>OpenAI-WebMCP-Challenge / Judge guide</p>
          <h1 id="guide-title">
            See the world move.
            <br />
            <em>See the Agent return.</em>
          </h1>
          <p className={styles.heroLead}>
            A judge-first path through Sleepless Kingdom and our Re-entry vision: one persistent
            world, one meaningful signal, and a return to the work that already has context.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primaryButton} href="#start-here">
              Start the judge path
              <span aria-hidden="true">↓</span>
            </a>
            <Link className={styles.secondaryButton} href="/game-tutorial">
              How to play with an Agent
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className={styles.heroNote}>
            <span className={styles.heroNoteMark}>01</span>
            <span>Two players · one shared world · a bounded return to context.</span>
          </div>
        </div>

        <div className={styles.heroVisual} aria-label="A visual summary of the game to Agent signal path">
          <div className={styles.visualTopline}>
            <span>LIVE WORLD / SIGNAL TRACE</span>
            <span>WORLD TIME 042</span>
          </div>
          <div className={styles.mapField} aria-hidden="true">
            <div className={styles.mapGrid} />
            <div className={`${styles.mapNode} ${styles.shelterNode}`}>
              <span className={styles.nodeIcon}>⌂</span>
              <span>SHELTER</span>
            </div>
            <div className={`${styles.mapNode} ${styles.soldierNode}`}>
              <span className={styles.nodeIcon}>◆</span>
              <span>GATHERER</span>
            </div>
            <div className={`${styles.mapNode} ${styles.monsterNode}`}>
              <span className={styles.nodeIcon}>✦</span>
              <span>MONSTER</span>
            </div>
            <div className={styles.routeLine} />
            <div className={styles.eventPulse} />
            <div className={styles.cargoLoss}>CARGO LOST / EVENT 014</div>
          </div>
          <div className={styles.signalCard}>
            <div className={styles.signalHeader}>
              <span className={styles.signalLive}>SIGNAL READY</span>
              <span>COALESCED</span>
            </div>
            <strong>CargoLostToMonster</strong>
            <p>Read the latest shelter state before choosing the next bounded step.</p>
            <div className={styles.signalFooter}>
              <span>same context</span>
              <span>fresh reads</span>
              <span>human boundary</span>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.proofStrip} id="proof" role="list" aria-label="Core ideas">
        <span role="listitem"><b>01</b> Persistent world</span>
        <span role="listitem"><b>02</b> Causal events</span>
        <span role="listitem"><b>03</b> Contextual re-entry</span>
        <span role="listitem"><b>04</b> Human consequence</span>
      </div>

      <section className={`${styles.contentSection} ${styles.startSection}`} id="start-here" aria-labelledby="start-title">
        <div className={styles.sectionIntro}>
          <p className={styles.sectionIndex}>START HERE / FOUR MOVES</p>
          <h2 id="start-title">The shortest route from setup to proof.</h2>
          <p>
            Follow this order when you are judging the submission. It separates the connector and
            consent setup from the game story, so every visible step has a clear purpose.
          </p>
        </div>
        <div className={styles.quickStartGrid}>
          {quickStart.map((step) => (
            <article className={styles.quickStartCard} key={step.number}>
              <div className={styles.quickStartTopline}>
                <span className={styles.stepNumber}>{step.number}</span>
                <span>{step.label}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
              {"code" in step ? <code className={styles.installCommand}>{step.code}</code> : null}
              {step.link ? (
                step.link.href.startsWith("/") ? (
                  <Link className={styles.inlineLink} href={step.link.href}>{step.link.label} ↗</Link>
                ) : (
                  <a className={styles.inlineLink} href={step.link.href} target="_blank" rel="noreferrer">
                    {step.link.label} ↗
                  </a>
                )
              ) : null}
            </article>
          ))}
        </div>
        <p className={styles.claimNote}>
          Connector package and external Agent activation are preview boundaries; use the linked
          README and the final hosted rehearsal to confirm the exact release before judging.
        </p>
      </section>

      <section className={`${styles.contentSection} ${styles.visionSection}`} id="vision" aria-labelledby="vision-title">
        <div className={styles.visionHeader}>
          <p className={styles.sectionIndex}>THE RE-ENTRY VISION</p>
          <h2 id="vision-title">When the page closes, the work stays alive.</h2>
          <p>
            Web apps usually stop at the page boundary. Our design keeps the business event on the
            server, carries only the useful context across the gap, and gives the Agent a safe way
            back into the page that owns the work.
          </p>
        </div>
        <div className={styles.visionGrid}>
          <article>
            <span>THE PROBLEM</span>
            <h3>Context disappears between turns.</h3>
            <p>Background work continues, but a new session has to rediscover what happened and what is safe.</p>
          </article>
          <article>
            <span>THE MECHANISM</span>
            <h3>Event → signal → fresh page read.</h3>
            <p>Durable domain events are coalesced into one bounded signal; the Agent rereads current state before action.</p>
          </article>
          <article>
            <span>THE ADVANTAGE</span>
            <h3>Useful autonomy with a visible boundary.</h3>
            <p>The server keeps authority, the Agent gets the right context, and the player keeps consequential choices.</p>
          </article>
        </div>
        <div className={styles.visionLoop} aria-label="Re-entry loop">
          <span>business event</span>
          <b aria-hidden="true">→</b>
          <span>coalesced signal</span>
          <b aria-hidden="true">→</b>
          <span>existing Agent task</span>
          <b aria-hidden="true">→</b>
          <span>fresh WebMCP reads</span>
        </div>
      </section>

      <section className={`${styles.contentSection} ${styles.videoSection}`} id="video" aria-labelledby="video-title">
        <div className={styles.videoIntro}>
          <p className={styles.sectionIndex}>WATCH THE STORY</p>
          <h2 id="video-title">See the idea before you inspect the details.</h2>
          <p>
            This short video is the fast orientation. The rest of this page gives the exact judge
            path, boundaries, and links needed to reproduce the meaningful parts.
          </p>
        </div>
        <div className={styles.videoGrid}>
          <div className={styles.videoFrame}>
            <iframe
              src="https://www.youtube-nocookie.com/embed/lovFAAftKeU?rel=0"
              title="REENTRY x OpenAI — WebMCP challenge"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          <div className={styles.videoCard}>
            <span className={styles.cardEyebrow}>REENTRY × OPENAI</span>
            <h3>A return path for work that outlives a browser turn.</h3>
            <p>
              Keep the video open while you follow the four setup moves above, then use the game
              path below to see the same idea inside a living world.
            </p>
            <a className={styles.inlineLink} href="https://youtu.be/lovFAAftKeU" target="_blank" rel="noreferrer">
              Open on YouTube ↗
            </a>
          </div>
        </div>
      </section>

      <section className={`${styles.contentSection} ${styles.flowSection}`} id="flow" aria-labelledby="flow-title">
        <div className={styles.sectionIntro}>
          <p className={styles.sectionIndex}>ONE CAUSAL CHAIN</p>
          <h2 id="flow-title">The notification is a bridge, not a second game.</h2>
          <p>
            The Game remains authoritative. Re-entry Core carries verified context across the gap,
            so the Agent can return without turning every backend event into a message.
          </p>
        </div>
        <div className={styles.flowRail} aria-label="Game to WebMCP flow">
          <div className={styles.flowNode}><span>01</span><strong>Game</strong><small>World state changes</small></div>
          <span className={styles.flowArrow} aria-hidden="true">→</span>
          <div className={styles.flowNode}><span>02</span><strong>Event log</strong><small>Why it happened</small></div>
          <span className={styles.flowArrow} aria-hidden="true">→</span>
          <div className={`${styles.flowNode} ${styles.flowNodeAccent}`}><span>03</span><strong>Re-entry signal</strong><small>One bounded wake</small></div>
          <span className={styles.flowArrow} aria-hidden="true">→</span>
          <div className={styles.flowNode}><span>04</span><strong>Existing Agent task</strong><small>Same context</small></div>
          <span className={styles.flowArrow} aria-hidden="true">→</span>
          <div className={`${styles.flowNode} ${styles.flowNodeFinal}`}><span>05</span><strong>WebMCP page</strong><small>Fresh reads first</small></div>
        </div>
      </section>

      <section className={`${styles.contentSection} ${styles.judgeSection}`} id="judge-path" aria-labelledby="judge-path-title">
        <div className={styles.sectionIntro}>
          <p className={styles.sectionIndex}>THE GAME PATH / THREE MINUTES</p>
          <h2 id="judge-path-title">Follow one soldier through a world that does not pause.</h2>
          <p>
            This is the smallest meaningful game story: create a mission, leave the page, return to
            a changed world, and let the Agent decide from current evidence.
          </p>
        </div>
        <ol className={styles.journeyList}>
          {judgePath.map((step) => (
            <li className={styles.journeyItem} key={step.number}>
              <span className={styles.stepNumber}>{step.number}</span>
              <div className={styles.stepBody}>
                <div className={styles.stepHeading}><h3>{step.title}</h3><span>{step.tag}</span></div>
                <p>{step.copy}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className={styles.judgeAction}>
          <p>Need the controls, roles, and Agent prompt in one place?</p>
          <Link className={styles.secondaryButton} href="/game-tutorial">Open the gameplay guide <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <section className={`${styles.contentSection} ${styles.miniAppsSection}`} id="mini-apps" aria-labelledby="mini-apps-title">
        <div className={styles.sectionIntro}>
          <p className={styles.sectionIndex}>MORE RE-ENTRY SURFACES</p>
          <h2 id="mini-apps-title">Explore the SDK Playground.</h2>
          <p>
            This small surface lets a judge see that Re-entry is a reusable continuity pattern,
            not a game-only trick. Click the image to enter the playground.
          </p>
        </div>
        <div className={styles.miniAppsGrid}>
          <article className={styles.miniAppCard}>
            <a
              className={styles.miniAppImageLink}
              href="https://reentry-sdk-playground.vercel.app/"
              target="_blank"
              rel="noreferrer"
              aria-label="Open the Re-entry SDK Playground"
            >
              <Image
                className={styles.miniAppImage}
                src="/mini-apps/reentry-sdk-playground-preview.svg"
                alt="Re-entry SDK Playground preview showing an event, a signal, and a return to context"
                width={1400}
                height={820}
              />
              <span className={styles.miniAppImageOverlay}><span>OPEN PLAYGROUND</span><strong>↗</strong></span>
            </a>
            <div className={styles.miniAppBody}>
              <div className={styles.miniAppMeta}><span>OTHER MINI APPLICATION</span><span>RE-ENTRY TEST</span></div>
              <h3>Re-entry SDK Playground</h3>
              <p>Other mini application that tests our Re-entry across small, focused workflows.</p>
              <a className={styles.inlineLink} href="https://reentry-sdk-playground.vercel.app/" target="_blank" rel="noreferrer">Enter the playground ↗</a>
            </div>
          </article>
        </div>
        <p className={styles.miniAppsNote}>A focused external surface for testing the Re-entry loop.</p>
      </section>

      <section className={`${styles.contentSection} ${styles.toolsSection}`} id="tools" aria-labelledby="tools-title">
        <div className={styles.toolsIntro}>
          <p className={styles.sectionIndex}>THE PAGE SURFACE</p>
          <h2 id="tools-title">Read first. Decide second. Act inside the rules.</h2>
          <p>The Agent sees a small, purposeful tool surface. Each result is scoped to the signed-in player and checked against the latest server revision.</p>
        </div>
        <div className={styles.toolBoard}>
          <div className={styles.toolBoardHeader}><span>CANONICAL GAME PAGE</span><span className={styles.toolBoardBadge}>SCOPED TO PLAYER</span></div>
          <div className={styles.toolList}>
            {tools.map(([name, type, description]) => (
              <div className={styles.toolRow} key={name}><code>{name}</code><span className={type === "Read" ? styles.readTag : styles.actionTag}>{type}</span><p>{description}</p></div>
            ))}
          </div>
          <div className={styles.toolBoardFooter}><span>Unknown scope → typed rejection</span><span>Stale revision → reread</span><span>No action → valid outcome</span></div>
        </div>
      </section>

      <section className={`${styles.contentSection} ${styles.boundarySection}`} id="boundaries" aria-labelledby="boundaries-title">
        <div className={styles.sectionIntro}>
          <p className={styles.sectionIndex}>WHO IS IN CONTROL</p>
          <h2 id="boundaries-title">Useful autonomy with visible limits.</h2>
          <p>Re-entry is valuable because the Agent can make sense of a changed world. It stays trustworthy because each layer keeps a narrow responsibility.</p>
        </div>
        <div className={styles.boundaryGrid}>
          {boundaries.map((boundary, index) => (
            <article className={`${styles.boundaryCard} ${styles[boundary.tone]}`} key={boundary.title}>
              <span className={styles.boundaryNumber}>0{index + 1}</span>
              <h3>{boundary.title}</h3>
              <p>{boundary.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={`${styles.contentSection} ${styles.trySection}`} aria-labelledby="try-title">
        <div className={styles.tryCopy}>
          <p className={styles.sectionIndex}>OPTIONAL AGENT PROMPT</p>
          <h2 id="try-title">Give the Agent a question, not a script.</h2>
          <p>Start with a read-only question. Keep the consequence boundary visible while the Agent rebuilds context.</p>
        </div>
        <div className={styles.promptCard}>
          <div className={styles.promptBar}><span>SAFE FIRST READ</span><span>NO COMMAND YET</span></div>
          <p>Read the current shelter state, inspect recent mission history and the latest re-entry event, then explain whether recalling a soldier is safe. Do not issue a consequential command without human confirmation.</p>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <Image src="/icon.svg" alt="" width={32} height={32} />
          <div><strong>Sleepless Kingdom</strong><span>OpenAI-WebMCP-Challenge-Judge-Guide</span></div>
        </div>
        <div className={styles.footerLinks}>
          <Link href="/">Game home</Link>
          <Link href="/game-tutorial">Gameplay guide</Link>
          <a href="https://github.com/Alex0158/OpenAI-Web-MCP-Challenge" target="_blank" rel="noreferrer">Source repository ↗</a>
        </div>
      </footer>
    </main>
  );
}
