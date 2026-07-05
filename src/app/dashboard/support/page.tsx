import { prisma } from "@/lib/prisma";
import { requireDashboardContext } from "@/lib/dashboard";
import { roleAtLeast } from "@/lib/permissions";
import { SupportClient } from "./support-client";

export default async function SupportPage() {
  const { workspace, role } = await requireDashboardContext();

  const [requests, stores] = await Promise.all([
    prisma.supportRequest.findMany({
      where: { workspaceId: workspace.id },
      include: {
        store: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
        device: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.store.findMany({
      where: { workspaceId: workspace.id },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <SupportClient
      workspaceId={workspace.id}
      canManage={roleAtLeast(role, "MANAGER")}
      stores={stores}
      initialRequests={requests.map((r) => ({
        id: r.id,
        type: r.type,
        message: r.message,
        status: r.status,
        storeId: r.storeId,
        storeName: r.store?.name ?? null,
        userName: r.user?.name ?? null,
        deviceName: r.device?.name ?? null,
        createdAt: r.createdAt.toISOString(),
      }))}
    />
  );
}
