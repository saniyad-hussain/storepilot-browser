import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { requireMembership } from "@/lib/permissions";
import { supportRequestSchema } from "@/lib/validation";
import { handleApiError, parseBody } from "@/lib/api-helpers";

type Params = { params: { workspaceId: string } };

/** GET — list support requests (any member). */
export async function GET(_req: Request, { params }: Params) {
  try {
    const userId = await getCurrentUserId();
    await requireMembership(userId, params.workspaceId, "VIEWER");

    const requests = await prisma.supportRequest.findMany({
      where: { workspaceId: params.workspaceId },
      include: {
        store: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
        device: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ requests });
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST — create support request from the dashboard (STAFF+). */
export async function POST(req: Request, { params }: Params) {
  try {
    const userId = await getCurrentUserId();
    await requireMembership(userId, params.workspaceId, "STAFF");

    const data = await parseBody(req, supportRequestSchema);
    const request = await prisma.supportRequest.create({
      data: {
        workspaceId: params.workspaceId,
        storeId: data.storeId ?? null,
        userId,
        type: data.type,
        message: data.message,
      },
    });

    return NextResponse.json({ request }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
