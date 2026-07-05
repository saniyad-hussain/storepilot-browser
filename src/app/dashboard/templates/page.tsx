import { prisma } from "@/lib/prisma";
import { requireDashboardContext } from "@/lib/dashboard";
import { roleAtLeast } from "@/lib/permissions";
import { TemplatesClient } from "./templates-client";

export default async function TemplatesPage() {
  const { workspace, role } = await requireDashboardContext();

  const [templates, stores] = await Promise.all([
    prisma.replyTemplate.findMany({
      where: { workspaceId: workspace.id },
      include: { store: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.store.findMany({
      where: { workspaceId: workspace.id },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <TemplatesClient
      workspaceId={workspace.id}
      canManage={roleAtLeast(role, "MANAGER")}
      stores={stores}
      initialTemplates={templates.map((t) => ({
        id: t.id,
        title: t.title,
        body: t.body,
        category: t.category,
        storeId: t.storeId,
        storeName: t.store?.name ?? null,
      }))}
    />
  );
}
