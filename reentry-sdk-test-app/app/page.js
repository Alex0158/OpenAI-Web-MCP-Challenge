"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Bell,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Code2,
  FileCheck2,
  FileText,
  Headphones,
  Home,
  LayoutDashboard,
  Menu,
  MessageCircleMore,
  PackageCheck,
  ReceiptText,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import {
  createReentryConsentAction,
  registerReentryWebMcpTool,
} from "@4xeoz/re-entry-sdk/client";
import {
  getPlaygroundScenario,
  PLAYGROUND_SCENARIOS,
  scenarioCanonicalPath,
} from "./_lib/playground-config.mjs";
import styles from "./page.module.css";

const INITIAL_SCENARIO_STATES = Object.fromEntries(
  PLAYGROUND_SCENARIOS.map((scenario) => [scenario.id, {
    stage: "waiting",
    continuationId: "",
    eventId: "",
    error: "",
  }]),
);

const STAGE_COPY = {
  waiting: "Updates are off",
  requesting: "Opening consent",
  permission_ready: "Updates are on",
  actioning: "Sending update",
  queued: "Update queued",
  declined: "Permission declined",
  cancelled: "Consent closed",
  error: "Needs attention",
};

export default function Page() {
  const actionRef = useRef(null);
  const activeScenarioRef = useRef(null);
  const activeViewRef = useRef("user");
  const registeredWebMcpToolsRef = useRef(new Set());
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState("user");
  const [scenarioStates, setScenarioStates] = useState(INITIAL_SCENARIO_STATES);

  useEffect(() => {
    const syncFromUrl = () => {
      const scenarioId = new URLSearchParams(window.location.search).get("scenario");
      setSelectedId(getPlaygroundScenario(scenarioId)?.id ?? null);
      setView("user");
    };
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  const setScenarioState = useCallback((scenarioId, next) => {
    setScenarioStates((current) => ({
      ...current,
      [scenarioId]: { ...current[scenarioId], ...next },
    }));
  }, []);

  const openScenario = useCallback((scenarioId) => {
    if (!getPlaygroundScenario(scenarioId)) return;
    setSelectedId(scenarioId);
    setView("user");
    window.history.pushState({}, "", scenarioCanonicalPath(scenarioId));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const closeScenario = useCallback(() => {
    setSelectedId(null);
    setView("user");
    window.history.pushState({}, "", window.location.pathname);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const getConsent = useCallback(async (input) => {
    const session = await postJson("/api/reentry/consent", input);
    return {
      title: session.title,
      reason: session.reason,
      consentUrl: session.consent_url,
      consentSessionId: session.consent_session_id,
    };
  }, []);

  const confirmConsent = useCallback(async ({ consentSessionId }) => {
    const confirmation = await postJson("/api/reentry/consent/status", {
      consent_session_id: consentSessionId,
    });
    return {
      status: confirmation.status,
      continuationId: confirmation.continuation_id,
    };
  }, []);

  const requestPermissionForScenario = useCallback(async (scenarioId) => {
    const scenario = getPlaygroundScenario(scenarioId);
    if (!scenario) return;

    setScenarioState(scenario.id, { stage: "requesting", error: "" });
    try {
      actionRef.current ??= createReentryConsentAction({
        createConsentSession: getConsent,
        confirmConsentSession: confirmConsent,
      });
      const result = await actionRef.current({ scenario_id: scenario.id });
      if (result.status === "approved") {
        setScenarioState(scenario.id, {
          stage: "permission_ready",
          continuationId: result.continuationId,
        });
      } else {
        setScenarioState(scenario.id, { stage: result.status });
      }
    } catch (error) {
      setScenarioState(scenario.id, {
        stage: "error",
          error: publicErrorCode(error).replaceAll("_", " "),
      });
      return { status: "error", code: publicErrorCode(error) };
    }
  }, [confirmConsent, getConsent, setScenarioState]);

  const requestPermission = useCallback(
    () => requestPermissionForScenario(selectedId),
    [requestPermissionForScenario, selectedId],
  );

  const readCurrentState = useCallback(async (scenarioId) => {
    const snapshot = await readJson(
      `/api/reentry/playground/state?scenario_id=${encodeURIComponent(scenarioId)}`,
    );
    if (
      activeScenarioRef.current === scenarioId &&
      activeViewRef.current === "user"
    ) {
      setScenarioState(scenarioId, {
        stage: snapshot.status,
        eventId: snapshot.event_id ?? "",
      });
    }
    return snapshot;
  }, [setScenarioState]);

  useEffect(() => {
    activeScenarioRef.current = selectedId;
    activeViewRef.current = view;
  }, [selectedId, view]);

  useEffect(() => {
    if (!selectedId) return undefined;
    let cancelled = false;
    readCurrentState(selectedId)
      .then((snapshot) => {
        if (cancelled) return;
        setScenarioState(selectedId, {
          stage: snapshot.status,
          eventId: snapshot.event_id ?? "",
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setScenarioState(selectedId, {
          stage: "error",
          error: publicErrorCode(error).replaceAll("_", " "),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [readCurrentState, selectedId, setScenarioState]);

  useEffect(() => {
    const scenario = getPlaygroundScenario(selectedId);
    if (!scenario || view !== "user") return;

    const registerTool = async ({ key, name, description, readOnlyHint, execute }) => {
      if (registeredWebMcpToolsRef.current.has(key)) return;
      registeredWebMcpToolsRef.current.add(key);
      try {
        await registerReentryWebMcpTool({
          name,
          description,
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint },
          execute,
        });
      } catch {
        registeredWebMcpToolsRef.current.delete(key);
      }
    };

    const isActiveUserApp = () =>
      activeScenarioRef.current === scenario.id && activeViewRef.current === "user";

    void registerTool({
      key: `${scenario.id}:status`,
      name: scenario.webmcp.statusToolName,
      description: scenario.webmcp.statusToolDescription,
      readOnlyHint: true,
      execute: async () => {
        if (!isActiveUserApp()) return { status: "unavailable", reason: "mini_app_not_active" };
        return readCurrentState(scenario.id);
      },
    });
    void registerTool({
      key: `${scenario.id}:consent`,
      name: scenario.webmcp.consentToolName,
      description: scenario.webmcp.consentToolDescription,
      readOnlyHint: false,
      execute: async () => {
        if (!isActiveUserApp()) return { status: "unavailable", reason: "mini_app_not_active" };
        return requestPermissionForScenario(scenario.id);
      },
    });
  }, [readCurrentState, requestPermissionForScenario, selectedId, view]);

  const advanceWorkflow = useCallback(async () => {
    const scenario = getPlaygroundScenario(selectedId);
    const state = scenarioStates[selectedId];
    if (!scenario || !state?.continuationId) return;

    setScenarioState(scenario.id, { stage: "actioning", error: "" });
    try {
      const result = await postJson("/api/reentry/playground/advance", {
        scenario_id: scenario.id,
        continuation_id: state.continuationId,
      });
      setScenarioState(scenario.id, { stage: "queued", eventId: result.event_id });
    } catch (error) {
      setScenarioState(scenario.id, {
        stage: "error",
        error: publicErrorCode(error).replaceAll("_", " "),
      });
    }
  }, [scenarioStates, selectedId, setScenarioState]);

  const selectedScenario = getPlaygroundScenario(selectedId);
  if (!selectedScenario) {
    return <Gallery onOpen={openScenario} scenarioStates={scenarioStates} />;
  }

  return (
    <div className={styles.appRoot} data-theme={selectedScenario.id}>
      <ProductApp
        scenario={selectedScenario}
        state={scenarioStates[selectedScenario.id]}
        view={view}
        onRequestPermission={requestPermission}
        onAdvance={advanceWorkflow}
      />
      <PlaygroundDock view={view} onChangeView={setView} onExit={closeScenario} />
    </div>
  );
}

function Gallery({ onOpen, scenarioStates }) {
  return (
    <main className={styles.gallery}>
      <h1 className={styles.srOnly}>Choose a Re-entry SDK test app</h1>
      <div className={styles.galleryGrid}>
        {PLAYGROUND_SCENARIOS.map((scenario, index) => (
          <button
            className={styles.galleryCard}
            data-theme={scenario.id}
            key={scenario.id}
            onClick={() => onOpen(scenario.id)}
            style={{ "--card-index": index }}
            type="button"
          >
            <GalleryPreview scenario={scenario} />
            <span className={styles.galleryCardBody}>
              <span className={styles.galleryCardMeta}>
                <BrandMark scenario={scenario} />
                <span>{scenario.category}</span>
                {scenarioStates[scenario.id].stage === "queued" ? (
                  <span className={styles.galleryComplete}><Check size={12} /> Tested</span>
                ) : null}
              </span>
              <strong>{scenario.brand}</strong>
              <small>{scenario.tagline}</small>
              <span className={styles.galleryAction}>Open app <ArrowUpRight size={16} /></span>
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}

function GalleryPreview({ scenario }) {
  if (scenario.id === "pickup") {
    return (
      <span className={styles.galleryPreviewStore}>
        <Image src="/images/parcelly-sand-keyboard.png" alt="Sand wireless keyboard" fill sizes="(max-width: 760px) 92vw, 46vw" priority />
        <span>Pickup today</span>
      </span>
    );
  }
  if (scenario.id === "support") {
    return (
      <span className={styles.galleryPreviewSupport}>
        <span className={styles.previewSupportHeader}><Headphones size={17} /><b>Kindline care</b></span>
        <span className={styles.previewBubbleCustomer}>I still can’t sign in.</span>
        <span className={styles.previewBubbleAgent}>I found it — the fix is being checked now.</span>
      </span>
    );
  }
  if (scenario.id === "proposal") {
    return (
      <span className={styles.galleryPreviewProposal}>
        <span>MORROW / 2026</span>
        <b>Make room<br />for better<br /><i>ideas.</i></b>
        <small>Brand proposal · 03</small>
      </span>
    );
  }
  return (
    <span className={styles.galleryPreviewFinance}>
      <span className={styles.previewFinanceNav}><LayoutDashboard size={15} /><ReceiptText size={15} /><FileCheck2 size={15} /></span>
      <span className={styles.previewFinanceBody}><small>Awaiting approval</small><b>$2,480.00</b><span><ShieldCheck size={14} /> Ready for review</span></span>
    </span>
  );
}

function ProductApp({ scenario, state, view, onRequestPermission, onAdvance }) {
  const shared = { scenario, state, view, onRequestPermission, onAdvance };
  if (scenario.id === "pickup") return <ParcellyApp {...shared} />;
  if (scenario.id === "support") return <KindlineApp {...shared} />;
  if (scenario.id === "proposal") return <MorrowApp {...shared} />;
  return <LedgerlyApp {...shared} />;
}

function LedgerlyApp({ scenario, state, view, onRequestPermission, onAdvance }) {
  const nav = [
    ["Overview", LayoutDashboard],
    ["Cards", WalletCards],
    ["Bills", ReceiptText],
    ["Approvals", FileCheck2],
    ["Vendors", Building2],
  ];
  return (
    <div className={styles.ledgerlyApp}>
      <aside className={styles.ledgerSidebar}>
        <div className={styles.ledgerBrand}><BrandMark scenario={scenario} /><strong>Ledgerly</strong></div>
        <nav aria-label="Ledgerly navigation">
          {nav.map(([label, Icon]) => <button className={label === "Approvals" ? styles.ledgerNavActive : styles.ledgerNavItem} key={label} type="button"><Icon size={16} />{label}</button>)}
        </nav>
        <div className={styles.ledgerCompany}><span>NS</span><div><strong>Northstar Co.</strong><small>Finance workspace</small></div><ChevronDown size={14} /></div>
      </aside>
      <div className={styles.ledgerMain}>
        <header className={styles.ledgerTopbar}><div className={styles.searchBox}><Search size={15} /><span>Search bills, vendors, cards…</span><kbd>⌘ K</kbd></div><button type="button" aria-label="Notifications"><Bell size={18} /></button><span className={styles.avatar}>MA</span></header>
        {view === "developer" ? <DeveloperView scenario={scenario} state={state} onAdvance={onAdvance} /> : <LedgerlyWorkspace scenario={scenario} state={state} onRequestPermission={onRequestPermission} />}
      </div>
    </div>
  );
}

function LedgerlyWorkspace({ scenario, state, onRequestPermission }) {
  return (
    <main className={styles.ledgerWorkspace}>
      <div className={styles.pageHeading}><div><span>Approvals / Bills</span><h1>Invoice review</h1><p>One invoice needs your decision before the next payment run.</p></div><button type="button"><FileText size={15} /> Export details</button></div>
      <div className={styles.ledgerMetrics}><Metric label="Awaiting approval" value="07" detail="2 due this week" /><Metric label="Approved this month" value="$18.4k" detail="Across 12 bills" /><Metric label="Next payment run" value="Friday" detail="September 7" /></div>
      <div className={styles.ledgerContent}>
        <section className={styles.invoiceReview}>
          <div className={styles.invoiceHeader}><div><span className={styles.vendorLogo}>NS</span><div><small>{scenario.recordLabel}</small><h2>Northstar Studio</h2><p>Brand system refresh · Net 30</p></div></div><span className={styles.statusPill}><Clock3 size={13} /> Awaiting review</span></div>
          <div className={styles.invoiceAmount}><small>Total due</small><strong>{scenario.recordValue}</strong><span>Due September 18, 2026</span></div>
          <div className={styles.invoiceTable}><div><span>Description</span><span>Category</span><span>Amount</span></div><div><strong>Brand identity sprint</strong><span>Design services</span><strong>$2,200.00</strong></div><div><strong>Font licensing</strong><span>Software</span><strong>$280.00</strong></div><div className={styles.invoiceTotal}><span /><b>Total</b><strong>$2,480.00</strong></div></div>
          <div className={styles.policyCheck}><ShieldCheck size={18} /><div><strong>No policy issues found</strong><span>Vendor, amount, and payment details match the approved purchase order.</span></div></div>
        </section>
        <ConsentPanel scenario={scenario} state={state} onRequestPermission={onRequestPermission} />
      </div>
    </main>
  );
}

function ParcellyApp({ scenario, state, view, onRequestPermission, onAdvance }) {
  return (
    <div className={styles.parcellyApp}>
      <div className={styles.storeAnnouncement}>Free pickup on orders over $50 <span>Find your nearest store</span></div>
      <header className={styles.storeHeader}>
        <a href="#store-main" className={styles.storeBrand}><BrandMark scenario={scenario} /><strong>PARCELLY</strong></a>
        <nav aria-label="Parcelly navigation"><a href="#store-main">New in</a><a href="#store-main">Workspace</a><a href="#store-main">Accessories</a><a className={styles.storeNavActive} href="#store-main">Orders</a></nav>
        <div><button type="button" aria-label="Search"><Search size={19} /></button><button type="button" aria-label="Account"><UserRound size={19} /></button><button type="button" aria-label="Shopping bag"><ShoppingBag size={19} /><span>1</span></button></div>
      </header>
      {view === "developer" ? <DeveloperView scenario={scenario} state={state} onAdvance={onAdvance} /> : <ParcellyWorkspace scenario={scenario} state={state} onRequestPermission={onRequestPermission} />}
    </div>
  );
}

function ParcellyWorkspace({ scenario, state, onRequestPermission }) {
  const queued = state.stage === "queued";
  return (
    <main className={styles.storeMain} id="store-main">
      <div className={styles.storePageHeading}><div><span>Account / Orders / #7819</span><h1>{queued ? "Your order is ready" : "We’re getting it ready"}</h1><p>{queued ? "Bay 02 is reserved for your pickup." : "Your local team is packing everything with care."}</p></div><span className={styles.pickupBadge}><Store size={17} /> London · Shoreditch</span></div>
      <div className={styles.storeOrderGrid}>
        <section className={styles.productCard}>
          <div className={styles.productImage}><Image src="/images/parcelly-sand-keyboard.png" alt="Parcelly sand wireless keyboard" fill sizes="(max-width: 800px) 100vw, 55vw" priority /><span>Parcelly exclusive</span></div>
          <div className={styles.productDetails}><div><small>{scenario.recordLabel}</small><h2>Studio 68 Wireless Keyboard</h2><p>Sand · US layout · Quantity 1</p></div><strong>$86.00</strong></div>
        </section>
        <aside className={styles.orderSummary}>
          <div className={styles.orderSummaryHeader}><span>Status</span><strong>{queued ? "Ready for pickup" : "Preparing your order"}</strong><small>{queued ? "Collect today before 8:00 PM" : "Estimated ready between 4:00–6:00 PM"}</small></div>
          <OrderProgress ready={queued} />
          <div className={styles.pickupLocation}><Store size={18} /><div><strong>Parcelly Shoreditch</strong><span>18 Redchurch Street, London</span><small>Pickup bay 02 · Bring photo ID</small></div></div>
          <ConsentPanel scenario={scenario} state={state} onRequestPermission={onRequestPermission} />
        </aside>
      </div>
      <section className={styles.storeBenefits}><div><PackageCheck size={19} /><span><strong>Free store pickup</strong><small>No queues. We’ll hold it for 3 days.</small></span></div><div><ShieldCheck size={19} /><span><strong>30-day returns</strong><small>Return online or in any Parcelly store.</small></span></div><div><Headphones size={19} /><span><strong>Real human help</strong><small>Chat with our product team.</small></span></div></section>
    </main>
  );
}

function OrderProgress({ ready }) {
  const steps = ["Ordered", "Packed", "Ready", "Collected"];
  return <div className={styles.orderProgress}>{steps.map((step, index) => <div className={index < 2 || (ready && index === 2) ? styles.orderStepDone : index === 2 ? styles.orderStepCurrent : styles.orderStep} key={step}><span>{index < 2 || (ready && index === 2) ? <Check size={12} /> : index + 1}</span><small>{step}</small></div>)}</div>;
}

function KindlineApp({ scenario, state, view, onRequestPermission, onAdvance }) {
  return (
    <div className={styles.kindlineApp}>
      <header className={styles.supportHeader}><a href="#support-main" className={styles.supportBrand}><BrandMark scenario={scenario} /><strong>kindline</strong></a><nav aria-label="Kindline navigation"><a href="#support-main">Home</a><a className={styles.supportNavActive} href="#support-main">My conversations</a><a href="#support-main">Help center</a></nav><div className={styles.supportHeaderActions}><button type="button"><Search size={17} /><span>Search help</span></button><CircleHelp size={18} /><span className={styles.supportAvatar}>M</span></div></header>
      {view === "developer" ? <DeveloperView scenario={scenario} state={state} onAdvance={onAdvance} /> : <KindlineWorkspace scenario={scenario} state={state} onRequestPermission={onRequestPermission} />}
    </div>
  );
}

function KindlineWorkspace({ scenario, state, onRequestPermission }) {
  const resolved = state.stage === "queued";
  return (
    <main className={styles.supportMain} id="support-main">
      <aside className={styles.conversationList}><div className={styles.conversationListTop}><div><span>Conversations</span><strong>My support</strong></div><button type="button" aria-label="Conversation settings"><Settings2 size={17} /></button></div><div className={styles.conversationTabs}><button className={styles.conversationTabActive} type="button">Open <span>2</span></button><button type="button">Closed</button></div><div className={styles.conversationActive}><span className={styles.supportTicketIcon}><MessageCircleMore size={15} /></span><div><strong>Can’t access my account</strong><p>Samira: I found the issue and…</p><small>8m</small></div></div><div className={styles.conversationItem}><span className={styles.supportTicketIcon}><ReceiptText size={15} /></span><div><strong>Question about my invoice</strong><p>We’ve updated your billing date.</p><small>2d</small></div></div><button className={styles.newConversation} type="button"><MessageCircleMore size={15} /> Start a conversation</button></aside>
      <section className={styles.supportThread}>
        <header><div><span>Ticket #3308</span><h1>Can’t access my account</h1></div><span className={resolved ? styles.resolvedStatus : styles.supportStatus}>{resolved ? <Check size={13} /> : <Clock3 size={13} />}{resolved ? "Resolved" : "In progress"}</span></header>
        <div className={styles.supportMessages}><div className={styles.supportDate}>Today, 10:32 AM</div><div className={styles.customerMessage}><span className={styles.supportAvatar}>M</span><div><strong>You</strong><p>Hi Kindline, I’m still seeing the old login screen after resetting my password.</p></div></div><div className={styles.agentMessage}><span className={styles.agentAvatar}>SK</span><div><strong>Samira from Kindline <small>Support specialist</small></strong><p>{resolved ? "Good news — the fix is live and your account is ready. You can sign in normally now." : "Hi Maya — thanks for the extra detail. I found the issue and our fix is being checked now. I’ll let you know as soon as it’s ready."}</p></div></div></div>
        <div className={styles.replyComposer}><span>Reply to Samira…</span><div><button type="button" aria-label="Attach file"><FileText size={16} /></button><button type="button" disabled>Send reply</button></div></div>
      </section>
      <aside className={styles.supportDetails}><div className={styles.supportPerson}><span className={styles.supportAvatarLarge}>M</span><strong>Maya Ahmed</strong><small>maya@example.com</small></div><dl><div><dt>Status</dt><dd>{resolved ? "Resolved" : "In progress"}</dd></div><div><dt>Priority</dt><dd>Normal</dd></div><div><dt>Assigned to</dt><dd>Samira K.</dd></div><div><dt>Last updated</dt><dd>8 minutes ago</dd></div></dl><div className={styles.supportPromise}><ShieldCheck size={17} /><span><strong>You’re covered</strong><small>Kindline replies within one business day.</small></span></div><ConsentPanel scenario={scenario} state={state} onRequestPermission={onRequestPermission} /></aside>
    </main>
  );
}

function MorrowApp({ scenario, state, view, onRequestPermission, onAdvance }) {
  return (
    <div className={styles.morrowApp}>
      <header className={styles.studioHeader}><a href="#studio-main" className={styles.studioBrand}><BrandMark scenario={scenario} /><strong>Morrow</strong><span>Independent creative studio</span></a><nav aria-label="Morrow navigation"><a href="#studio-main">Projects</a><a className={styles.studioNavActive} href="#studio-main">Proposals</a><a href="#studio-main">Invoices</a></nav><div><button type="button"><Search size={18} /></button><span className={styles.studioAvatar}>MA</span><button className={styles.studioMenu} type="button"><Menu size={18} /></button></div></header>
      {view === "developer" ? <DeveloperView scenario={scenario} state={state} onAdvance={onAdvance} /> : <MorrowWorkspace scenario={scenario} state={state} onRequestPermission={onRequestPermission} />}
    </div>
  );
}

function MorrowWorkspace({ scenario, state, onRequestPermission }) {
  const accepted = state.stage === "queued";
  return (
    <main className={styles.studioMain} id="studio-main">
      <div className={styles.studioIntro}><span>Northstar Studio · Client portal</span><h1>{accepted ? "The work begins." : "A thoughtful next step."}</h1><p>{accepted ? "Your proposal has been accepted. Morrow will prepare the project room next." : "A focused six-week engagement to give Northstar a clearer, more confident identity."}</p></div>
      <div className={styles.proposalLayout}>
        <section className={styles.proposalDocument}><div className={styles.proposalDocumentTop}><span>MORROW / 2026</span><span>PROPOSAL 208 · EDITION 03</span></div><div className={styles.proposalTitle}><small>Prepared for Northstar Studio</small><h2>Make room<br />for better<br /><em>ideas.</em></h2></div><div className={styles.proposalDocumentBottom}><span>Brand refresh</span><strong>$8,900</strong></div></section>
        <aside className={styles.proposalSummary}><div className={styles.proposalState}><span>Current status</span><strong>{accepted ? "Accepted" : "Client reviewing"}</strong><small>{accepted ? "Accepted just now" : "Version 03 · Sent yesterday"}</small></div><div className={styles.proposalFacts}><div><span>Project value</span><strong>$8,900</strong></div><div><span>Timeline</span><strong>6 weeks</strong></div><div><span>Decision due</span><strong>Friday</strong></div></div><div className={styles.proposalScope}><span>In this proposal</span><p>Strategy workshop</p><p>Visual identity system</p><p>Launch toolkit</p></div><ConsentPanel scenario={scenario} state={state} onRequestPermission={onRequestPermission} /></aside>
      </div>
      <div className={styles.studioFooter}><span>Questions? hello@morrow.studio</span><span>© Morrow Studio 2026</span></div>
    </main>
  );
}

function ConsentPanel({ scenario, state, onRequestPermission }) {
  const ready = state.stage === "permission_ready";
  const queued = state.stage === "queued";
  const busy = state.stage === "requesting";
  return (
    <section className={styles.consentPanel}>
      <div className={styles.consentHeader}><span className={styles.reentryMark}><ArrowUpRight size={15} /></span><div><strong>Stay updated</strong><small>Powered by Re-entry</small></div></div>
      <p>Let {scenario.brand} return when {scenario.developerResult.toLowerCase()}.</p>
      <div className={styles.consentStatus}><span className={ready || queued ? styles.consentStatusReady : styles.consentStatusDot} /><div><strong>{STAGE_COPY[state.stage]}</strong><small>{queued ? "A local delivery is waiting." : "You can revoke this later."}</small></div></div>
      <button type="button" disabled={busy || ready || queued} onClick={onRequestPermission}>{busy ? "Opening consent…" : ready || queued ? "Updates enabled" : scenario.userAction}<ChevronRight size={15} /></button>
      {state.error ? <span className={styles.inlineError}>{state.error}</span> : null}
    </section>
  );
}

function DeveloperView({ scenario, state, onAdvance }) {
  const canAdvance = state.stage === "permission_ready";
  const queued = state.stage === "queued";
  return (
    <main className={styles.developerView}>
      <div className={styles.developerPanel}>
        <div className={styles.developerHeading}><span><Code2 size={19} /></span><div><small>Human-only developer controls</small><h1>Simulate the later business action</h1><p>This panel stands in for {scenario.brand}’s private back-office system. It is visible for testing and is not registered with WebMCP.</p></div><b>WebMCP excluded</b></div>
        <div className={styles.developerSteps}>
          <div><span>01</span><div><strong>User permission</strong><small>{canAdvance || queued ? "Approved. The server retained one opaque continuation." : "Return to the customer view and enable updates first."}</small></div><b>{canAdvance || queued ? <Check size={15} /> : null}</b></div>
          <div><span>02</span><div><strong>{scenario.developerAction}</strong><small>{queued ? "Re-entry Cloud accepted the event." : "This is the meaningful later action in this simulated business."}</small></div><button type="button" data-webmcp-excluded="true" data-human-only-control="true" disabled={!canAdvance} onClick={onAdvance}>{queued ? "Event sent" : "Run update"}<ArrowUpRight size={15} /></button></div>
          <div><span>03</span><div><strong>Local Connector delivery</strong><small>{queued ? "The queued event is ready for the Connector to claim." : "This becomes available after Re-entry Cloud accepts the event."}</small></div><b>{queued ? <Check size={15} /> : null}</b></div>
        </div>
        <div className={styles.developerPayload}><span>Browser sends</span><code>{`{ scenario_id: "${scenario.id}", continuation_id: "opaque…" }`}</code><small>The server owns the workflow, event type, canonical URL, and identity fields.</small></div>
        {state.error ? <span className={styles.inlineError}>{state.error}</span> : null}
      </div>
    </main>
  );
}

function PlaygroundDock({ view, onChangeView, onExit }) {
  return (
    <div className={styles.playgroundDock} data-webmcp-excluded="true" data-human-only-control="true">
      <button type="button" onClick={onExit}><ArrowLeft size={14} /> All apps</button>
      <span />
      <button className={view === "user" ? styles.dockActive : ""} type="button" onClick={() => onChangeView("user")}><UserRound size={14} /> Customer</button>
      <button className={view === "developer" ? styles.dockActive : ""} type="button" onClick={() => onChangeView("developer")}><Code2 size={14} /> Developer</button>
      <button className={styles.dockClose} type="button" onClick={onExit} aria-label="Close app"><X size={14} /></button>
    </div>
  );
}

function BrandMark({ scenario }) {
  const icons = { invoice: ReceiptText, pickup: ShoppingBag, support: MessageCircleMore, proposal: Sparkles };
  const Icon = icons[scenario.id] ?? Home;
  return <span className={styles.brandMark} data-brand={scenario.id}><Icon size={16} /></span>;
}

function Metric({ label, value, detail }) {
  return <div className={styles.metric}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>;
}

async function postJson(path, body) {
  const response = await fetch(path, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const value = await response.json();
  if (!response.ok) {
    throw Object.assign(new Error("Re-entry request failed"), { code: value?.error?.code });
  }
  return value;
}

async function readJson(path) {
  const response = await fetch(path, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const value = await response.json();
  if (!response.ok) {
    throw Object.assign(new Error("Playground state request failed"), {
      code: value?.error?.code,
    });
  }
  return value;
}

function publicErrorCode(error) {
  return typeof error?.code === "string" && /^[a-z][a-z0-9_]{0,95}$/.test(error.code)
    ? error.code
    : "reentry_request_failed";
}
