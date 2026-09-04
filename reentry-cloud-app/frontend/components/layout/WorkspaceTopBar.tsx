"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiActivity,
  FiBookOpen,
  FiFileText,
  FiGrid,
  FiLogOut,
  FiMonitor,
} from "react-icons/fi";
import { Logo } from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";

type WorkspaceTopBarProps = {
  dashboardHref?: string;
  userEmail?: string;
  onLogout?: () => void;
};

export default function WorkspaceTopBar({
  dashboardHref = "/user-dashboard",
  userEmail,
  onLogout,
}: WorkspaceTopBarProps) {
  const pathname = usePathname() ?? "";
  const isSignedIn = Boolean(userEmail && onLogout);
  const navItems = [
    { href: dashboardHref, label: "Overview", icon: FiGrid, active: pathname === dashboardHref },
    {
      href: `${dashboardHref}/devices`,
      label: "Devices",
      icon: FiMonitor,
      active: pathname === `${dashboardHref}/devices`,
    },
    {
      href: `${dashboardHref}/contracts`,
      label: "Contracts",
      icon: FiFileText,
      active: pathname === `${dashboardHref}/contracts`,
    },
    { href: "/docs", label: "Guide", icon: FiBookOpen, active: pathname === "/docs" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#08110b]/95 text-[#efffe7] shadow-[0_16px_45px_rgba(7,16,11,0.12)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-[76px] max-w-7xl items-center gap-4 px-5 sm:px-8">
        <Link
          href={dashboardHref}
          className="flex shrink-0 items-center gap-3 whitespace-nowrap"
          aria-label="re-entry cloud dashboard"
        >
          <Logo className="h-9 w-9" />
          <span className="text-[17px] font-bold tracking-[-0.04em] text-white">re-entry</span>
          <span className="-ml-2 mt-3 text-[9px] font-bold uppercase tracking-[0.24em] text-[#9fe870]">
            cloud
          </span>
        </Link>

        <div className="hidden items-center gap-2 border-l border-white/10 pl-5 xl:flex">
          <FiActivity className="h-3.5 w-3.5 text-[#b9f57b]" aria-hidden="true" />
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-white/42">
            {isSignedIn ? "Account console" : "The return path"}
          </span>
        </div>

        <nav
          className="flex min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto px-1"
          aria-label="Workspace navigation"
        >
          {navItems.map(({ href, label, icon: Icon, active }) => (
            <Link
              key={label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2.5 text-sm font-semibold transition ${
                active
                  ? "bg-[#b9f57b] text-[#163300] shadow-[0_0_22px_rgba(185,245,123,0.16)]"
                  : "text-white/58 hover:bg-white/8 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          {isSignedIn ? (
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 lg:flex">
              <span
                className="h-1.5 w-1.5 rounded-full bg-[#b9f57b] shadow-[0_0_10px_#b9f57b]"
                aria-hidden="true"
              />
              <span className="max-w-[170px] truncate text-xs font-semibold text-white/65">
                {userEmail}
              </span>
            </div>
          ) : (
            <Link
              href="/user-login"
              className="hidden text-sm font-semibold text-white/65 transition hover:text-white sm:inline"
            >
              Sign in
            </Link>
          )}
          <ThemeToggle className="text-white/65 hover:bg-white/10" iconClassName="text-[#b9f57b]" />
          {isSignedIn ? (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex h-10 items-center gap-2 rounded-full px-2.5 text-sm font-semibold text-white/60 transition hover:bg-[#3a1515] hover:text-[#ffb4ad] sm:px-3"
              aria-label="Log out"
              title="Log out"
            >
              <FiLogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          ) : (
            <Link
              href="/user-register"
              className="inline-flex items-center gap-2 rounded-full bg-[#b9f57b] px-3.5 py-2.5 text-sm font-bold text-[#163300] transition hover:bg-[#d5ffad] sm:px-4"
            >
              <span className="hidden sm:inline">Start connecting</span>
              <span className="sm:hidden">Start</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
