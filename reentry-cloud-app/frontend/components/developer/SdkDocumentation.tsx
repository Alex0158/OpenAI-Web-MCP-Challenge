"use client";

import { useState } from "react";
import {
  FiArrowRight,
  FiCheck,
  FiChevronRight,
  FiClipboard,
  FiCode,
  FiCpu,
  FiGlobe,
  FiKey,
  FiLock,
  FiPackage,
  FiRadio,
  FiServer,
  FiShield,
  FiTerminal,
} from "react-icons/fi";

type SdkStep = {
  id: string;
  number: string;
  label: string;
  title: string;
  summary: string;
  language: string;
  code: string;
  checks: string[];
};

const SDK_STEPS: SdkStep[] = [
  {
    id: "install",
    number: "01",
    label: "Install",
    title: "Install one package.",
    summary: "Check Node.js, then add the published Host SDK to your Next.js app.",
    language: "shell",
    code: `node --version
npm install @4xeoz/re-entry-sdk@0.3.2`,
    checks: [
      "Use Node.js 24 or newer.",
      "Run the command from your Next.js project root.",
      "The SDK is installed as a normal npm dependency.",
    ],
  },
  {
    id: "configure",
    number: "02",
    label: "Configure",
    title: "Keep credentials server-side.",
    summary: "Add the Receiver settings to your environment, then create one reusable server-only SDK module.",
    language: "env + js",
    code: `# .env.local
HOST_ORIGIN=https://your-app.example
RECEIVER_ORIGIN=https://cloud-receiver-delta.vercel.app
REENTRY_KEY_ID=your_host_key_id
REENTRY_PRIVATE_KEY="your_private_key"
REENTRY_ORGANIZATION_API_KEY=your_dashboard_api_key

// lib/reentry.server.js
import { createReentry } from "@4xeoz/re-entry-sdk/server";

export const reentry = createReentry({
  origin: process.env.HOST_ORIGIN,
  receiverOrigin: process.env.RECEIVER_ORIGIN,
  privateKey: process.env.REENTRY_PRIVATE_KEY,
  keyId: process.env.REENTRY_KEY_ID,
  organizationApiKey: process.env.REENTRY_ORGANIZATION_API_KEY,
});`,
    checks: [
      "Copy the organization API key from the Developer Dashboard.",
      "Generate and store the Host signing key outside browser code.",
      "Never prefix a server-only variable with NEXT_PUBLIC_.",
    ],
  },
  {
    id: "consent",
    number: "03",
    label: "Consent",
    title: "Create the consent session.",
    summary: "Call the SDK from an authenticated server route and return only the consent URL and session ID to the browser.",
    language: "next.js route",
    code: `// app/api/reentry/request/route.js
import { NextResponse } from "next/server";
import { reentry } from "@/lib/reentry.server";

export async function POST() {
  const user = await requireAuthenticatedUser();
  const request = await reentry.request({
    subject: user.id,
    prompt: "Review and sign this contract",
    url: "https://your-app.example/contracts/123",
  });

  await saveRequestHandle(
    request.consentSessionId,
    request.handle,
  );

  return NextResponse.json({
    consentSessionId: request.consentSessionId,
    consentUrl: request.consentUrl,
  });
}`,
    checks: [
      "Use the signed-in user's stable server-side ID.",
      "Save the request handle on your server; never send it to the browser.",
      "Open consentUrl from your visible Sign contract button.",
    ],
  },
  {
    id: "verify",
    number: "04",
    label: "Verify",
    title: "Confirm the signed contract.",
    summary: "After the consent window finishes, ask your server to confirm the Receiver status and store the approved continuation.",
    language: "next.js route",
    code: `// app/api/reentry/confirm/route.js
import { NextResponse } from "next/server";
import { reentry } from "@/lib/reentry.server";

export async function POST(request) {
  const user = await requireAuthenticatedUser();
  const { consentSessionId } = await request.json();
  const handle = await loadRequestHandleForUser(
    consentSessionId,
    user.id,
  );

  const result = await reentry.confirm(handle, {
    onApproved: (continuation) =>
      saveSignedContract(user.id, continuation),
  });

  return NextResponse.json(result);
}`,
    checks: [
      "Only the Receiver's confirmed status is authoritative.",
      "Store approved contract data against the authenticated user.",
      "This guide stops here: it does not trigger a later agent or Event.",
    ],
  },
];

const FLOW = [
  { label: "Host", detail: "signs", icon: FiServer },
  { label: "Re-entry", detail: "asks", icon: FiShield },
  { label: "Mac", detail: "receives", icon: FiCpu },
  { label: "Codex", detail: "returns", icon: FiRadio },
];

export default function SdkDocumentation() {
  const [activeId, setActiveId] = useState(SDK_STEPS[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const activeIndex = SDK_STEPS.findIndex((step) => step.id === activeId);
  const activeStep = SDK_STEPS[activeIndex];

  async function copyActiveCode() {
    try {
      await navigator.clipboard.writeText(activeStep.code);
      setCopiedId(activeStep.id);
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch {
      setCopiedId("unavailable");
      window.setTimeout(() => setCopiedId(null), 1600);
    }
  }

  function showNextStep() {
    const nextIndex = (activeIndex + 1) % SDK_STEPS.length;
    setActiveId(SDK_STEPS[nextIndex].id);
  }

  return (
    <section id="sdk-docs" className="relative mt-16 scroll-mt-8 pb-16 sm:mt-20" aria-labelledby="sdk-docs-title">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <div className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#4a8e3d]">
            <FiPackage aria-hidden="true" />
            Host SDK / interactive guide
          </div>
          <h2 id="sdk-docs-title" className="mt-4 max-w-3xl text-[clamp(38px,5vw,66px)] font-semibold leading-[0.94] tracking-[-0.065em] text-[#163300]">
            Four steps. One signed contract.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#587052]">
            Copy each command or code block in order. This guide ends after consent is confirmed and stored.
          </p>
        </div>

        <div className="grid min-w-[280px] grid-cols-3 overflow-hidden rounded-2xl border border-[#c9ddc4] bg-white/65 text-center shadow-[0_14px_40px_rgba(22,51,0,0.06)]">
          {[
            ["4", "clear steps"],
            ["2", "server routes"],
            ["0", "later events"],
          ].map(([value, label]) => (
            <div key={label} className="border-r border-[#d9e7d5] px-3 py-3 last:border-r-0">
              <strong className="block text-xl tracking-[-0.04em] text-[#163300]">{value}</strong>
              <span className="font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-[#71876c]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="rounded-[28px] border border-[#cddfc8] bg-white/72 p-3 shadow-[0_18px_60px_rgba(22,51,0,0.07)]" role="tablist" aria-label="SDK integration steps">
          {SDK_STEPS.map((step) => {
            const active = step.id === activeId;
            return (
              <button
                key={step.id}
                id={`sdk-tab-${step.id}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls="sdk-step-panel"
                onClick={() => setActiveId(step.id)}
                className={`group flex w-full items-center gap-3 rounded-[20px] px-3 py-3.5 text-left transition ${active ? "bg-[#163300] text-white shadow-[0_12px_30px_rgba(22,51,0,0.18)]" : "text-[#587052] hover:bg-[#e6f2e1]"}`}
              >
                <span className={`font-mono text-[10px] font-bold ${active ? "text-[#b9f57b]" : "text-[#6ea262]"}`}>{step.number}</span>
                <span className="text-sm font-semibold">{step.label}</span>
                <FiChevronRight className={`ml-auto transition-transform ${active ? "translate-x-0 text-[#b9f57b]" : "-translate-x-1 text-[#9bb196] group-hover:translate-x-0"}`} aria-hidden="true" />
              </button>
            );
          })}
        </div>

        <div
          id="sdk-step-panel"
          role="tabpanel"
          aria-labelledby={`sdk-tab-${activeStep.id}`}
          className="overflow-hidden rounded-[30px] bg-[#08110b] text-[#efffe7] shadow-[0_26px_80px_rgba(8,17,11,0.2)]"
        >
          <div className="grid min-h-[600px] lg:grid-cols-[minmax(0,1.35fr)_minmax(270px,0.65fr)]">
            <div className="min-w-0 border-b border-white/10 p-5 sm:p-7 lg:border-b-0 lg:border-r">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-white/42">
                  <FiTerminal className="text-[#8fe5d1]" aria-hidden="true" />
                  {activeStep.language}
                </div>
                <button
                  type="button"
                  onClick={() => void copyActiveCode()}
                  className="inline-flex min-h-9 items-center gap-2 rounded-full border border-white/12 px-3 text-xs font-semibold text-white/65 transition hover:border-white/30 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b9f57b]"
                >
                  {copiedId === activeStep.id ? <FiCheck className="text-[#b9f57b]" aria-hidden="true" /> : <FiClipboard aria-hidden="true" />}
                  {copiedId === activeStep.id ? "Copied" : copiedId === "unavailable" ? "Unavailable" : "Copy"}
                </button>
              </div>
              <pre className="mt-5 max-h-[460px] overflow-auto whitespace-pre-wrap break-words font-mono text-[12px] leading-6 text-[#dce9d8] sm:text-[13px]">
                <code>{activeStep.code}</code>
              </pre>
            </div>

            <div className="flex flex-col p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#b9f57b]">{activeStep.number} / 04</span>
                <FiCode className="h-5 w-5 text-[#8fe5d1]" aria-hidden="true" />
              </div>
              <h3 className="mt-8 text-[clamp(28px,3vw,42px)] font-semibold leading-[0.98] tracking-[-0.055em]">{activeStep.title}</h3>
              <p className="mt-4 text-sm leading-6 text-white/58">{activeStep.summary}</p>

              <div className="mt-8 space-y-3">
                {activeStep.checks.map((check) => (
                  <div key={check} className="flex gap-3 rounded-2xl border border-white/8 bg-white/[0.035] p-3.5">
                    <FiCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#b9f57b]" aria-hidden="true" />
                    <p className="text-xs leading-5 text-white/67">{check}</p>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={showNextStep}
                className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#b9f57b] px-4 text-sm font-bold text-[#163300] transition hover:bg-[#d5ffad] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b9f57b]"
              >
                {activeIndex === SDK_STEPS.length - 1 ? "Back to install" : "Next step"}
                <FiArrowRight aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
        <div className="rounded-[28px] border border-[#cddfc8] bg-white/68 p-5 sm:p-7">
          <div className="flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.17em] text-[#4a8e3d]">
            <FiGlobe aria-hidden="true" />
            Live path
          </div>
          <div className="mt-6 grid gap-2 sm:grid-cols-4">
            {FLOW.map(({ label, detail, icon: Icon }, index) => (
              <div key={label} className="relative rounded-2xl bg-[#e7f3e2] p-3.5">
                <Icon className="h-4 w-4 text-[#36752f]" aria-hidden="true" />
                <strong className="mt-4 block text-sm text-[#163300]">{label}</strong>
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#759170]">{detail}</span>
                {index < FLOW.length - 1 ? <FiChevronRight className="absolute right-2 top-1/2 hidden -translate-y-1/2 translate-x-5 text-[#6ea262] sm:block" aria-hidden="true" /> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] bg-[#dff3d7] p-5 text-[#163300] sm:p-7">
          <div className="flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.17em] text-[#4a8e3d]">
            <FiLock aria-hidden="true" />
            Credential boundary
          </div>
          <div className="mt-6 space-y-3">
            {[
              [FiKey, "Organization key", "Host server only"],
              [FiShield, "Signing key", "Host server only"],
              [FiCpu, "Connector credential", "User's Mac only"],
            ].map(([Icon, name, location]) => {
              const CredentialIcon = Icon as typeof FiKey;
              return (
                <div key={name as string} className="flex items-center gap-3 border-b border-[#bad4b3] pb-3 last:border-b-0 last:pb-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/60 text-[#36752f]">
                    <CredentialIcon aria-hidden="true" />
                  </span>
                  <div>
                    <strong className="block text-sm">{name as string}</strong>
                    <span className="text-xs text-[#587052]">{location as string}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
