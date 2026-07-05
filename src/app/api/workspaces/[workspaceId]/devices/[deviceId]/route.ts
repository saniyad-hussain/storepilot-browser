import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { requireMembership, PermissionError } from "@/lib/permissions";
import { deviceSchema } from "@/lib/validation";
import { handleApiError, parseBody } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

type Params = { params: { workspaceId: string; deviceId: string } };

async function findDeviceOrThrow(workspaceId: string, deviceId: string) {
  const device = await prisma.device.findFirst({ where: { id: deviceId, workspaceId } });
  if (!device) throw new PermissionError("Device not found.", 404);
  return device;
}

/** PATCH — update device name/store (MANAGER+). */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const userId = await getCurrentUserId();
    const membership = await requireMembership(userId, params.workspaceId, "MANAGER");
    await findDeviceOrThrow(params.workspaceId, params.deviceId);

    const data = await parseBody(req, deviceSchema.partial());
    const device = await prisma.device.update({
      where: { id: params.deviceId },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.storeId !== undefined && { storeId: data.storeId }),
      },
    });

    await logAudit({
      workspaceId: membership.workspaceId,
      userId,
      action: "device.updated",
      entityType: "Device",
      entityId: device.id,
      metadata: { name: device.name },
    });

    return NextResponse.json({ device });
  } catch (err) {
    return handleApiError(err);
  }
}

/** DELETE — remove a device (MANAGER+). */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const userId = await getCurrentUserId();
    const membership = await requireMembership(userId, params.workspaceId, "MANAGER");
    const device = await findDeviceOrThrow(params.workspaceId, params.deviceId);

    await prisma.device.delete({ where: { id: params.deviceId } });

    await logAudit({
      workspaceId: membership.workspaceId,
      userId,
      action: "device.removed",
      entityType: "Device",
      entityId: device.id,
      metadata: { name: device.name },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
