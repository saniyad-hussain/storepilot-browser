import { prisma } from "@/lib/prisma";
import { requireDashboardContext } from "@/lib/dashboard";
import { roleAtLeast } from "@/lib/permissions";
import { StoresClient } from "./stores-client";

export default async function StoresPage() {
  const { workspace, role } = await requireDashboardContext();

  const stores = await prisma.store.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <StoresClient
      workspaceId={workspace.id}
      canManage={roleAtLeast(role, "MANAGER")}
      canDelete={roleAtLeast(role, "ADMIN")}
      initialStores={stores.map((s) => ({
        id: s.id,
        name: s.name,
        address: s.address,
        phone: s.phone,
        website: s.website,
        logoUrl: s.logoUrl,
        color: s.color,
        isActive: s.isActive,
      }))}
    />
  );
}
