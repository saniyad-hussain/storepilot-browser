import { requireDashboardContext } from "@/lib/dashboard";
import { roleAtLeast } from "@/lib/permissions";
import { BillingClient } from "./billing-client";

export default async function BillingPage() {
  const { workspace, role } = await requireDashboardContext();

  return (
    <BillingClient
      workspaceId={workspace.id}
      plan={workspace.plan}
      subscriptionStatus={workspace.subscriptionStatus}
      hasStripeCustomer={!!workspace.stripeCustomerId}
      canManage={roleAtLeast(role, "ADMIN")}
    />
  );
}
