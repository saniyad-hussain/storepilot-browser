import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { requireMembership } from "@/lib/permissions";
import { updateWorkspaceSchema } from "@/lib/validation";
import { handleApiError, parseBody } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

type Params = { params: { workspaceId: string } };

/** PATCH /api/workspaces/[workspaceId] — update workspace settings (ADMIN+). */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const userId = await getCurrentUserId();
    const membership = await requireMembership(userId, params.workspaceId, "ADMIN");

    const data = await parseBody(req, updateWorkspaceSchema);
    const workspace = await prisma.workspace.update({
      where: { id: params.workspaceId },
      data: { name: data.name.trim() },
    });

    await logAudit({
      workspaceId: membership.workspaceId,
      userId,
      action: "workspace.updated",
      entityType: "Workspace",
      entityId: workspace.id,
      metadata: { name: workspace.name },
    });

    return NextResponse.json({ workspace });
  } catch (err) {
    return handleApiError(err);
  }
}
