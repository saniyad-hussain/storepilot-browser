import { requireDashboardContext } from "@/lib/dashboard";
import { roleAtLeast } from "@/lib/permissions";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const { workspace, role } = await requireDashboardContext();

  return (
    <SettingsClient
      workspaceId={workspace.id}
      workspaceName={workspace.name}
      canManage={roleAtLeast(role, "ADMIN")}
      canGenerateToken={roleAtLeast(role, "MANAGER")}
    />
  );
}
