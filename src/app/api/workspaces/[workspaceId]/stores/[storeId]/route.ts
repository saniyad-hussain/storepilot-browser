import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { requireMembership, PermissionError } from "@/lib/permissions";
import { storeSchema } from "@/lib/validation";
import { handleApiError, parseBody } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

type Params = { params: { workspaceId: string; storeId: string } };

async function findStoreOrThrow(workspaceId: string, storeId: string) {
  const store = await prisma.store.findFirst({ where: { id: storeId, workspaceId } });
  if (!store) throw new PermissionError("Store not found.", 404);
  return store;
}

/** PATCH — update store (MANAGER+). */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const userId = await getCurrentUserId();
    const membership = await requireMembership(userId, params.workspaceId, "MANAGER");
    await findStoreOrThrow(params.workspaceId, params.storeId);

    const data = await parseBody(req, storeSchema.partial());
    const store = await prisma.store.update({
      where: { id: params.storeId },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.address !== undefined && { address: data.address || null }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.website !== undefined && { website: data.website || null }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl || null }),
        ...(data.color !== undefined && { color: data.color || null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    await logAudit({
      workspaceId: membership.workspaceId,
      userId,
      action: "store.updated",
      entityType: "Store",
      entityId: store.id,
      metadata: { name: store.name },
    });

    return NextResponse.json({ store });
  } catch (err) {
    return handleApiError(err);
  }
}

/** DELETE — delete store (ADMIN+). */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const userId = await getCurrentUserId();
    const membership = await requireMembership(userId, params.workspaceId, "ADMIN");
    const store = await findStoreOrThrow(params.workspaceId, params.storeId);

    await prisma.store.delete({ where: { id: params.storeId } });

    await logAudit({
      workspaceId: membership.workspaceId,
      userId,
      action: "store.deleted",
      entityType: "Store",
      entityId: store.id,
      metadata: { name: store.name },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
