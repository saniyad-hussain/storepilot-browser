import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateExtension } from "@/lib/extension-auth";
import { extensionSupportRequestSchema } from "@/lib/validation";
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
 * POST /api/extension/support-request
 * Creates a support request from the Chrome extension. Rate limited.
 */
export async function POST(req: Request) {
  try {
    // Rate limit: max 10 support requests per 10 minutes per client.
    if (!rateLimit(clientKey(req, "support-request"), 10, 10 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many support requests. Please wait a few minutes and try again." },
        { status: 429, headers: CORS_HEADERS }
      );
    }

    const auth = await authenticateExtension(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status, headers: CORS_HEADERS });
    }
    const { workspaceId, userId } = auth.token;

    const data = await parseBody(req, extensionSupportRequestSchema);

    // Resolve the source device if an install id was provided.
    let deviceId: string | null = null;
    let storeId: string | null = data.storeId ?? null;
    if (data.extensionInstallId) {
      const device = await prisma.device.findFirst({
        where: { extensionInstallId: data.extensionInstallId, workspaceId },
      });
      if (device) {
        deviceId = device.id;
        if (!storeId) storeId = device.storeId;
      }
    }

    // Validate store belongs to workspace.
    if (storeId) {
      const store = await prisma.store.findFirst({ where: { id: storeId, workspaceId } });
      if (!store) storeId = null;
    }

    const request = await prisma.supportRequest.create({
      data: {
        workspaceId,
        storeId,
        userId,
        deviceId,
        type: data.type,
        message: data.message,
      },
    });

    return NextResponse.json({ request }, { status: 201, headers: CORS_HEADERS });
  } catch (err) {
    const res = handleApiError(err);
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
}
