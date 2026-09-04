import AppLayout from "@/components/layout/AppLayout";
import ContractsDashboard from "@/components/dashboard/ContractsDashboard";

export default function UserContractsPage() {
  return (
    <AppLayout>
      <ContractsDashboard dashboardHref="/user-dashboard" />
    </AppLayout>
  );
}
