import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { requireMembership, PermissionError } from "@/lib/permissions";
import { replyTemplateSchema } from "@/lib/validation";
import { handleApiError, parseBody } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

type Params = { params: { workspaceId: string; templateId: string } };

async function findTemplateOrThrow(workspaceId: string, templateId: string) {
  const template = await prisma.replyTemplate.findFirst({
    where: { id: templateId, workspaceId },
  });
  if (!template) throw new PermissionError("Template not found.", 404);
  return template;
}

/** PATCH — update template (MANAGER+). */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const userId = await getCurrentUserId();
    const membership = await requireMembership(userId, params.workspaceId, "MANAGER");
    await findTemplateOrThrow(params.workspaceId, params.templateId);

    const data = await parseBody(req, replyTemplateSchema.partial());
    const template = await prisma.replyTemplate.update({
      where: { id: params.templateId },
      data: {
        ...(data.title !== undefined && { title: data.title.trim() }),
        ...(data.body !== undefined && { body: data.body }),
        ...(data.category !== undefined && { category: data.category || null }),
        ...(data.storeId !== undefined && { storeId: data.storeId }),
      },
    });

    await logAudit({
      workspaceId: membership.workspaceId,
      userId,
      action: "template.updated",
      entityType: "ReplyTemplate",
      entityId: template.id,
      metadata: { title: template.title },
    });

    return NextResponse.json({ template });
  } catch (err) {
    return handleApiError(err);
  }
}

/** DELETE — delete template (MANAGER+). */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const userId = await getCurrentUserId();
    const membership = await requireMembership(userId, params.workspaceId, "MANAGER");
    const template = await findTemplateOrThrow(params.workspaceId, params.templateId);

    await prisma.replyTemplate.delete({ where: { id: params.templateId } });

    await logAudit({
      workspaceId: membership.workspaceId,
      userId,
      action: "template.deleted",
      entityType: "ReplyTemplate",
      entityId: template.id,
      metadata: { title: template.title },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
