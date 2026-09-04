import AppLayout from "@/components/layout/AppLayout";
import DevicesDashboard from "@/components/dashboard/DevicesDashboard";

export default function UserDevicesPage() {
  return (
    <AppLayout>
      <DevicesDashboard dashboardHref="/user-dashboard" />
    </AppLayout>
  );
}
