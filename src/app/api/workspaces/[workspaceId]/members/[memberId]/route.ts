import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { requireMembership, PermissionError } from "@/lib/permissions";
import { updateMemberSchema } from "@/lib/validation";
import { handleApiError, parseBody } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

type Params = { params: { workspaceId: string; memberId: string } };

async function findMemberOrThrow(workspaceId: string, memberId: string) {
  const member = await prisma.workspaceMember.findFirst({
    where: { id: memberId, workspaceId },
    include: { user: { select: { id: true, email: true } } },
  });
  if (!member) throw new PermissionError("Member not found.", 404);
  return member;
}

/** PATCH — change a member's role (ADMIN+). Owner role cannot be changed. */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const userId = await getCurrentUserId();
    const membership = await requireMembership(userId, params.workspaceId, "ADMIN");
    const target = await findMemberOrThrow(params.workspaceId, params.memberId);

    if (target.role === "OWNER") {
      throw new PermissionError("The workspace owner's role cannot be changed.", 403);
    }

    const data = await parseBody(req, updateMemberSchema);
    const member = await prisma.workspaceMember.update({
      where: { id: params.memberId },
      data: { role: data.role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    await logAudit({
      workspaceId: membership.workspaceId,
      userId,
      action: "member.role_changed",
      entityType: "WorkspaceMember",
      entityId: member.id,
      metadata: { email: target.user.email, newRole: data.role },
    });

    return NextResponse.json({ member });
  } catch (err) {
    return handleApiError(err);
  }
}

/** DELETE — remove a member (ADMIN+). The owner can never be removed. */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const userId = await getCurrentUserId();
    const membership = await requireMembership(userId, params.workspaceId, "ADMIN");
    const target = await findMemberOrThrow(params.workspaceId, params.memberId);

    if (target.role === "OWNER") {
      throw new PermissionError("The workspace owner cannot be removed.", 403);
    }

    await prisma.workspaceMember.delete({ where: { id: params.memberId } });

    await logAudit({
      workspaceId: membership.workspaceId,
      userId,
      action: "member.removed",
      entityType: "WorkspaceMember",
      entityId: target.id,
      metadata: { email: target.user.email },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
