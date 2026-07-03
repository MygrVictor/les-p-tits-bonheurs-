import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { auth } from "@/lib/auth";

export default async function AdminSectionLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar />
      <main className="ml-0 px-4 py-8 lg:ml-72 lg:px-8">{children}</main>
    </div>
  );
}
