import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { getDefaultMembership, isSubscriptionUsable, Role } from "@/lib/permissions";

/**
 * Server helper for dashboard pages. Redirects to login when unauthenticated
 * and to onboarding when the user has no workspace yet.
 */
export async function requireDashboardContext() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const membership = await getDefaultMembership(userId);
  if (!membership) redirect("/onboarding");

  return {
    userId,
    role: membership.role as Role,
    workspace: membership.workspace,
    subscriptionUsable: isSubscriptionUsable(membership.workspace.subscriptionStatus),
  };
}
