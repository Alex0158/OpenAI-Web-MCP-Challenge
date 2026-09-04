"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  FiArrowLeft,
  FiArrowUpRight,
  FiCheckCircle,
  FiCode,
  FiMonitor,
  FiShield,
} from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import WebGLHero from "@/components/landing/WebGLHero";
import { Logo } from "@/components/ui/Logo";
import { useUser } from "@/lib/UserContext";
import { getBackendUrl } from "@/lib/api/client";
import {
  fetchCurrentDeveloper,
  loginDeveloper,
  registerDeveloper,
} from "@/lib/api/developer-auth";
import { loginUser, registerUser } from "@/lib/api/user-auth";

type AccountKind = "user" | "developer";
type AuthMode = "login" | "register";

function getSafeConsentReturnTo(): string | null {
  if (typeof window === "undefined") return null;

  const requested = new URLSearchParams(window.location.search).get("return_to");
  if (!requested) return null;

  try {
    const backendOrigin = new URL(getBackendUrl(), window.location.origin).origin;
    const target = new URL(requested, backendOrigin);
    if (target.origin !== backendOrigin || target.pathname !== "/consent") return null;
    if (!target.searchParams.get("token")) return null;
    return target.toString();
  } catch {
    return null;
  }
}

const copy: Record<
  AccountKind,
  {
    eyebrow: string;
    title: string;
    description: string;
    visualTitle: string;
    visualDescription: string;
    switchPath: string;
    switchLabel: string;
  }
> = {
  user: {
    eyebrow: "User access",
    title: "Back to the loop.",
    description: "Pair a Mac and keep the work moving.",
    visualTitle: "Your work has a way back.",
    visualDescription: "Connect once. Return to the work when it matters.",
    switchPath: "/developer-login",
    switchLabel: "Developer access",
  },
  developer: {
    eyebrow: "Developer access",
    title: "Build the return path.",
    description: "Ship human-approved agent flows.",
    visualTitle: "Make the web part of the workflow.",
    visualDescription: "A bounded bridge for tools, pages, and progress.",
    switchPath: "/login",
    switchLabel: "User access",
  },
};

export default function AuthPage({
  kind,
  initialMode = "login",
}: {
  kind: AccountKind;
  initialMode?: AuthMode;
}) {
  const { user, loading: userLoading } = useUser();
  const [isRegistering, setIsRegistering] = useState(initialMode === "register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [developerSessionLoading, setDeveloperSessionLoading] = useState(true);
  const checkingSession = kind === "user" ? userLoading : developerSessionLoading;
  const accountCopy = copy[kind];

  useEffect(() => {
    if (kind !== "user" || userLoading) return;
    if (user) {
      const consentReturnTo = getSafeConsentReturnTo();
      window.location.replace(consentReturnTo ?? "/user-dashboard");
    }
  }, [kind, user, userLoading]);

  useEffect(() => {
    if (kind !== "developer") return;
    let active = true;
    void fetchCurrentDeveloper()
      .then(() => {
        if (!active) return;
        window.location.replace("/developer-dashboard");
      })
      .catch(() => {
        if (active) setDeveloperSessionLoading(false);
      });

    return () => {
      active = false;
    };
  }, [kind]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (kind === "user") {
        if (isRegistering) {
          await registerUser(email, password);
        } else {
          await loginUser(email, password);
        }
      } else if (isRegistering) {
        await registerDeveloper(email, password);
      } else {
        await loginDeveloper(email, password);
      }

      const consentReturnTo = kind === "user" ? getSafeConsentReturnTo() : null;
      const defaultDestination =
        kind === "developer"
          ? "/developer-dashboard"
          : window.location.pathname.startsWith("/user-")
            ? "/user-dashboard"
            : "/dashboard";
      window.location.assign(consentReturnTo ?? defaultDestination);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#08110b] text-[#efffe7] lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]">
      <section className="relative hidden min-h-screen overflow-hidden border-r border-white/10 lg:flex lg:flex-col">
        <WebGLHero />
        <div className="relative z-10 flex min-h-screen flex-col justify-between p-8 xl:p-12">
          <Link href="/" className="flex w-fit items-center gap-3" aria-label="Back to re-entry cloud home">
            <Logo className="h-10 w-10" />
            <span className="text-lg font-bold tracking-[-0.05em] text-white">re-entry</span>
            <span className="-ml-2 mt-3 text-[9px] font-bold uppercase tracking-[0.24em] text-[#9fe870]">cloud</span>
          </Link>

          <div className="max-w-xl pb-4">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#9fe870]/30 bg-[#9fe870]/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#b9f57b]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#b9f57b]" />
              {kind === "user" ? "Human-approved / local bridge" : "WebMCP / integration surface"}
            </div>
            <h2 className="max-w-2xl text-[clamp(44px,6vw,82px)] font-semibold leading-[0.94] tracking-[-0.075em] text-white">
              {accountCopy.visualTitle}
            </h2>
            <p className="mt-6 max-w-md text-base leading-7 text-white/60">{accountCopy.visualDescription}</p>

            <div className="mt-9 grid max-w-lg grid-cols-3 gap-2">
              {[
                { label: "Bounded", icon: FiShield },
                { label: "Page-aware", icon: FiMonitor },
                { label: "Open web", icon: FiCheckCircle },
              ].map(({ label, icon: Icon }) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-[#07100c]/55 px-3 py-3 backdrop-blur">
                  <Icon className="h-4 w-4 text-[#b9f57b]" aria-hidden="true" />
                  <p className="mt-3 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-white/48">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative flex min-h-screen flex-col bg-[#eef7e8] text-[#0e0f0c]">
        <div className="flex items-center justify-between p-5 sm:p-8 lg:justify-end">
          <Link href="/" className="flex items-center gap-2.5 lg:hidden" aria-label="re-entry cloud home">
            <Logo className="h-9 w-9" />
            <span className="text-[17px] font-bold tracking-[-0.04em] text-[#163300]">re-entry</span>
            <span className="-ml-2 mt-3 text-[8px] font-bold uppercase tracking-[0.22em] text-[#4a8e3d]">cloud</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#3f613a] transition hover:text-[#163300]">
            <FiArrowLeft aria-hidden="true" />
            <span>Home</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-12 sm:px-10 lg:px-14 lg:pb-20">
          <div className="w-full max-w-[470px]">
            <div className="rounded-[32px] border border-[#d1e2cc] bg-white/80 p-6 shadow-[0_24px_90px_rgba(22,51,0,0.12)] backdrop-blur-xl sm:p-9">
              <div className="flex items-center justify-between gap-4">
                <div className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#4a8e3d]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#4b9b42] shadow-[0_0_10px_rgba(75,155,66,0.55)]" />
                  {accountCopy.eyebrow}
                </div>
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#839a7c]">Re-entry Cloud</span>
              </div>

              {checkingSession ? (
                <div className="flex min-h-[410px] items-center justify-center" role="status">
                  <div className="flex items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#5f7b59]">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#4b9b42] shadow-[0_0_12px_rgba(75,155,66,0.45)]" />
                    Restoring session
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-8">
                    <h1 className="text-[clamp(38px,5vw,56px)] font-semibold leading-[0.94] tracking-[-0.065em] text-[#163300]">
                      {isRegistering ? "Enter the loop." : accountCopy.title}
                    </h1>
                    <p className="mt-4 max-w-sm text-base leading-7 text-[#587052]">{accountCopy.description}</p>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-9 space-y-5">
                <label className="block space-y-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#3f613a]">
                  Email
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="!border-[#b8cfb2] !bg-white/90 !text-[#0e0f0c] placeholder:!text-[#7a8d76] focus:!border-[#163300] focus:!ring-[#163300]/15"
                    required
                  />
                </label>

                <label className="block space-y-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#3f613a]">
                  Password
                  <Input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete={isRegistering ? "new-password" : "current-password"}
                    minLength={8}
                    maxLength={72}
                    className="!border-[#b8cfb2] !bg-white/90 !text-[#0e0f0c] placeholder:!text-[#7a8d76] focus:!border-[#163300] focus:!ring-[#163300]/15"
                    required
                  />
                </label>

                {error ? (
                  <p role="alert" className="rounded-2xl border border-[#e7aaa2] bg-[#fff1ef] px-4 py-3 text-sm leading-6 text-[#9b3029]">
                    {error}
                  </p>
                ) : null}

                <Button
                  type="submit"
                  className="!mt-7 w-full !bg-[#163300] !text-[#b9f57b] shadow-[0_14px_28px_rgba(22,51,0,0.18)] hover:!bg-[#214d0a]"
                  isLoading={isSubmitting}
                >
                  {isRegistering ? "Create account" : "Sign in"}
                  <FiArrowUpRight aria-hidden="true" />
                </Button>
                  </form>

                  <div className="mt-7 flex flex-col gap-4 border-t border-[#dbe8d7] pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      className="text-left font-semibold text-[#587052] transition hover:text-[#163300]"
                      onClick={() => {
                        setIsRegistering((current) => !current);
                        setError(null);
                      }}
                    >
                      {isRegistering ? "Already have an account? Sign in" : "Need an account? Register"}
                    </button>
                    <Link href={accountCopy.switchPath} className="inline-flex items-center gap-1.5 font-semibold text-[#3b7c35] transition hover:text-[#163300]">
                      {accountCopy.switchLabel}
                      {kind === "developer" ? <FiCode aria-hidden="true" /> : <FiArrowUpRight aria-hidden="true" />}
                    </Link>
                  </div>
                </>
              )}
            </div>

            <p className="mt-5 text-center font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#7c9376]">
              One account · one clear return path
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
