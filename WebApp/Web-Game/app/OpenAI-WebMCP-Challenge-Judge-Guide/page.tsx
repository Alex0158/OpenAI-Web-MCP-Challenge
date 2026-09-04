import Image from "next/image";
import Link from "next/link";

import styles from "./judge-guide.module.css";

export const metadata = {
  title: "OpenAI-WebMCP-Challenge-Judge-Guide | Sleepless Kingdom",
  description:
    "A concise judge walkthrough for Sleepless Kingdom, Re-entry Core, and the WebMCP page tools.",
};

const judgePath = [
  {
    number: "01",
    title: "Start at the shelter",
    copy: "Enter the frontier and read the server-owned snapshot: your shelter, soldiers, nearby resources, and world time.",
    tag: "Human view",
  },
  {
    number: "02",
    title: "Give one soldier a job",
    copy: "Assign a gatherer to Wood or Rock. The role locks the tool, route, and return rule for that mission.",
    tag: "One clear choice",
  },
  {
    number: "03",
    title: "Leave the world running",
    copy: "The player can leave. The server keeps advancing the world, moving the soldier, and recording what changes.",
    tag: "Persistent world",
  },
  {
    number: "04",
    title: "Let the cause become visible",
    copy: "A seeded monster encounter can destroy only cargo that has not reached the shelter. The event history keeps the why.",
    tag: "Causal event",
  },
  {
    number: "05",
    title: "Watch the Agent return",
    copy: "One meaningful signal brings the Agent back to the same game context. It reads fresh state before deciding what to do.",
    tag: "Re-entry",
  },
];

const tools = [
  ["inspect_shelter_state", "Read", "Current shelter, coins, resources, and world time."],
  ["inspect_client_snapshot", "Read", "The player-scoped snapshot used by the page."],
  ["inspect_missions", "Read", "Role, route, cargo, risk, and next mission state."],
  ["inspect_mission_history", "Read", "The bounded causal record behind the signal."],
  ["force_recall_soldier", "Bounded action", "A server-checked recall when the live revision permits it."],
];

const boundaries = [
  {
    title: "The server owns truth",
    copy: "World time, position, mission state, cargo, combat, settlement, and player scope are resolved by the Game server.",
    tone: "green",
  },
  {
    title: "The Agent gets context",
    copy: "The Agent receives a bounded signal and rereads the authenticated page. It can choose a safe action or deliberately do nothing.",
    tone: "gold",
  },
  {
    title: "The player keeps consequence",
    copy: "Migration, siege, upgrades, and other consequential choices remain visible human decisions with normal server checks.",
    tone: "blue",
  },
];

const connectorSteps = [
  {
    number: "01",
    title: "Install the bridge",
    copy: "Download the preview Local Connector on the Mac where your Agent should be able to return to work.",
  },
  {
    number: "02",
    title: "Pair this Mac",
    copy: "Sign in to Re-entry, choose Pair this Mac, and enter the short pairing code shown by the Connector.",
  },
  {
    number: "03",
    title: "Set the strategy",
    copy: "Tell the Agent to read the current game state and mission history before it chooses a bounded response.",
  },
  {
    number: "04",
    title: "Leave the world running",
    copy: "The Connector stays ready in the background. A meaningful event can bring the same Agent task back to context.",
  },
];

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
          <a href="#judge-path">Judge path</a>
          <a href="#flow">The flow</a>
          <a href="#connector">Connector</a>
          <a href="#mini-apps">Mini apps</a>
          <a href="#tools">Page tools</a>
          <a href="#boundaries">Trust boundary</a>
        </nav>
        <span className={styles.navStatus}>
          <span className={styles.statusDot} aria-hidden="true" />
          Guide surface
        </span>
      </header>

      <section className={styles.hero} aria-labelledby="guide-title">
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>OpenAI-WebMCP-Challenge-Judge-Guide</p>
          <h1 id="guide-title">
            A living world.
            <br />
            An Agent that knows <em>when to return.</em>
          </h1>
          <p className={styles.heroLead}>
            Sleepless Kingdom keeps moving after the player leaves, then gives the Agent the latest
            context when something meaningful happens.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryButton} href="/">
              Play the game
              <span aria-hidden="true">↗</span>
            </Link>
            <a className={styles.secondaryButton} href="#judge-path">
              Follow the story
              <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div className={styles.heroNote}>
            <span className={styles.heroNoteMark}>01</span>
            <span>One game state. Two surfaces. A bounded return to context.</span>
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
              <span>same task</span>
              <span>fresh reads</span>
              <span>human boundary</span>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.proofStrip} role="list" aria-label="Core ideas">
        <span role="listitem"><b>01</b> Persistent world</span>
        <span role="listitem"><b>02</b> Causal events</span>
        <span role="listitem"><b>03</b> Contextual re-entry</span>
        <span role="listitem"><b>04</b> Human consequence</span>
      </div>

      <section className={styles.contentSection} id="judge-path" aria-labelledby="judge-path-title">
        <div className={styles.sectionIntro}>
          <p className={styles.sectionIndex}>THE THREE-MINUTE PATH</p>
          <h2 id="judge-path-title">Follow one soldier through a world that does not pause.</h2>
          <p>
            This is the shortest route to the idea: create a mission, leave the page, return to a
            changed world, and let the Agent decide from current evidence.
          </p>
        </div>
        <ol className={styles.journeyList}>
          {judgePath.map((step) => (
            <li className={styles.journeyItem} key={step.number}>
              <span className={styles.stepNumber}>{step.number}</span>
              <div className={styles.stepBody}>
                <div className={styles.stepHeading}>
                  <h3>{step.title}</h3>
                  <span>{step.tag}</span>
                </div>
                <p>{step.copy}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={`${styles.contentSection} ${styles.flowSection}`} id="flow" aria-labelledby="flow-title">
        <div className={styles.sectionIntro}>
          <p className={styles.sectionIndex}>ONE CAUSAL CHAIN</p>
          <h2 id="flow-title">The notification is a bridge, not a second game.</h2>
          <p>
            The Game remains authoritative. Re-entry Core carries the verified context across the
            gap, so the Agent can return without turning every backend event into a message.
          </p>
        </div>
        <div className={styles.flowRail} aria-label="Game to WebMCP flow">
          <div className={styles.flowNode}>
            <span className={styles.flowNumber}>01</span>
            <strong>Game</strong>
            <small>World state changes</small>
          </div>
          <span className={styles.flowArrow} aria-hidden="true">→</span>
          <div className={styles.flowNode}>
            <span className={styles.flowNumber}>02</span>
            <strong>Event log</strong>
            <small>Why it happened</small>
          </div>
          <span className={styles.flowArrow} aria-hidden="true">→</span>
          <div className={`${styles.flowNode} ${styles.flowNodeAccent}`}>
            <span className={styles.flowNumber}>03</span>
            <strong>Re-entry signal</strong>
            <small>One bounded wake</small>
          </div>
          <span className={styles.flowArrow} aria-hidden="true">→</span>
          <div className={styles.flowNode}>
            <span className={styles.flowNumber}>04</span>
            <strong>Existing Agent task</strong>
            <small>Same context</small>
          </div>
          <span className={styles.flowArrow} aria-hidden="true">→</span>
          <div className={`${styles.flowNode} ${styles.flowNodeFinal}`}>
            <span className={styles.flowNumber}>05</span>
            <strong>WebMCP page</strong>
            <small>Fresh reads first</small>
          </div>
        </div>
        <div className={styles.vocabulary}>
          <div>
            <span>Signal</span>
            <p>A compact notification derived from meaningful events.</p>
          </div>
          <div>
            <span>WebMCP</span>
            <p>Page-bound tools that let the Agent read the current application state.</p>
          </div>
          <div>
            <span>Re-entry</span>
            <p>A return to the right context, not a brand-new conversation.</p>
          </div>
        </div>
      </section>

      <section className={`${styles.contentSection} ${styles.connectorSection}`} id="connector" aria-labelledby="connector-title">
        <div className={styles.connectorIntro}>
          <p className={styles.sectionIndex}>STRATEGY → AGENT SETUP</p>
          <h2 id="connector-title">How to set up your Local Connector.</h2>
          <p>
            Your strategy lives in the Agent. The Local Connector keeps the approved return path
            close by, so the Agent can pick up the right context when the world gives it a reason.
          </p>
          <div className={styles.connectorSteps}>
            {connectorSteps.map((step) => (
              <div className={styles.connectorStep} key={step.number}>
                <span className={styles.connectorStepNumber}>{step.number}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.connectorDownload}>
          <div className={styles.connectorDownloadHeader}>
            <span>LOCAL CONNECTOR / PREVIEW</span>
            <span className={styles.connectorDownloadStatus}>READY TO DOWNLOAD</span>
          </div>
          <div className={styles.connectorGlyph} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <h3>Let your Agent return to the work it already understands.</h3>
          <p>
            Install the small outbound bridge, pair one Mac, and keep the game page available for
            fresh reads. The Connector does not replace the server or make decisions for the Agent.
          </p>
          <code className={styles.installCommand}>npm install --global @4xeoz/re-entry</code>
          <div className={styles.connectorLinks}>
            <a
              className={styles.primaryButton}
              href="https://www.npmjs.com/package/@4xeoz/re-entry"
              target="_blank"
              rel="noreferrer"
            >
              Download package
              <span aria-hidden="true">↗</span>
            </a>
            <a
              className={styles.connectorGuideLink}
              href="https://github.com/Alex0158/OpenAI-Web-MCP-Challenge/blob/main/runtime/local-connector/README.md"
              target="_blank"
              rel="noreferrer"
            >
              Read setup guide ↗
            </a>
          </div>
          <p className={styles.connectorNote}>
            Preview setup: the package README carries the current Receiver and compatibility boundary.
          </p>
        </div>
      </section>

      <section className={`${styles.contentSection} ${styles.miniAppsSection}`} id="mini-apps" aria-labelledby="mini-apps-title">
        <div className={styles.sectionIntro}>
          <p className={styles.sectionIndex}>MORE RE-ENTRY SURFACES</p>
          <h2 id="mini-apps-title">Other mini applications to test our Re-entry.</h2>
          <p>
            Re-entry is a reusable continuity pattern. Open another small product surface, follow
            one real workflow, and see how the same idea carries context beyond the Kingdom.
          </p>
        </div>
        <div className={styles.miniAppsGrid}>
          <article className={styles.miniAppCard}>
            <a
              className={styles.miniAppImageLink}
              href="https://github.com/Alex0158/OpenAI-Web-MCP-Challenge/tree/main/WebApp/Web-Right_Spot"
              target="_blank"
              rel="noreferrer"
              aria-label="Open the RightSpot project entry"
            >
              <Image
                className={styles.miniAppImage}
                src="/mini-apps/rightspot-primary.v1.webp"
                alt="Bright living room preview from the RightSpot rental workflow"
                width={1536}
                height={1024}
              />
              <span className={styles.miniAppImageOverlay}>
                <span>OPEN PROJECT ENTRY</span>
                <strong>↗</strong>
              </span>
            </a>
            <div className={styles.miniAppBody}>
              <div className={styles.miniAppMeta}>
                <span>RIGHTSPOT / RENTAL WORKFLOW</span>
                <span>LOCAL MVP</span>
              </div>
              <h3>RightSpot</h3>
              <p>
                A tenant request moves from listing discovery to an agent decision. It is a second
                product surface for exploring how continuity can follow a business workflow.
              </p>
              <a
                className={styles.miniAppLink}
                href="https://github.com/Alex0158/OpenAI-Web-MCP-Challenge/tree/main/WebApp/Web-Right_Spot"
                target="_blank"
                rel="noreferrer"
              >
                View source and local runbook ↗
              </a>
            </div>
          </article>
        </div>
        <p className={styles.miniAppsNote}>
          RightSpot is currently presented as a local project entry; no hosted URL is claimed here.
        </p>
      </section>

      <section className={`${styles.contentSection} ${styles.toolsSection}`} id="tools" aria-labelledby="tools-title">
        <div className={styles.toolsIntro}>
          <p className={styles.sectionIndex}>THE PAGE SURFACE</p>
          <h2 id="tools-title">Read first. Decide second. Act inside the rules.</h2>
          <p>
            The Agent sees a small, purposeful tool surface. Every result is scoped to the signed-in
            player and checked against the latest server revision.
          </p>
        </div>
        <div className={styles.toolBoard}>
          <div className={styles.toolBoardHeader}>
            <span>CANONICAL GAME PAGE</span>
            <span className={styles.toolBoardBadge}>SCOPED TO PLAYER</span>
          </div>
          <div className={styles.toolList}>
            {tools.map(([name, type, description]) => (
              <div className={styles.toolRow} key={name}>
                <code>{name}</code>
                <span className={type === "Read" ? styles.readTag : styles.actionTag}>{type}</span>
                <p>{description}</p>
              </div>
            ))}
          </div>
          <div className={styles.toolBoardFooter}>
            <span>Unknown scope → typed rejection</span>
            <span>Stale revision → reread</span>
            <span>No action → valid outcome</span>
          </div>
        </div>
      </section>

      <section className={`${styles.contentSection} ${styles.boundarySection}`} id="boundaries" aria-labelledby="boundaries-title">
        <div className={styles.sectionIntro}>
          <p className={styles.sectionIndex}>WHO IS IN CONTROL</p>
          <h2 id="boundaries-title">Useful autonomy with visible limits.</h2>
          <p>
            Re-entry is valuable because the Agent can make sense of a changed world. It remains
            trustworthy because each layer keeps a narrow responsibility.
          </p>
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
          <p>
            In a WebMCP-enabled Agent session, this prompt keeps the first step read-only and leaves
            the consequence boundary visible.
          </p>
        </div>
        <div className={styles.promptCard}>
          <div className={styles.promptBar}>
            <span>SAFE FIRST READ</span>
            <span>NO COMMAND YET</span>
          </div>
          <p>
            Read the current shelter state, inspect recent mission history and the latest re-entry
            event, then explain whether recalling a soldier is safe. Do not issue a consequential
            command without human confirmation.
          </p>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <Image src="/icon.svg" alt="" width={32} height={32} />
          <div>
            <strong>Sleepless Kingdom</strong>
            <span>OpenAI-WebMCP-Challenge-Judge-Guide</span>
          </div>
        </div>
        <div className={styles.footerLinks}>
          <Link href="/">Game home</Link>
          <a href="https://github.com/Alex0158/OpenAI-Web-MCP-Challenge" target="_blank" rel="noreferrer">
            Source repository ↗
          </a>
        </div>
      </footer>
    </main>
  );
}
