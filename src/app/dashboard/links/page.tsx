import { prisma } from "@/lib/prisma";
import { requireDashboardContext } from "@/lib/dashboard";
import { roleAtLeast } from "@/lib/permissions";
import { LinksClient } from "./links-client";

export default async function LinksPage() {
  const { workspace, role } = await requireDashboardContext();

  const [links, stores] = await Promise.all([
    prisma.toolLink.findMany({
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
    <LinksClient
      workspaceId={workspace.id}
      canManage={roleAtLeast(role, "MANAGER")}
      stores={stores}
      initialLinks={links.map((l) => ({
        id: l.id,
        title: l.title,
        url: l.url,
        category: l.category,
        description: l.description,
        isSensitive: l.isSensitive,
        storeId: l.storeId,
        storeName: l.store?.name ?? null,
      }))}
    />
  );
}
