import AppLayout from "@/components/layout/AppLayout";
import AccountDashboard from "@/components/dashboard/AccountDashboard";

export default function DashboardPage() {
  return (
    <AppLayout>
      <AccountDashboard dashboardHref="/dashboard" />
    </AppLayout>
  );
}
