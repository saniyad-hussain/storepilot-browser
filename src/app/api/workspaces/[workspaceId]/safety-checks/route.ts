import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { requireMembership } from "@/lib/permissions";
import { safetyCheckSchema } from "@/lib/validation";
import { handleApiError, parseBody } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

type Params = { params: { workspaceId: string } };

/** GET — list browser safety checks (any member). */
export async function GET(_req: Request, { params }: Params) {
  try {
    const userId = await getCurrentUserId();
    await requireMembership(userId, params.workspaceId, "VIEWER");

    const checks = await prisma.browserSafetyCheck.findMany({
      where: { workspaceId: params.workspaceId },
      include: {
        device: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
        checkedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ checks });
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST — create a browser safety check record (MANAGER+). */
export async function POST(req: Request, { params }: Params) {
  try {
    const userId = await getCurrentUserId();
    const membership = await requireMembership(userId, params.workspaceId, "MANAGER");

    const data = await parseBody(req, safetyCheckSchema);
    const check = await prisma.browserSafetyCheck.create({
      data: {
        workspaceId: params.workspaceId,
        deviceId: data.deviceId ?? null,
        storeId: data.storeId ?? null,
        checkedById: userId,
        chromeUpdated: data.chromeUpdated,
        suspiciousExtensionsRemoved: data.suspiciousExtensionsRemoved,
        savedPasswordRiskReviewed: data.savedPasswordRiskReviewed,
        twoFactorReviewed: data.twoFactorReviewed,
        recoveryInfoReviewed: data.recoveryInfoReviewed,
        notes: data.notes || null,
      },
    });

    await logAudit({
      workspaceId: membership.workspaceId,
      userId,
      action: "safety_check.created",
      entityType: "BrowserSafetyCheck",
      entityId: check.id,
      metadata: { deviceId: check.deviceId, storeId: check.storeId },
    });

    return NextResponse.json({ check }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
