import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { requireMembership } from "@/lib/permissions";
import { replyTemplateSchema } from "@/lib/validation";
import { handleApiError, parseBody } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

type Params = { params: { workspaceId: string } };

/** GET — list reply templates (any member). */
export async function GET(_req: Request, { params }: Params) {
  try {
    const userId = await getCurrentUserId();
    await requireMembership(userId, params.workspaceId, "VIEWER");

    const templates = await prisma.replyTemplate.findMany({
      where: { workspaceId: params.workspaceId },
      include: { store: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ templates });
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST — create template (MANAGER+). */
export async function POST(req: Request, { params }: Params) {
  try {
    const userId = await getCurrentUserId();
    const membership = await requireMembership(userId, params.workspaceId, "MANAGER");

    const data = await parseBody(req, replyTemplateSchema);
    const template = await prisma.replyTemplate.create({
      data: {
        workspaceId: params.workspaceId,
        storeId: data.storeId ?? null,
        title: data.title.trim(),
        body: data.body,
        category: data.category || null,
      },
    });

    await logAudit({
      workspaceId: membership.workspaceId,
      userId,
      action: "template.created",
      entityType: "ReplyTemplate",
      entityId: template.id,
      metadata: { title: template.title },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
