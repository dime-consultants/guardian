// app/users/page.tsx
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import UsersPage from "@/components/pages/users-page";

export default function UsersManagement() {
  return (
    <DashboardLayout>
      <UsersPage />
    </DashboardLayout>
  );
}
