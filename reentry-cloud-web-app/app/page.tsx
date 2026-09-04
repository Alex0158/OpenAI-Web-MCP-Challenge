import Link from "next/link";
import type { IconType } from "react-icons";
import {
  FiArrowUpRight,
  FiCpu,
  FiGlobe,
  FiRefreshCw,
  FiShield,
  FiZap,
} from "react-icons/fi";
import WebGLHero from "@/components/landing/WebGLHero";
import {
  LandingFinalAction,
  LandingHeaderActions,
  LandingHeroActions,
  LandingSessionProvider,
} from "@/components/landing/LandingSession";
import { Logo } from "@/components/ui/Logo";

export const metadata = {
  title: "re-entry cloud — close the loop between agents and the internet",
  description: "A human-approved return path for the next generation of WebMCP agents.",
};

const loopStages: { number: string; label: string; title: string; icon: IconType }[] = [
  { number: "01", label: "PAGE", title: "Start where the work lives.", icon: FiGlobe },
  { number: "02", label: "BOUNDARY", title: "Give the agent a clear lane.", icon: FiShield },
  { number: "03", label: "AGENT", title: "Let it move the work forward.", icon: FiCpu },
  { number: "04", label: "RETURN", title: "Bring progress back to the web.", icon: FiRefreshCw },
];

export default function HomePage() {
  return (
    <LandingSessionProvider>
      <main className="min-h-screen overflow-hidden bg-[#08110b] text-[#efffe7] selection:bg-[#b9f57b] selection:text-[#163300]">
      <header className="relative z-20 border-b border-white/10">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-5 px-5 sm:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-3 whitespace-nowrap" aria-label="re-entry cloud home">
            <Logo className="h-9 w-9" />
            <span className="text-[17px] font-bold tracking-[-0.04em] text-white">re-entry</span>
            <span className="-ml-2 mt-3 text-[9px] font-bold uppercase tracking-[0.24em] text-[#9fe870]">cloud</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-white/60 md:flex" aria-label="Primary navigation">
            <a className="transition hover:text-white" href="#loop">The loop</a>
            <Link className="transition hover:text-white" href="/docs">Docs</Link>
          </nav>

          <LandingHeaderActions />
        </div>
      </header>

      <section className="relative isolate overflow-hidden border-b border-white/10">
        <WebGLHero />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(8,17,11,0.98)_0%,rgba(8,17,11,0.72)_42%,rgba(8,17,11,0.12)_100%)]" />

        <div className="relative z-10 mx-auto grid min-h-[700px] max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:py-28">
          <div className="max-w-[620px]">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#9fe870]/30 bg-[#9fe870]/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#b9f57b]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#b9f57b]" />
              WebMCP / agent runtime
            </div>

            <h1 className="max-w-3xl text-[clamp(48px,7.4vw,100px)] font-semibold leading-[0.94] tracking-[-0.075em] text-white">
              Close the loop
              <span className="block text-[#b9f57b]">between agents</span>
              <span className="block text-white/45">and the internet.</span>
            </h1>

            <p className="mt-8 max-w-md text-base leading-7 text-white/62 sm:text-lg">
              A clear, human-approved return path for the next generation of web agents.
            </p>

            <div className="mt-9">
              <LandingHeroActions />
            </div>

            <div className="mt-11 flex flex-wrap gap-x-5 gap-y-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/42">
              <span className="inline-flex items-center gap-2"><FiShield className="text-[#b9f57b]" /> human-approved</span>
              <span className="inline-flex items-center gap-2"><FiZap className="text-[#8fe5d1]" /> page-aware</span>
              <span className="inline-flex items-center gap-2"><FiGlobe className="text-[#f1cf70]" /> open web</span>
            </div>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-[640px] lg:-mr-14">
            <div className="absolute inset-[9%] rounded-full border border-white/10" />
            <div className="absolute inset-[19%] rounded-full border border-[#9fe870]/20" />
            <div className="absolute inset-[31%] rounded-full border border-[#8fe5d1]/20" />

            <div className="absolute left-[7%] top-[10%] rounded-full border border-white/10 bg-[#07100c]/60 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-white/50 backdrop-blur">
              pointer → context
            </div>
            <div className="absolute bottom-[15%] right-[4%] rounded-full border border-[#9fe870]/25 bg-[#07100c]/70 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#b9f57b] backdrop-blur">
              context → page
            </div>

            <div className="absolute left-1/2 top-1/2 w-[min(86%,360px)] -translate-x-1/2 -translate-y-1/2 rounded-[26px] border border-white/15 bg-[#07100c]/65 p-4 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
                  <span className="h-2 w-2 rounded-full bg-[#b9f57b] shadow-[0_0_12px_#b9f57b]" />
                  loop map
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">simulation</span>
              </div>
              <div className="space-y-3 pt-4">
                {[
                  ["01", "Browser", "state in"],
                  ["02", "WebMCP", "tools now"],
                  ["03", "Re-entry", "bounded"],
                  ["04", "Agent", "back again"],
                ].map(([number, name, state], index) => (
                  <div key={number} className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-[#9fe870]">{number}</span>
                    <div className="h-px w-5 bg-white/15" />
                    <span className="text-sm font-semibold text-white/85">{name}</span>
                    <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">{state}</span>
                    {index < 3 ? <span className="h-1.5 w-1.5 rounded-full bg-[#8fe5d1]/70" /> : <FiRefreshCw className="h-3 w-3 text-[#b9f57b]" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="loop" className="bg-[#eef7e8] text-[#0e0f0c]">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#44753d]">The loop</p>
              <h2 className="mt-4 max-w-2xl text-[clamp(36px,5vw,68px)] font-semibold leading-[0.98] tracking-[-0.06em]">
                One thread.
                <span className="block text-[#4b9b42]">From page to progress.</span>
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-6 text-[#526150]">Web-native agents need a way back to the work.</p>
          </div>

          <div className="mt-16 grid border-t border-[#163300]/15 md:grid-cols-2 lg:grid-cols-4">
            {loopStages.map((stage) => {
              const Icon = stage.icon;
              return (
                <div key={stage.number} className="group border-b border-[#163300]/15 py-7 md:px-6 md:first:pl-0 lg:border-b-0 lg:border-r lg:last:border-r-0">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold tracking-[0.18em] text-[#759170]">{stage.number}</span>
                    <Icon className="h-5 w-5 text-[#4b9b42] transition-transform duration-300 group-hover:rotate-[-12deg] group-hover:scale-110" aria-hidden="true" />
                  </div>
                  <p className="mt-12 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#4b9b42]">{stage.label}</p>
                  <h3 className="mt-3 max-w-[190px] text-xl font-semibold leading-tight tracking-[-0.03em]">{stage.title}</h3>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#b9f57b] text-[#163300]">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-[#163300]/10" />
        <div className="pointer-events-none absolute -right-8 top-[-20px] h-48 w-48 rounded-full border border-[#163300]/10" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-5 py-20 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:py-24">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#3e6e36]">Ready when you are</p>
            <h2 className="mt-4 max-w-2xl text-[clamp(40px,5vw,70px)] font-semibold leading-[0.95] tracking-[-0.065em]">Make the browser part of the agent loop.</h2>
          </div>
          <LandingFinalAction />
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#08110b]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/35 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span className="text-white/70">re-entry cloud</span>
          <span>webmcp / agent loop / 2026</span>
          <Link className="transition hover:text-white" href="/docs">Read the docs <FiArrowUpRight className="ml-1 inline" /></Link>
        </div>
      </footer>
      </main>
    </LandingSessionProvider>
  );
}
