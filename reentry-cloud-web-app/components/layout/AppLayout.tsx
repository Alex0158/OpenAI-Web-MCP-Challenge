"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/lib/UserContext";
import WorkspaceTopBar from "@/components/layout/WorkspaceTopBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useUser();
  const isUserDashboard = pathname.startsWith("/user-dashboard");
  const dashboardHref = isUserDashboard ? "/user-dashboard" : "/dashboard";

  useEffect(() => {
    if (!loading && !user) {
      router.replace(isUserDashboard ? "/user-login" : "/login");
    }
  }, [isUserDashboard, loading, router, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08110b] text-[#efffe7]">
        <div className="flex items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#b9f57b] shadow-[0_0_14px_#b9f57b]" />
          Opening your loop
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#eef7e8] text-[#0e0f0c]">
      <WorkspaceTopBar
        dashboardHref={dashboardHref}
        userEmail={user.email}
        onLogout={() => void logout()}
      />

      <main className="min-h-[calc(100vh-76px)] overflow-auto">{children}</main>
    </div>
  );
}
