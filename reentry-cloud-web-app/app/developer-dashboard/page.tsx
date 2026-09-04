"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DeveloperPortal from "@/components/developer/DeveloperPortal";
import {
  fetchCurrentDeveloper,
  logoutDeveloper,
  type Developer,
} from "@/lib/api/developer-auth";

export default function DeveloperDashboardPage() {
  const router = useRouter();
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchCurrentDeveloper()
      .then((response) => setDeveloper(response.data))
      .catch(() => router.replace("/developer-login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading || !developer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08110b] text-[#efffe7]">
        <div className="flex items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#b9f57b] shadow-[0_0_14px_#b9f57b]" />
          Opening developer space
        </div>
      </div>
    );
  }

  async function logout() {
    await logoutDeveloper().catch(() => undefined);
    router.replace("/");
  }

  return <DeveloperPortal developer={developer} onLogout={() => void logout()} />;
}
