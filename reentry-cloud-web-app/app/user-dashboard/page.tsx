import AppLayout from "@/components/layout/AppLayout";
import AccountDashboard from "@/components/dashboard/AccountDashboard";

export default function UserDashboardPage() {
  return (
    <AppLayout>
      <AccountDashboard dashboardHref="/user-dashboard" />
    </AppLayout>
  );
}
