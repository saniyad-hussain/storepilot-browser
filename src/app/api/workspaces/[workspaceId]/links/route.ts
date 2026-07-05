import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { requireMembership } from "@/lib/permissions";
import { toolLinkSchema } from "@/lib/validation";
import { handleApiError, parseBody } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

type Params = { params: { workspaceId: string } };

/** GET — list tool links (any member). */
export async function GET(_req: Request, { params }: Params) {
  try {
    const userId = await getCurrentUserId();
    await requireMembership(userId, params.workspaceId, "VIEWER");

    const links = await prisma.toolLink.findMany({
      where: { workspaceId: params.workspaceId },
      include: { store: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ links });
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST — create tool link (MANAGER+). URL is sanitized to http/https only. */
export async function POST(req: Request, { params }: Params) {
  try {
    const userId = await getCurrentUserId();
    const membership = await requireMembership(userId, params.workspaceId, "MANAGER");

    const data = await parseBody(req, toolLinkSchema);

    const link = await prisma.toolLink.create({
      data: {
        workspaceId: params.workspaceId,
        storeId: data.storeId ?? null,
        title: data.title.trim(),
        url: data.url,
        category: data.category,
        description: data.description || null,
        isSensitive: data.isSensitive ?? false,
      },
    });

    await logAudit({
      workspaceId: membership.workspaceId,
      userId,
      action: "tool_link.created",
      entityType: "ToolLink",
      entityId: link.id,
      metadata: { title: link.title, url: link.url },
    });

    return NextResponse.json({ link }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
