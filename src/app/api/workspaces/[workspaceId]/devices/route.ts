import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { requireMembership } from "@/lib/permissions";
import { handleApiError } from "@/lib/api-helpers";

type Params = { params: { workspaceId: string } };

/** GET — list registered devices/PCs (any member). */
export async function GET(_req: Request, { params }: Params) {
  try {
    const userId = await getCurrentUserId();
    await requireMembership(userId, params.workspaceId, "VIEWER");

    const devices = await prisma.device.findMany({
      where: { workspaceId: params.workspaceId },
      include: {
        store: { select: { id: true, name: true } },
        safetyChecks: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ devices });
  } catch (err) {
    return handleApiError(err);
  }
}
