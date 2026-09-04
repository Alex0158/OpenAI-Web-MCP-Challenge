import Link from "next/link";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiInfo,
  FiLock,
  FiMonitor,
  FiRefreshCw,
  FiShield,
} from "react-icons/fi";
import PairThisMac from "@/components/connectors/PairThisMac";

const deviceFeatures = [
  {
    label: "Paired Macs",
    title: "See every bridge.",
    description: "Authorized Macs stay visible in one place.",
    icon: FiMonitor,
  },
  {
    label: "One-time access",
    title: "Pair with a code.",
    description: "Create a short-lived code for a new connector.",
    icon: FiShield,
  },
  {
    label: "Presence",
    title: "Coming next.",
    description: "Live online and offline status is not connected yet.",
    icon: FiClock,
  },
];

const futureControls = [
  { label: "Revoke access", description: "Disconnect a Mac from this account.", icon: FiLock },
  { label: "Rename device", description: "Give a connected Mac a clear name.", icon: FiMonitor },
  { label: "Activity history", description: "Review the work returned through a Mac.", icon: FiRefreshCw },
];

export default function DevicesDashboard({ dashboardHref = "/user-dashboard" }: { dashboardHref?: string }) {
  return (
    <div
      data-testid="devices-dashboard"
      className="relative isolate min-h-full overflow-hidden bg-[#eef7e8] text-[#0e0f0c]"
    >
      <div className="pointer-events-none absolute -right-40 -top-40 -z-10 h-[30rem] w-[30rem] rounded-full bg-[#9fe870]/25 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(159,232,112,0.22),transparent_68%)]" />

      <div className="relative mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <Link
          href={dashboardHref}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#4a8e3d] transition hover:text-[#163300]"
        >
          <FiArrowLeft aria-hidden="true" />
          Back to overview
        </Link>

        <div className="mt-8 flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#8fbd83] bg-[#dff3d7] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#286323]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#4b9b42] shadow-[0_0_10px_rgba(75,155,66,0.45)]" />
              Devices / control room
            </div>
            <h1 className="mt-5 text-[clamp(44px,6vw,78px)] font-semibold leading-[0.9] tracking-[-0.075em] text-[#163300]">
              Connected, at a glance.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[#587052]">
              Pairing is live today. The rest of your device controls are taking shape here.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#cddfc8] bg-white/70 px-4 py-2.5 text-sm font-semibold text-[#286323] shadow-[0_12px_32px_rgba(22,51,0,0.06)]">
            <FiCheckCircle className="text-[#4b9b42]" aria-hidden="true" />
            Pairing live
          </div>
        </div>

        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {deviceFeatures.map(({ label, title, description, icon: Icon }) => (
            <section
              key={label}
              className="rounded-[24px] border border-[#cddfc8] bg-white/70 p-5 shadow-[0_16px_50px_rgba(22,51,0,0.06)]"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#4a8e3d]">
                  {label}
                </span>
                <Icon className="h-4 w-4 text-[#4b9b42]" aria-hidden="true" />
              </div>
              <h2 className="mt-8 text-xl font-semibold tracking-[-0.04em] text-[#163300]">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#587052]">{description}</p>
            </section>
          ))}
        </div>

        <div className="mt-6">
          <PairThisMac />
        </div>

        <section className="mt-6 overflow-hidden rounded-[30px] border border-[#cddfc8] bg-white/75 shadow-[0_18px_60px_rgba(22,51,0,0.07)]">
          <div className="flex flex-col justify-between gap-3 border-b border-[#dbe8d7] px-5 py-5 sm:flex-row sm:items-center sm:px-7">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#4a8e3d]">Next controls</p>
              <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#163300]">A calmer device desk.</h2>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#e8cf8c] bg-[#fff5d9] px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#8a5d00]">
              Preview UI
            </span>
          </div>

          <div className="grid gap-px bg-[#dbe8d7] md:grid-cols-3">
            {futureControls.map(({ label, description, icon: Icon }) => (
              <div key={label} className="bg-[#f7fbf4] p-5 sm:p-6">
                <Icon className="h-5 w-5 text-[#7b9b74]" aria-hidden="true" />
                <h3 className="mt-6 font-semibold text-[#163300]">{label}</h3>
                <p className="mt-2 text-sm leading-6 text-[#71866d]">{description}</p>
                <button
                  type="button"
                  disabled
                  className="mt-5 inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-[#cddfc8] bg-white px-3.5 py-2 text-xs font-semibold text-[#9aaa95] opacity-80"
                  aria-label={`${label} is coming soon`}
                >
                  Coming soon
                  <FiInfo aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>

          <p className="flex items-center gap-2 border-t border-[#dbe8d7] px-5 py-4 text-xs text-[#7b9077] sm:px-7">
            <FiInfo className="h-3.5 w-3.5 shrink-0 text-[#4a8e3d]" aria-hidden="true" />
            The pairing list above is live. Preview controls do not change account state yet.
          </p>
        </section>
      </div>
    </div>
  );
}
