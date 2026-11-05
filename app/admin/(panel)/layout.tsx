import { AdminHeader } from "@/components/layout/admin-header";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

// Admin shell: header + side menu. Access is checked by requireAdmin() in the header
// and again in every page and action (ARCHITECTURE §2.7).
export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminHeader />
      <div className="flex flex-1 flex-col md:flex-row">
        <AdminSidebar />
        <main className="min-w-0 flex-1 p-4 sm:p-8">{children}</main>
      </div>
    </>
  );
}
