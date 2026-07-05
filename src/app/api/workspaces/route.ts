import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { createWorkspaceSchema } from "@/lib/validation";
import { handleApiError, jsonError, parseBody } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/** GET /api/workspaces — list workspaces the user belongs to. */
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return jsonError("Not authenticated.", 401);

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      workspaces: memberships.map((m) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        role: m.role,
        plan: m.workspace.plan,
        subscriptionStatus: m.workspace.subscriptionStatus,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST /api/workspaces — create a workspace (user becomes OWNER). */
export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return jsonError("Not authenticated.", 401);

    const data = await parseBody(req, createWorkspaceSchema);

    const workspace = await prisma.workspace.create({
      data: {
        name: data.name.trim(),
        ownerId: userId,
        members: { create: { userId, role: "OWNER" } },
      },
    });

    await logAudit({
      workspaceId: workspace.id,
      userId,
      action: "workspace.created",
      entityType: "Workspace",
      entityId: workspace.id,
      metadata: { name: workspace.name },
    });

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
