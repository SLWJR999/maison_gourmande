import { count, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { getPermissions, requireUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const permissions = getPermissions(user.role);
  const [pending] = await getDb()
    .select({ total: count() })
    .from(orders)
    .where(eq(orders.status, "PENDING"));

  return (
    <AdminShell
      user={{ name: user.name, email: user.email, role: user.role }}
      permissions={permissions}
      pendingOrders={Number(pending?.total ?? 0)}
    >
      {children}
    </AdminShell>
  );
}
