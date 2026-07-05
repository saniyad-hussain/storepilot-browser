import { prisma } from "@/lib/prisma";
import { requireDashboardContext } from "@/lib/dashboard";
import { roleAtLeast } from "@/lib/permissions";
import { TeamClient } from "./team-client";

export default async function TeamPage() {
  const { workspace, role, userId } = await requireDashboardContext();

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: workspace.id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <TeamClient
      workspaceId={workspace.id}
      currentUserId={userId}
      canManage={roleAtLeast(role, "ADMIN")}
      initialMembers={members.map((m) => ({
        id: m.id,
        role: m.role,
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
      }))}
    />
  );
}
