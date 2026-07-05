import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateExtension } from "@/lib/extension-auth";
import { extensionHeartbeatSchema } from "@/lib/validation";
import { handleApiError, parseBody } from "@/lib/api-helpers";
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
 * POST /api/extension/device-heartbeat
 * Updates lastSeenAt for the device identified by its extensionInstallId.
 */
export async function POST(req: Request) {
  try {
    if (!rateLimit(clientKey(req, "heartbeat"), 60, 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many requests." },
        { status: 429, headers: CORS_HEADERS }
      );
    }

    const auth = await authenticateExtension(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status, headers: CORS_HEADERS });
    }
    const { workspaceId } = auth.token;

    const data = await parseBody(req, extensionHeartbeatSchema);

    const device = await prisma.device.findFirst({
      where: { extensionInstallId: data.extensionInstallId, workspaceId },
    });
    if (!device) {
      return NextResponse.json(
        { error: "Device not registered. Open the extension options to register." },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    await prisma.device.update({
      where: { id: device.id },
      data: { lastSeenAt: new Date() },
    });

    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  } catch (err) {
    const res = handleApiError(err);
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
}
