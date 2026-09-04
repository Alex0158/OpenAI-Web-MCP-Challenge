import Link from "next/link";
import {
  FiArrowUpRight,
  FiCheckCircle,
  FiMonitor,
  FiRefreshCw,
  FiShield,
  FiZap,
} from "react-icons/fi";
import PairThisMac from "@/components/connectors/PairThisMac";

export default function AccountDashboard({ dashboardHref = "/user-dashboard" }: { dashboardHref?: string }) {
  return (
    <div className="relative isolate min-h-full overflow-hidden bg-[#eef7e8] text-[#0e0f0c]">
      <div className="pointer-events-none absolute -right-40 -top-40 -z-10 h-[30rem] w-[30rem] rounded-full bg-[#9fe870]/25 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(159,232,112,0.22),transparent_68%)]" />

      <div className="relative mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#8fbd83] bg-[#dff3d7] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#286323]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#4b9b42] shadow-[0_0_10px_rgba(75,155,66,0.45)]" />
              User space / ready
            </div>
            <h1 className="mt-6 text-[clamp(48px,7vw,86px)] font-semibold leading-[0.9] tracking-[-0.075em] text-[#163300]">Your loop.</h1>
            <p className="mt-5 max-w-md text-base leading-7 text-[#587052]">Pair a Mac. Keep the work moving.</p>
          </div>

          <Link href={`${dashboardHref}/devices`} className="inline-flex w-fit items-center gap-2 rounded-full border border-[#a6c89c] bg-white/55 px-4 py-2.5 text-sm font-semibold text-[#286323] transition hover:border-[#4b9b42] hover:bg-white hover:text-[#163300]">
            Manage devices
            <FiArrowUpRight aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(260px,0.75fr)]">
          <section className="relative overflow-hidden rounded-[30px] bg-[#163300] p-6 text-[#efffe7] shadow-[0_24px_70px_rgba(22,51,0,0.18)] sm:p-8">
            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#9fe870]/20 blur-3xl" />
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#b9f57b] text-[#163300]">
                  <FiRefreshCw className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#b9f57b]/25 bg-[#b9f57b]/10 px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#b9f57b]">
                  <FiCheckCircle aria-hidden="true" />
                  Active
                </span>
              </div>
              <p className="mt-10 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#b9f57b]/70">Account status</p>
              <h2 className="mt-3 max-w-lg text-[clamp(28px,4vw,46px)] font-semibold leading-[0.98] tracking-[-0.06em]">Ready for the next handoff.</h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/58">Your approved connections stay visible here.</p>

              <div className="mt-8 grid gap-2 sm:grid-cols-3">
                {[
                  { label: "Bounded access", icon: FiShield },
                  { label: "Local bridge", icon: FiMonitor },
                  { label: "Fast return", icon: FiZap },
                ].map(({ label, icon: Icon }) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/5 px-3.5 py-3">
                    <Icon className="h-4 w-4 text-[#b9f57b]" aria-hidden="true" />
                    <p className="mt-3 font-mono text-[9px] font-bold uppercase tracking-[0.13em] text-white/48">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="flex flex-col justify-between rounded-[30px] border border-[#cddfc8] bg-white/70 p-6 shadow-[0_18px_60px_rgba(22,51,0,0.07)] sm:p-8">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#dff3d7] text-[#286323]">
                <FiMonitor className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="mt-8 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#4a8e3d]">Next step</p>
              <h2 className="mt-3 text-3xl font-semibold leading-none tracking-[-0.06em] text-[#163300]">Pair a Mac.</h2>
              <p className="mt-4 text-sm leading-6 text-[#587052]">One code. One approved connection.</p>
            </div>
            <Link href={`${dashboardHref}/devices`} className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-[#163300] px-4 py-2.5 text-sm font-bold text-[#b9f57b] transition hover:bg-[#214d0a]">
              Open pairing
              <FiArrowUpRight aria-hidden="true" />
            </Link>
          </section>
        </div>

        <PairThisMac />
      </div>
    </div>
  );
}
