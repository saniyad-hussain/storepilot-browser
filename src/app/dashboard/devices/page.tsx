import { prisma } from "@/lib/prisma";
import { requireDashboardContext } from "@/lib/dashboard";
import { roleAtLeast } from "@/lib/permissions";
import { DevicesClient } from "./devices-client";

export default async function DevicesPage() {
  const { workspace, role } = await requireDashboardContext();

  const [devices, stores] = await Promise.all([
    prisma.device.findMany({
      where: { workspaceId: workspace.id },
      include: {
        store: { select: { id: true, name: true } },
        safetyChecks: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.store.findMany({
      where: { workspaceId: workspace.id },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <DevicesClient
      workspaceId={workspace.id}
      canManage={roleAtLeast(role, "MANAGER")}
      stores={stores}
      initialDevices={devices.map((d) => ({
        id: d.id,
        name: d.name,
        extensionInstallId: d.extensionInstallId,
        storeId: d.storeId,
        storeName: d.store?.name ?? null,
        lastSeenAt: d.lastSeenAt?.toISOString() ?? null,
        lastCheckAt: d.safetyChecks[0]?.createdAt.toISOString() ?? null,
      }))}
    />
  );
}
