import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DashboardHome } from "@/components/dashboard/dashboard-home";

export default function HomePage() {
  return (
    <DashboardLayout>
      <DashboardHome />
    </DashboardLayout>
  );
}
