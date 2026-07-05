import { prisma } from "@/lib/prisma";

export type Role = "OWNER" | "ADMIN" | "MANAGER" | "STAFF" | "VIEWER";
export type SubscriptionStatus = "NONE" | "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "UNPAID" | "INCOMPLETE" | "INCOMPLETE_EXPIRED" | "PAUSED";

/**
 * Server-side permission helpers. ALWAYS use these in API routes and server
 * actions — frontend checks are cosmetic only.
 */

const ROLE_ORDER: Record<Role, number> = {
  OWNER: 5,
  ADMIN: 4,
  MANAGER: 3,
  STAFF: 2,
  VIEWER: 1,
};

/** Returns true if `role` is at least as privileged as `minimum`. */
export function roleAtLeast(role: Role, minimum: Role): boolean {
  return ROLE_ORDER[role] >= ROLE_ORDER[minimum];
}

export type MembershipContext = {
  workspaceId: string;
  userId: string;
  role: Role;
  subscriptionStatus: SubscriptionStatus;
};

/**
 * Loads the membership for a user in a workspace, or null when the user is
 * not a member.
 */
export async function getMembership(
  userId: string,
  workspaceId: string
): Promise<MembershipContext | null> {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    include: { workspace: { select: { subscriptionStatus: true } } },
  });
  if (!member) return null;
  return {
    workspaceId,
    userId,
    role: member.role,
    subscriptionStatus: member.workspace.subscriptionStatus,
  };
}

/** First workspace membership for a user (used as the default workspace). */
export async function getDefaultMembership(userId: string) {
  return prisma.workspaceMember.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { workspace: true },
  });
}

/** Whether a subscription status allows product usage. */
export function isSubscriptionUsable(status: string): boolean {
  return status === "ACTIVE" || status === "TRIALING";
}

export class PermissionError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.status = status;
  }
}

/**
 * Asserts the user is a member of the workspace with at least `minimumRole`.
 * Throws PermissionError otherwise.
 */
export async function requireMembership(
  userId: string | null,
  workspaceId: string,
  minimumRole: Role = "VIEWER"
): Promise<MembershipContext> {
  if (!userId) throw new PermissionError("Not authenticated.", 401);
  const membership = await getMembership(userId, workspaceId);
  if (!membership) throw new PermissionError("You are not a member of this workspace.", 403);
  if (!roleAtLeast(membership.role, minimumRole)) {
    throw new PermissionError("You do not have permission to perform this action.", 403);
  }
  return membership;
}

/** Asserts the workspace subscription is active or trialing. */
export function requireActiveSubscription(membership: MembershipContext): void {
  if (!isSubscriptionUsable(membership.subscriptionStatus)) {
    throw new PermissionError(
      "Subscription inactive. Please contact your workspace owner.",
      402
    );
  }
}
