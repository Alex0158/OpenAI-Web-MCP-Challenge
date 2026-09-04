"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiChevronRight,
  FiFileText,
  FiGlobe,
  FiLink,
  FiLock,
  FiShield,
} from "react-icons/fi";

type ApprovedContract = {
  id: string;
  siteName: string;
  domain: string;
  initials: string;
  title: string;
  approvedOn: string;
  scopes: string[];
};

const approvedContracts: ApprovedContract[] = [
  {
    id: "northstar-booking",
    siteName: "Northstar Travel",
    domain: "northstar.example",
    initials: "NT",
    title: "Finish a saved booking",
    approvedOn: "Sep 3, 2026",
    scopes: ["Read the current booking", "Submit the selected option"],
  },
  {
    id: "atlas-order",
    siteName: "Atlas Commerce",
    domain: "atlas.example",
    initials: "AC",
    title: "Complete a prepared order",
    approvedOn: "Sep 2, 2026",
    scopes: ["Read the prepared cart", "Navigate to order review"],
  },
  {
    id: "cedar-profile",
    siteName: "Cedar Workspace",
    domain: "cedar.example",
    initials: "CW",
    title: "Update a workspace profile",
    approvedOn: "Sep 1, 2026",
    scopes: ["Read the profile draft", "Save the approved fields"],
  },
];

export default function ContractsDashboard({ dashboardHref = "/user-dashboard" }: { dashboardHref?: string }) {
  const [selectedId, setSelectedId] = useState(approvedContracts[0].id);
  const selectedContract = approvedContracts.find((contract) => contract.id === selectedId) ?? approvedContracts[0];

  return (
    <div
      data-testid="contracts-dashboard"
      className="relative isolate min-h-full overflow-hidden bg-[#eef7e8] text-[#0e0f0c]"
    >
      <div className="pointer-events-none absolute -left-48 -top-40 -z-10 h-[30rem] w-[30rem] rounded-full bg-[#9fe870]/25 blur-3xl" />
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
                <span className="h-1.5 w-1.5 rounded-full bg-[#4b9b42] shadow-[0_0_10px_rgba(75,155,66,0.45)]" />
                Contracts / approved websites
              </div>
            <h1 className="mt-5 text-[clamp(44px,6vw,78px)] font-semibold leading-[0.9] tracking-[-0.075em] text-[#163300]">
              Approved websites.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#587052]">
              Approve a website once. Your connected contracts live here.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#a6c89c] bg-[#e2f6d5] px-4 py-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#286323] shadow-[0_12px_32px_rgba(22,51,0,0.05)]">
            <FiCheckCircle aria-hidden="true" />
            {approvedContracts.length} approved
          </div>
        </div>

        <section className="mt-10 overflow-hidden rounded-[30px] border border-[#cddfc8] bg-white/75 shadow-[0_24px_80px_rgba(22,51,0,0.09)]">
          <div className="flex flex-col gap-4 border-b border-[#dbe8d7] px-5 py-5 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#4a8e3d]">Your contracts</p>
              <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#163300]">One per website</h2>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#dbe8d7] bg-[#f7fbf4] px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#71866d]">
              <FiGlobe aria-hidden="true" />
              Approved only
            </span>
          </div>

          <div className="grid lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
            <div className="border-b border-[#dbe8d7] bg-[#f7fbf4] p-4 sm:p-6 lg:border-b-0 lg:border-r">
              <div className="space-y-2">
                {approvedContracts.map((contract) => {
                  const isSelected = contract.id === selectedContract.id;
                  return (
                    <button
                      key={contract.id}
                      type="button"
                      onClick={() => setSelectedId(contract.id)}
                      aria-pressed={isSelected}
                      className={`group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                        isSelected
                          ? "border-[#8fbd83] bg-white shadow-[0_12px_28px_rgba(22,51,0,0.08)]"
                          : "border-transparent hover:border-[#dbe8d7] hover:bg-white/75"
                      }`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#163300] font-mono text-[10px] font-bold text-[#b9f57b]">
                        {contract.initials}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-[#163300]">{contract.siteName}</span>
                        <span className="mt-1 block truncate text-xs text-[#7b9077]">{contract.title}</span>
                        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#a6c89c] bg-[#e2f6d5] px-2 py-1 text-[10px] font-semibold text-[#286323]">
                          <FiCheckCircle aria-hidden="true" />
                          Approved
                        </span>
                      </span>
                      <FiChevronRight className={`h-4 w-4 shrink-0 transition ${isSelected ? "text-[#4b9b42]" : "text-[#b1c2ac] group-hover:text-[#4b9b42]"}`} aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
              <p className="mt-5 flex items-center gap-2 px-2 text-xs leading-5 text-[#7b9077]">
                <FiGlobe className="h-3.5 w-3.5 shrink-0 text-[#4a8e3d]" aria-hidden="true" />
                Each website appears once.
              </p>
            </div>

            <article className="bg-white/80 p-5 sm:p-7" aria-live="polite">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#163300] font-mono text-xs font-bold text-[#b9f57b]">
                    {selectedContract.initials}
                  </span>
                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#4a8e3d]">Contract detail</p>
                    <h3 className="mt-1 text-2xl font-semibold tracking-[-0.05em] text-[#163300]">{selectedContract.siteName}</h3>
                    <p className="mt-1 text-xs text-[#7b9077]">{selectedContract.domain}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#a6c89c] bg-[#e2f6d5] px-3 py-1.5 text-xs font-semibold text-[#286323]">
                  <FiCheckCircle aria-hidden="true" />
                  Approved
                </span>
              </div>

              <div className="mt-8 border-b border-[#dbe8d7] pb-6">
                <h4 className="text-xl font-semibold tracking-[-0.04em] text-[#163300]">{selectedContract.title}</h4>
              </div>

              <dl className="grid gap-4 border-b border-[#dbe8d7] py-6 sm:grid-cols-2">
                <div>
                  <dt className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#8aa083]">Website</dt>
                  <dd className="mt-2 text-sm font-semibold text-[#163300]">{selectedContract.domain}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#8aa083]">Approved on</dt>
                  <dd className="mt-2 text-sm font-semibold text-[#163300]">{selectedContract.approvedOn}</dd>
                </div>
              </dl>

              <div className="mt-6">
                <div className="flex items-center gap-2">
                  <FiShield className="h-4 w-4 text-[#4a8e3d]" aria-hidden="true" />
                  <h4 className="font-semibold text-[#163300]">Approved scope</h4>
                </div>
                <ul className="mt-4 space-y-3">
                  {selectedContract.scopes.map((scope) => (
                    <li key={scope} className="flex items-start gap-2 text-sm leading-6 text-[#587052]">
                      <FiCheckCircle className="mt-1 h-3.5 w-3.5 shrink-0 text-[#4b9b42]" aria-hidden="true" />
                      {scope}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-7 flex items-start gap-3 rounded-2xl bg-[#163300] p-4 text-[#efffe7] sm:p-5">
                <div className="flex items-start gap-3">
                  <FiLock className="mt-0.5 h-4 w-4 shrink-0 text-[#b9f57b]" aria-hidden="true" />
                  <p className="text-sm leading-6 text-white/65">You approved this website. It can request only the scope shown above.</p>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="mt-6 rounded-[26px] border border-[#cddfc8] bg-[#dff3d7] p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <FiLink className="h-4 w-4 text-[#286323]" aria-hidden="true" />
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#286323]">Approval flow</p>
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[#163300]">One link, then it&apos;s here.</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              { label: "Website sends the link", icon: FiGlobe },
              { label: "You approve", icon: FiCheckCircle },
              { label: "Website appears here", icon: FiFileText },
            ].map(({ label, icon: Icon }, index) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl border border-[#b8d5ae] bg-white/55 px-4 py-3">
                <span className="font-mono text-[10px] font-bold text-[#4a8e3d]">0{index + 1}</span>
                <Icon className="h-4 w-4 text-[#286323]" aria-hidden="true" />
                <span className="text-sm font-semibold text-[#286323]">{label}</span>
                {index < 2 ? <FiArrowRight className="ml-auto hidden h-4 w-4 text-[#8aa083] md:block" aria-hidden="true" /> : null}
              </div>
            ))}
          </div>
        </section>

        <p className="mt-5 text-center font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#7c9376]">
          Preview data only · approved records will replace this list later
        </p>
      </div>
    </div>
  );
}
