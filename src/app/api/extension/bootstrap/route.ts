import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateExtension } from "@/lib/extension-auth";
import { handleApiError, jsonError } from "@/lib/api-helpers";

// CORS headers so the Chrome extension can call this API.
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/extension/bootstrap
 * Returns workspace info, assigned store (from device install id, if
 * provided via ?installId=), stores, allowed links, allowed templates, user
 * permissions, and subscription status.
 */
export async function GET(req: Request) {
  try {
    const auth = await authenticateExtension(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status, headers: CORS_HEADERS });
    }
    const { workspaceId, role } = auth.token;

    const url = new URL(req.url);
    const installId = url.searchParams.get("installId");

    const [workspace, stores, links, templates, device] = await Promise.all([
      prisma.workspace.findUniqueOrThrow({
        where: { id: workspaceId },
        select: { id: true, name: true, plan: true, subscriptionStatus: true },
      }),
      prisma.store.findMany({
        where: { workspaceId, isActive: true },
        select: { id: true, name: true, color: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.toolLink.findMany({
        where: { workspaceId },
        select: {
          id: true,
          title: true,
          url: true,
          category: true,
          description: true,
          isSensitive: true,
          storeId: true,
        },
        orderBy: [{ category: "asc" }, { title: "asc" }],
      }),
      prisma.replyTemplate.findMany({
        where: { workspaceId },
        select: { id: true, title: true, body: true, category: true, storeId: true },
        orderBy: { title: "asc" },
      }),
      installId
        ? prisma.device.findFirst({
            where: { workspaceId, extensionInstallId: installId },
            select: { id: true, name: true, storeId: true, store: { select: { id: true, name: true } } },
          })
        : Promise.resolve(null),
    ]);

    return NextResponse.json(
      {
        workspace,
        stores,
        links,
        templates,
        device,
        permissions: { role },
        subscriptionStatus: workspace.subscriptionStatus,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    const res = handleApiError(err);
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
}
