import AppLayout from "@/components/layout/AppLayout";
import DevicesDashboard from "@/components/dashboard/DevicesDashboard";

export default function DevicesPage() {
  return (
    <AppLayout>
      <DevicesDashboard dashboardHref="/dashboard" />
    </AppLayout>
  );
}
