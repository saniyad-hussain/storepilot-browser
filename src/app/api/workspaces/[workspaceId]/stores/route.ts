import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { requireMembership, PermissionError } from "@/lib/permissions";
import { getPlanLimits } from "@/lib/plans";
import { storeSchema } from "@/lib/validation";
import { handleApiError, parseBody } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

type Params = { params: { workspaceId: string } };

/** GET — list stores (any member). */
export async function GET(_req: Request, { params }: Params) {
  try {
    const userId = await getCurrentUserId();
    await requireMembership(userId, params.workspaceId, "VIEWER");

    const stores = await prisma.store.findMany({
      where: { workspaceId: params.workspaceId },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ stores });
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST — create store (MANAGER+). Enforces plan store limit. */
export async function POST(req: Request, { params }: Params) {
  try {
    const userId = await getCurrentUserId();
    const membership = await requireMembership(userId, params.workspaceId, "MANAGER");

    const data = await parseBody(req, storeSchema);

    const workspace = await prisma.workspace.findUniqueOrThrow({
      where: { id: params.workspaceId },
      select: { plan: true },
    });
    const count = await prisma.store.count({ where: { workspaceId: params.workspaceId } });
    const limits = getPlanLimits(workspace.plan);
    if (count >= limits.maxStores) {
      throw new PermissionError(
        `Your plan allows up to ${limits.maxStores} stores. Upgrade to add more.`,
        403
      );
    }

    const store = await prisma.store.create({
      data: {
        workspaceId: params.workspaceId,
        name: data.name.trim(),
        address: data.address || null,
        phone: data.phone || null,
        website: data.website || null,
        logoUrl: data.logoUrl || null,
        color: data.color || null,
        isActive: data.isActive ?? true,
      },
    });

    await logAudit({
      workspaceId: membership.workspaceId,
      userId,
      action: "store.created",
      entityType: "Store",
      entityId: store.id,
      metadata: { name: store.name },
    });

    return NextResponse.json({ store }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
