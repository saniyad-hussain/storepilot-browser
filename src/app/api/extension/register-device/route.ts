import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateExtension } from "@/lib/extension-auth";
import { extensionRegisterDeviceSchema } from "@/lib/validation";
import { getPlanLimits } from "@/lib/plans";
import { handleApiError, parseBody } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { rateLimit, clientKey } from "@/lib/rate-limit";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * POST /api/extension/register-device
 * Registers (or updates) a device/PC using its extensionInstallId.
 */
export async function POST(req: Request) {
  try {
    if (!rateLimit(clientKey(req, "register-device"), 30, 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: CORS_HEADERS }
      );
    }

    const auth = await authenticateExtension(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status, headers: CORS_HEADERS });
    }
    const { workspaceId, userId } = auth.token;

    const data = await parseBody(req, extensionRegisterDeviceSchema);

    // Validate storeId belongs to this workspace if provided.
    if (data.storeId) {
      const store = await prisma.store.findFirst({
        where: { id: data.storeId, workspaceId },
      });
      if (!store) {
        return NextResponse.json(
          { error: "Store not found in this workspace." },
          { status: 404, headers: CORS_HEADERS }
        );
      }
    }

    const existing = await prisma.device.findUnique({
      where: { extensionInstallId: data.extensionInstallId },
    });

    if (existing && existing.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: "This device is registered to a different workspace." },
        { status: 409, headers: CORS_HEADERS }
      );
    }

    if (!existing) {
      // Enforce device limits on new registrations.
      const workspace = await prisma.workspace.findUniqueOrThrow({
        where: { id: workspaceId },
        select: { plan: true },
      });
      const count = await prisma.device.count({ where: { workspaceId } });
      const limits = getPlanLimits(workspace.plan);
      if (count >= limits.maxDevices) {
        return NextResponse.json(
          { error: `Your plan allows up to ${limits.maxDevices} devices. Upgrade to add more.` },
          { status: 403, headers: CORS_HEADERS }
        );
      }
    }

    const device = existing
      ? await prisma.device.update({
          where: { id: existing.id },
          data: {
            name: data.name.trim(),
            storeId: data.storeId ?? existing.storeId,
            lastSeenAt: new Date(),
          },
        })
      : await prisma.device.create({
          data: {
            workspaceId,
            storeId: data.storeId ?? null,
            name: data.name.trim(),
            extensionInstallId: data.extensionInstallId,
            lastSeenAt: new Date(),
          },
        });

    await logAudit({
      workspaceId,
      userId,
      action: existing ? "device.updated" : "device.registered",
      entityType: "Device",
      entityId: device.id,
      metadata: { name: device.name },
    });

    return NextResponse.json({ device }, { status: existing ? 200 : 201, headers: CORS_HEADERS });
  } catch (err) {
    const res = handleApiError(err);
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
}
