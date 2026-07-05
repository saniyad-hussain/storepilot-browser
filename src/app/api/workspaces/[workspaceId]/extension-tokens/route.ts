import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { requireMembership } from "@/lib/permissions";
import { generateExtensionToken } from "@/lib/extension-auth";
import { handleApiError } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

type Params = { params: { workspaceId: string } };

/** GET — list extension tokens for the workspace (ADMIN+). */
export async function GET(_req: Request, { params }: Params) {
  try {
    const userId = await getCurrentUserId();
    await requireMembership(userId, params.workspaceId, "ADMIN");

    const tokens = await prisma.extensionToken.findMany({
      where: { workspaceId: params.workspaceId, revokedAt: null },
      select: {
        id: true,
        label: true,
        lastUsedAt: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ tokens });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * POST — generate a new extension connection token (MANAGER+).
 * The raw token is returned once; only its hash is stored.
 */
export async function POST(req: Request, { params }: Params) {
  try {
    const userId = await getCurrentUserId();
    const membership = await requireMembership(userId, params.workspaceId, "MANAGER");

    let label: string | null = null;
    try {
      const body = await req.json();
      if (typeof body?.label === "string") label = body.label.slice(0, 100);
    } catch {
      // Empty body is fine.
    }

    const { raw, hash } = generateExtensionToken();
    const token = await prisma.extensionToken.create({
      data: {
        workspaceId: params.workspaceId,
        userId: membership.userId,
        tokenHash: hash,
        label,
      },
    });

    await logAudit({
      workspaceId: membership.workspaceId,
      userId,
      action: "extension_token.created",
      entityType: "ExtensionToken",
      entityId: token.id,
      metadata: { label },
    });

    // Raw token is only ever returned here, once.
    return NextResponse.json({ token: raw, id: token.id }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
