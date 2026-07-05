import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { requireDashboardContext } from "@/lib/dashboard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { workspace, role, subscriptionUsable } = await requireDashboardContext();

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar workspaceName={workspace.name} role={role} />
      <div className="md:pl-64">
        <main className="container max-w-6xl py-8">
          {!subscriptionUsable && (
            <Alert variant="warning" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Billing required</AlertTitle>
              <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Your subscription is not active. Dashboard and extension features are limited
                  until billing is resolved.
                </span>
                <Button size="sm" asChild>
                  <Link href="/dashboard/billing">Go to billing</Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
