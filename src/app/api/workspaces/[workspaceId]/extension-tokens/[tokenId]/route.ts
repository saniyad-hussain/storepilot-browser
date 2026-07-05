import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { requireMembership, PermissionError } from "@/lib/permissions";
import { handleApiError } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

type Params = { params: { workspaceId: string; tokenId: string } };

/** DELETE — revoke an extension token (ADMIN+). */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const userId = await getCurrentUserId();
    const membership = await requireMembership(userId, params.workspaceId, "ADMIN");

    const token = await prisma.extensionToken.findFirst({
      where: { id: params.tokenId, workspaceId: params.workspaceId },
    });
    if (!token) throw new PermissionError("Token not found.", 404);

    await prisma.extensionToken.update({
      where: { id: params.tokenId },
      data: { revokedAt: new Date() },
    });

    await logAudit({
      workspaceId: membership.workspaceId,
      userId,
      action: "extension_token.revoked",
      entityType: "ExtensionToken",
      entityId: token.id,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
