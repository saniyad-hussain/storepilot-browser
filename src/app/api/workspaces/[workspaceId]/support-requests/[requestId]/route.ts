import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { requireMembership, PermissionError } from "@/lib/permissions";
import { updateSupportRequestSchema } from "@/lib/validation";
import { handleApiError, parseBody } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

type Params = { params: { workspaceId: string; requestId: string } };

/** PATCH — change support request status (MANAGER+). */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const userId = await getCurrentUserId();
    const membership = await requireMembership(userId, params.workspaceId, "MANAGER");

    const existing = await prisma.supportRequest.findFirst({
      where: { id: params.requestId, workspaceId: params.workspaceId },
    });
    if (!existing) throw new PermissionError("Support request not found.", 404);

    const data = await parseBody(req, updateSupportRequestSchema);
    const request = await prisma.supportRequest.update({
      where: { id: params.requestId },
      data: { status: data.status },
    });

    await logAudit({
      workspaceId: membership.workspaceId,
      userId,
      action: "support_request.status_changed",
      entityType: "SupportRequest",
      entityId: request.id,
      metadata: { from: existing.status, to: data.status },
    });

    return NextResponse.json({ request });
  } catch (err) {
    return handleApiError(err);
  }
}
