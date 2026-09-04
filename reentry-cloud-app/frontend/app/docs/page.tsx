import Link from "next/link";
import {
  FiArrowRight,
  FiArrowUpRight,
  FiCheckCircle,
  FiCode,
  FiFileText,
  FiGlobe,
  FiLock,
  FiMonitor,
  FiRefreshCw,
  FiShield,
  FiZap,
} from "react-icons/fi";
import WorkspaceTopBar from "@/components/layout/WorkspaceTopBar";

export const metadata = {
  title: "Guide — re-entry cloud",
  description: "A simple guide to the human-approved re-entry loop.",
};

const steps = [
  {
    number: "01",
    label: "ACCOUNT",
    title: "Create your space.",
    description: "Your account is the home for paired Macs and approved work.",
    icon: FiGlobe,
  },
  {
    number: "02",
    label: "DEVICE",
    title: "Pair one Mac.",
    description: "Create a one-time code and enter it in the Local Connector.",
    icon: FiMonitor,
  },
  {
    number: "03",
    label: "RETURN",
    title: "Approve a website.",
    description: "Open the link from a website and approve it with your account.",
    icon: FiShield,
  },
];

const surfaces = [
  {
    label: "USER CONSOLE",
    title: "Your dashboard",
    description: "Pair devices and see the work waiting for your attention.",
    href: "/user-dashboard",
    icon: FiMonitor,
  },
  {
    label: "DEVICES",
    title: "Connected Macs",
    description: "See pairing status now; device controls are being staged.",
    href: "/user-dashboard/devices",
    icon: FiRefreshCw,
  },
  {
    label: "CONTRACTS",
    title: "Approved websites",
    description: "See one approved contract for each connected website.",
    href: "/user-dashboard/contracts",
    icon: FiFileText,
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#eef7e8] text-[#0e0f0c]">
      <WorkspaceTopBar />

      <main>
        <section className="relative isolate overflow-hidden bg-[#163300] text-[#efffe7]">
          <div className="pointer-events-none absolute -right-48 -top-56 h-[34rem] w-[34rem] rounded-full bg-[#9fe870]/20 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(180deg,transparent,rgba(7,16,11,0.35))]" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.7fr)] lg:items-end lg:py-28">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#b9f57b]/30 bg-[#b9f57b]/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#b9f57b]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#b9f57b] shadow-[0_0_10px_#b9f57b]" />
                Guide / the return path
              </div>
              <h1 className="mt-6 max-w-3xl text-[clamp(48px,7vw,92px)] font-semibold leading-[0.9] tracking-[-0.075em] text-white">
                A clearer way
                <span className="block text-[#b9f57b]">back to the work.</span>
              </h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-white/60 sm:text-lg">
                re-entry keeps the browser, your Mac, and a human decision in the same loop.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/user-dashboard/devices"
                  className="inline-flex items-center gap-2 rounded-full bg-[#b9f57b] px-4 py-2.5 text-sm font-bold text-[#163300] transition hover:bg-[#d5ffad]"
                >
                  Pair a Mac
                  <FiArrowRight aria-hidden="true" />
                </Link>
                <Link
                  href="/user-dashboard/contracts"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/75 transition hover:border-white/35 hover:text-white"
                >
                  See contracts
                  <FiFileText aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[#07100c]/55 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
                  <FiZap className="text-[#b9f57b]" aria-hidden="true" />
                  The loop
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">three checkpoints</span>
              </div>
              <div className="space-y-4 pt-5">
                {[
                  ["Website", "Sends the approval link"],
                  ["Approve", "One account decision"],
                  ["Contracts", "Approved websites"],
                ].map(([title, description], index) => (
                  <div key={title} className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-[#9fe870]">0{index + 1}</span>
                    <div className="h-px w-5 bg-white/15" />
                    <span className="text-sm font-semibold text-white/85">{title}</span>
                    <span className="ml-auto text-right font-mono text-[9px] uppercase tracking-[0.12em] text-white/35">{description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#44753d]">01 / start here</p>
              <h2 className="mt-4 max-w-2xl text-[clamp(36px,5vw,68px)] font-semibold leading-[0.96] tracking-[-0.06em] text-[#163300]">
                Three steps.
                <span className="block text-[#4b9b42]">One clear return.</span>
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-6 text-[#526150]">The preview keeps each decision visible and bounded.</p>
          </div>

          <div className="mt-14 grid gap-3 lg:grid-cols-3">
            {steps.map(({ number, label, title, description, icon: Icon }) => (
              <section key={number} className="group rounded-[26px] border border-[#cddfc8] bg-white/70 p-6 shadow-[0_16px_50px_rgba(22,51,0,0.05)] transition hover:-translate-y-1 hover:bg-white sm:p-7">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold tracking-[0.18em] text-[#8aa083]">{number}</span>
                  <Icon className="h-5 w-5 text-[#4b9b42] transition-transform group-hover:scale-110" aria-hidden="true" />
                </div>
                <p className="mt-14 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#4b9b42]">{label}</p>
                <h3 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.045em] text-[#163300]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#587052]">{description}</p>
              </section>
            ))}
          </div>
        </section>

        <section className="bg-[#07100c] text-[#efffe7]">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#9fe870]">02 / system map</p>
              <h2 className="mt-4 max-w-md text-[clamp(36px,5vw,64px)] font-semibold leading-[0.96] tracking-[-0.06em] text-white">
                Keep the next step small.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-6 text-white/55">
                The website owns the work. You own the approval. The connector only runs the approved continuation.
              </p>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04]">
              {[
                { label: "Website", code: "SDK + approval URL", icon: FiGlobe },
                { label: "Contract", code: "one approved website", icon: FiFileText },
                { label: "Event", code: "bounded work accepted", icon: FiCode },
                { label: "Connector", code: "local handoff + return", icon: FiMonitor },
              ].map(({ label, code, icon: Icon }, index) => (
                <div key={label} className="flex items-center gap-4 border-b border-white/10 px-5 py-5 last:border-b-0 sm:px-6">
                  <span className="font-mono text-[10px] text-[#9fe870]">0{index + 1}</span>
                  <Icon className="h-4 w-4 text-[#b9f57b]" aria-hidden="true" />
                  <span className="font-semibold text-white/85">{label}</span>
                  <code className="ml-auto text-right font-mono text-[10px] text-white/38">{code}</code>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#44753d]">03 / reference surfaces</p>
              <h2 className="mt-4 text-[clamp(36px,5vw,64px)] font-semibold leading-[0.96] tracking-[-0.06em] text-[#163300]">Everything has a place.</h2>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#7c9376]">
              <FiLock className="text-[#4b9b42]" aria-hidden="true" />
              Human in the loop
            </div>
          </div>

          <div className="mt-12 grid gap-3 md:grid-cols-3">
            {surfaces.map(({ label, title, description, href, icon: Icon }) => (
              <Link key={label} href={href} className="group rounded-[24px] border border-[#cddfc8] bg-white/70 p-5 transition hover:-translate-y-1 hover:bg-white sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#4a8e3d]">{label}</span>
                  <Icon className="h-4 w-4 text-[#4b9b42] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </div>
                <h3 className="mt-10 text-xl font-semibold tracking-[-0.04em] text-[#163300]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#587052]">{description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#286323]">Open surface <FiArrowRight aria-hidden="true" /></span>
              </Link>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-5 rounded-[26px] border border-[#cddfc8] bg-[#dff3d7] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-start gap-3">
              <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#286323]" aria-hidden="true" />
              <div>
                <p className="font-semibold text-[#163300]">Need the integration contract?</p>
                <p className="mt-1 text-sm leading-6 text-[#587052]">The next contract surface will turn an approved website into one account record under <code className="rounded bg-white/70 px-1.5 py-0.5 font-mono text-[11px] text-[#286323]">/v0.1</code>.</p>
              </div>
            </div>
            <Link href="/user-dashboard/contracts" className="inline-flex w-fit items-center gap-2 rounded-full bg-[#163300] px-4 py-2.5 text-sm font-bold text-[#b9f57b] transition hover:bg-[#214d0a]">View contracts <FiArrowUpRight aria-hidden="true" /></Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#08110b]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/35 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span className="text-white/70">re-entry cloud</span>
          <span>guide / webmcp / agent loop</span>
          <Link className="transition hover:text-white" href="/user-dashboard">Open console <FiArrowUpRight className="ml-1 inline" /></Link>
        </div>
      </footer>
    </div>
  );
}
