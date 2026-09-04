import AppLayout from "@/components/layout/AppLayout";
import ContractsDashboard from "@/components/dashboard/ContractsDashboard";

export default function ContractsPage() {
  return (
    <AppLayout>
      <ContractsDashboard dashboardHref="/dashboard" />
    </AppLayout>
  );
}
