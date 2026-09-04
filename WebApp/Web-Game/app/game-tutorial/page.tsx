import Image from "next/image";
import Link from "next/link";

import styles from "./game-tutorial.module.css";

export const metadata = {
  title: "How to Play | Sleepless Kingdom",
  description: "A short player and Agent tutorial for the Sleepless Kingdom living world.",
};

const roles = [
  ["Gatherer", "Pickaxe", "Send it to Wood or Rock. A full pack returns to the shelter."],
  ["Hunter", "Sword", "Use it to hunt a monster and protect gatherers from exposed cargo."],
  ["Siege", "Sword + siege kit", "Choose a target found in the world and send a coordinated attack from home."],
  ["Guard", "Shelter tools", "Keep it at home to protect the shelter while other soldiers travel."],
] as const;

const agentSteps = [
  ["Read", "Inspect the current shelter, missions, and recent history."],
  ["Explain", "Describe what changed, what is at risk, and what the latest revision says."],
  ["Ask", "Request human confirmation before a consequential command."],
  ["Act", "Use one bounded page action only when the server accepts the live revision."],
] as const;

export default function GameTutorialPage() {
  return (
    <main className={styles.page}>
      <header className={styles.nav}>
        <Link className={styles.brand} href="/" aria-label="Return to Sleepless Kingdom">
          <Image src="/icon.svg" alt="" width={40} height={40} priority />
          <span><small>Sleepless Kingdom</small><strong>Game tutorial</strong></span>
        </Link>
        <Link className={styles.backLink} href="/OpenAI-WebMCP-Challenge-Judge-Guide">← Judge guide</Link>
      </header>

      <section className={styles.hero} aria-labelledby="tutorial-title">
        <p className={styles.kicker}>PLAY THE LIVING WORLD</p>
        <h1 id="tutorial-title">Make one choice.<br /><em>Let the world answer.</em></h1>
        <p className={styles.lead}>
          Sleepless Kingdom is a persistent two-player world. You assign roles from the shelter,
          the server advances every route, and the Agent helps you understand what changed when you
          return.
        </p>
        <div className={styles.actions}>
          <Link className={styles.primaryButton} href="/">Enter the game <span aria-hidden="true">↗</span></Link>
          <Link className={styles.secondaryButton} href="/OpenAI-WebMCP-Challenge-Judge-Guide">Back to judge guide <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="loop-title">
        <p className={styles.sectionIndex}>THE HUMAN LOOP</p>
        <h2 id="loop-title">A clear rhythm keeps the game readable.</h2>
        <div className={styles.loopGrid}>
          <article><span>01</span><h3>Look</h3><p>Read the map, shelter summary, nearby Wood and Rock, and the other player.</p></article>
          <article><span>02</span><h3>Assign</h3><p>Choose a soldier and one role. The role locks its tool, route, and mission.</p></article>
          <article><span>03</span><h3>Leave</h3><p>Close the page or wait. World time, movement, combat, and cargo continue on the server.</p></article>
          <article><span>04</span><h3>Return</h3><p>Read the event history and current revision before deciding whether to recall or reassign.</p></article>
        </div>
      </section>

      <section className={`${styles.section} ${styles.rolesSection}`} aria-labelledby="roles-title">
        <p className={styles.sectionIndex}>ROLE-LOCKED SOLDIERS</p>
        <h2 id="roles-title">Every job has a reason to travel.</h2>
        <div className={styles.roleGrid}>
          {roles.map(([role, tool, copy]) => (
            <article className={styles.roleCard} key={role}>
              <div className={styles.roleTopline}><span>{role}</span><b>{tool}</b></div>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.agentSection}`} aria-labelledby="agent-title">
        <div>
          <p className={styles.sectionIndex}>AGENT COLLABORATION</p>
          <h2 id="agent-title">The Agent is a second pair of eyes.</h2>
          <p className={styles.sectionLead}>It does not become a hidden game authority. It reads the same page and works inside the same server checks.</p>
        </div>
        <ol className={styles.agentList}>
          {agentSteps.map(([title, copy], index) => (
            <li key={title}><span>0{index + 1}</span><div><h3>{title}</h3><p>{copy}</p></div></li>
          ))}
        </ol>
      </section>

      <section className={`${styles.section} ${styles.promptSection}`} aria-labelledby="prompt-title">
        <p className={styles.sectionIndex}>STARTING PROMPT</p>
        <h2 id="prompt-title">Give the Agent a question, not a script.</h2>
        <div className={styles.promptCard}>
          <span>SAFE FIRST READ</span>
          <p>Read my current shelter state, inspect the latest mission history, and explain what changed and whether recalling a soldier is safe. Ask before issuing a consequential action.</p>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>Sleepless Kingdom / OpenAI WebMCP Challenge</span>
        <Link href="/OpenAI-WebMCP-Challenge-Judge-Guide">← Return to judge guide</Link>
      </footer>
    </main>
  );
}
