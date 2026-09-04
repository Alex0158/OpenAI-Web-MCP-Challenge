"use client";

import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { FiArrowUpRight, FiBookOpen, FiCode, FiGrid } from "react-icons/fi";
import { useUser } from "@/lib/UserContext";
import {
  fetchCurrentDeveloper,
  type Developer,
} from "@/lib/api/developer-auth";

type LandingSession = {
  developer: Developer | null;
  hasUser: boolean;
  loading: boolean;
};

const LandingSessionContext = createContext<LandingSession | null>(null);

export function LandingSessionProvider({ children }: { children: ReactNode }) {
  const { user, loading: userLoading } = useUser();
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [developerLoading, setDeveloperLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void fetchCurrentDeveloper()
      .then((response) => {
        if (active) setDeveloper(response.data);
      })
      .catch(() => {
        if (active) setDeveloper(null);
      })
      .finally(() => {
        if (active) setDeveloperLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <LandingSessionContext.Provider
      value={{
        developer,
        hasUser: Boolean(user),
        loading: userLoading || developerLoading,
      }}
    >
      {children}
    </LandingSessionContext.Provider>
  );
}

function useLandingSession(): LandingSession {
  const value = useContext(LandingSessionContext);
  if (!value) {
    throw new Error("Landing session actions must be inside LandingSessionProvider");
  }
  return value;
}

function SessionCheck({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 font-mono font-bold uppercase tracking-[0.16em] text-white/40 ${compact ? "text-[9px]" : "text-[10px]"}`}
      role="status"
    >
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#b9f57b]" />
      <span className={compact ? "sr-only" : ""}>Checking session</span>
    </span>
  );
}

export function LandingHeaderActions() {
  const { developer, hasUser, loading } = useLandingSession();
  if (loading) return <SessionCheck compact />;

  if (hasUser || developer) {
    const primaryHref = hasUser ? "/user-dashboard" : "/developer-dashboard";
    const primaryLabel = hasUser ? "Dashboard" : "Developer portal";
    return (
      <div className="flex items-center gap-2 sm:gap-4">
        {hasUser && developer ? (
          <Link
            className="hidden items-center gap-1.5 text-sm font-semibold text-white/70 transition hover:text-white sm:inline-flex"
            href="/developer-dashboard"
          >
            <FiCode aria-hidden="true" />
            Developer
          </Link>
        ) : (
          <Link
            className="hidden text-sm font-semibold text-white/70 transition hover:text-white sm:inline"
            href={developer ? "/developer-dashboard#sdk-docs" : "/docs"}
          >
            {developer ? "SDK docs" : "Guide"}
          </Link>
        )}
        <Link
          className="inline-flex items-center gap-2 rounded-full bg-[#b9f57b] px-4 py-2.5 text-sm font-bold text-[#163300] transition hover:bg-[#d5ffad] hover:shadow-[0_0_30px_rgba(185,245,123,0.2)]"
          href={primaryHref}
        >
          <FiGrid aria-hidden="true" />
          <span className="hidden sm:inline">{primaryLabel}</span>
          <span className="sm:hidden">Open</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-4">
      <Link className="hidden text-sm font-semibold text-white/70 transition hover:text-white sm:inline" href="/user-login">
        Sign in
      </Link>
      <Link
        className="inline-flex items-center gap-2 rounded-full bg-[#b9f57b] px-4 py-2.5 text-sm font-bold text-[#163300] transition hover:bg-[#d5ffad] hover:shadow-[0_0_30px_rgba(185,245,123,0.2)]"
        href="/user-register"
      >
        <span className="hidden sm:inline">Start connecting</span>
        <span className="sm:hidden">Start</span>
        <FiArrowUpRight aria-hidden="true" />
      </Link>
    </div>
  );
}

export function LandingHeroActions() {
  const { developer, hasUser, loading } = useLandingSession();
  if (loading) return <SessionCheck />;

  const signedIn = hasUser || Boolean(developer);
  const primaryHref = hasUser
    ? "/user-dashboard"
    : developer
      ? "/developer-dashboard"
      : "/user-register";
  const primaryLabel = hasUser
    ? "Open dashboard"
    : developer
      ? "Open developer portal"
      : "Enter the loop";
  const SecondaryIcon = developer && !hasUser ? FiBookOpen : FiArrowUpRight;
  const secondaryHref = developer && !hasUser
    ? "/developer-dashboard#sdk-docs"
    : signedIn
      ? "#loop"
      : "/user-login";
  const secondaryLabel = developer && !hasUser
    ? "SDK docs"
    : signedIn
      ? "See the loop"
      : "Sign in";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href={primaryHref}
        className="inline-flex items-center gap-2 rounded-full bg-[#b9f57b] px-5 py-3 text-sm font-bold text-[#163300] transition hover:bg-[#d5ffad] hover:shadow-[0_0_34px_rgba(185,245,123,0.25)]"
      >
        {primaryLabel}
        <FiArrowUpRight aria-hidden="true" />
      </Link>
      <Link
        href={secondaryHref}
        className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white/75 transition hover:border-white/35 hover:text-white"
      >
        {secondaryLabel}
        <SecondaryIcon aria-hidden="true" />
      </Link>
    </div>
  );
}

export function LandingFinalAction() {
  const { developer, hasUser, loading } = useLandingSession();
  if (loading) {
    return <span className="inline-flex min-h-11 items-center"><SessionCheck /></span>;
  }

  return (
    <Link
      href={hasUser ? "/user-dashboard" : developer ? "/developer-dashboard" : "/user-register"}
      className="inline-flex w-fit items-center gap-2 rounded-full bg-[#163300] px-5 py-3 text-sm font-bold text-[#b9f57b] transition hover:bg-[#274d0c]"
    >
      {hasUser ? "Open dashboard" : developer ? "Open developer portal" : "Create your loop"}
      <FiArrowUpRight aria-hidden="true" />
    </Link>
  );
}
