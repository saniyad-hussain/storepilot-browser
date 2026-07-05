import { prisma } from "@/lib/prisma";
import { requireDashboardContext } from "@/lib/dashboard";
import { roleAtLeast } from "@/lib/permissions";
import { SafetyChecksClient } from "./safety-checks-client";

export default async function SafetyChecksPage() {
  const { workspace, role } = await requireDashboardContext();

  const [checks, devices, stores] = await Promise.all([
    prisma.browserSafetyCheck.findMany({
      where: { workspaceId: workspace.id },
      include: {
        device: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
        checkedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.device.findMany({
      where: { workspaceId: workspace.id },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.store.findMany({
      where: { workspaceId: workspace.id },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <SafetyChecksClient
      workspaceId={workspace.id}
      canManage={roleAtLeast(role, "MANAGER")}
      devices={devices}
      stores={stores}
      initialChecks={checks.map((c) => ({
        id: c.id,
        deviceName: c.device?.name ?? null,
        storeName: c.store?.name ?? null,
        checkedByName: c.checkedBy?.name ?? null,
        chromeUpdated: c.chromeUpdated,
        suspiciousExtensionsRemoved: c.suspiciousExtensionsRemoved,
        savedPasswordRiskReviewed: c.savedPasswordRiskReviewed,
        twoFactorReviewed: c.twoFactorReviewed,
        recoveryInfoReviewed: c.recoveryInfoReviewed,
        notes: c.notes,
        createdAt: c.createdAt.toISOString(),
      }))}
    />
  );
}
