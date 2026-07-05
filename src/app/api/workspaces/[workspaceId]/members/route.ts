import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { requireMembership, PermissionError } from "@/lib/permissions";
import { getPlanLimits, Plan } from "@/lib/plans";
import { inviteMemberSchema } from "@/lib/validation";
import { handleApiError, parseBody } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

type Params = { params: { workspaceId: string } };

/** GET — list members (any member). */
export async function GET(_req: Request, { params }: Params) {
  try {
    const userId = await getCurrentUserId();
    await requireMembership(userId, params.workspaceId, "VIEWER");

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: params.workspaceId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ members });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * POST — invite a member by email (ADMIN+).
 * If the user does not exist yet, a placeholder account is created; they can
 * finish setup by registering with the same email (password reset flow).
 */
export async function POST(req: Request, { params }: Params) {
  try {
    const userId = await getCurrentUserId();
    const membership = await requireMembership(userId, params.workspaceId, "ADMIN");

    const data = await parseBody(req, inviteMemberSchema);
    const email = data.email.toLowerCase().trim();

    const workspace = await prisma.workspace.findUniqueOrThrow({
      where: { id: params.workspaceId },
      select: { plan: true },
    });
    const memberCount = await prisma.workspaceMember.count({
      where: { workspaceId: params.workspaceId },
    });
    const limits = getPlanLimits(workspace.plan as Plan);
    if (memberCount >= limits.maxUsers) {
      throw new PermissionError(
        `Your plan allows up to ${limits.maxUsers} users. Upgrade to add more.`,
        403
      );
    }

    // Find or create the invited user (no password until they register).
    let invitedUser = await prisma.user.findUnique({ where: { email } });
    if (!invitedUser) {
      invitedUser = await prisma.user.create({
        data: { email, name: data.name?.trim() || email.split("@")[0] },
      });
    }

    const existingMembership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId: params.workspaceId, userId: invitedUser.id },
      },
    });
    if (existingMembership) {
      throw new PermissionError("This user is already a member of the workspace.", 409);
    }

    const member = await prisma.workspaceMember.create({
      data: {
        workspaceId: params.workspaceId,
        userId: invitedUser.id,
        role: data.role,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    await logAudit({
      workspaceId: membership.workspaceId,
      userId,
      action: "member.invited",
      entityType: "WorkspaceMember",
      entityId: member.id,
      metadata: { email, role: data.role },
    });

    return NextResponse.json({ member }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
