import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { requireMembership, PermissionError } from "@/lib/permissions";
import { toolLinkSchema } from "@/lib/validation";
import { handleApiError, parseBody } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

type Params = { params: { workspaceId: string; linkId: string } };

async function findLinkOrThrow(workspaceId: string, linkId: string) {
  const link = await prisma.toolLink.findFirst({ where: { id: linkId, workspaceId } });
  if (!link) throw new PermissionError("Link not found.", 404);
  return link;
}

/** PATCH — update tool link (MANAGER+). */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const userId = await getCurrentUserId();
    const membership = await requireMembership(userId, params.workspaceId, "MANAGER");
    await findLinkOrThrow(params.workspaceId, params.linkId);

    const data = await parseBody(req, toolLinkSchema.partial());
    const link = await prisma.toolLink.update({
      where: { id: params.linkId },
      data: {
        ...(data.title !== undefined && { title: data.title.trim() }),
        ...(data.url !== undefined && { url: data.url }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.storeId !== undefined && { storeId: data.storeId }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.isSensitive !== undefined && { isSensitive: data.isSensitive }),
      },
    });

    await logAudit({
      workspaceId: membership.workspaceId,
      userId,
      action: "tool_link.updated",
      entityType: "ToolLink",
      entityId: link.id,
      metadata: { title: link.title },
    });

    return NextResponse.json({ link });
  } catch (err) {
    return handleApiError(err);
  }
}

/** DELETE — delete tool link (MANAGER+). */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const userId = await getCurrentUserId();
    const membership = await requireMembership(userId, params.workspaceId, "MANAGER");
    const link = await findLinkOrThrow(params.workspaceId, params.linkId);

    await prisma.toolLink.delete({ where: { id: params.linkId } });

    await logAudit({
      workspaceId: membership.workspaceId,
      userId,
      action: "tool_link.deleted",
      entityType: "ToolLink",
      entityId: link.id,
      metadata: { title: link.title },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
