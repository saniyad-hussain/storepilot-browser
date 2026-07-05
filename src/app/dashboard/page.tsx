import Link from "next/link";
import {
  Store,
  Link2,
  Users,
  Monitor,
  LifeBuoy,
  CreditCard,
  ClipboardCheck,
  KeyRound,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireDashboardContext } from "@/lib/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDate, humanize } from "@/lib/utils";

export default async function DashboardOverviewPage() {
  const { workspace } = await requireDashboardContext();

  const [storeCount, linkCount, memberCount, deviceCount, openRequests, lastCheck] =
    await Promise.all([
      prisma.store.count({ where: { workspaceId: workspace.id } }),
      prisma.toolLink.count({ where: { workspaceId: workspace.id } }),
      prisma.workspaceMember.count({ where: { workspaceId: workspace.id } }),
      prisma.device.count({ where: { workspaceId: workspace.id } }),
      prisma.supportRequest.count({
        where: { workspaceId: workspace.id, status: "OPEN" },
      }),
      prisma.browserSafetyCheck.findFirst({
        where: { workspaceId: workspace.id },
        orderBy: { createdAt: "desc" },
        include: { device: { select: { name: true } } },
      }),
    ]);

  const subscriptionActive =
    workspace.subscriptionStatus === "ACTIVE" || workspace.subscriptionStatus === "TRIALING";

  const stats = [
    { label: "Stores", value: storeCount, icon: Store, href: "/dashboard/stores" },
    { label: "Tool Links", value: linkCount, icon: Link2, href: "/dashboard/links" },
    { label: "Team Members", value: memberCount, icon: Users, href: "/dashboard/team" },
    { label: "Devices / PCs", value: deviceCount, icon: Monitor, href: "/dashboard/devices" },
    {
      label: "Open Support Requests",
      value: openRequests,
      icon: LifeBuoy,
      href: "/dashboard/support",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-muted-foreground">
          Your store team&apos;s browser workspace at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}

        <Link href="/dashboard/billing">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Subscription
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-1">
              <Badge variant={subscriptionActive ? "success" : "warning"}>
                {humanize(workspace.subscriptionStatus)}
              </Badge>
              <div className="text-sm text-muted-foreground">
                Plan: {workspace.plan === "NONE" ? "No plan yet" : humanize(workspace.plan)}
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardCheck className="h-4 w-4" /> Last browser safety check
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lastCheck ? (
            <div className="flex flex-col gap-1 text-sm">
              <span>
                <span className="font-medium">{lastCheck.device?.name ?? "Workspace-wide"}</span>{" "}
                — {formatDate(lastCheck.createdAt)}
              </span>
              {lastCheck.notes && (
                <span className="text-muted-foreground">{lastCheck.notes}</span>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No safety checks recorded yet.{" "}
              <Link href="/dashboard/safety-checks" className="text-primary hover:underline">
                Run your first monthly check
              </Link>
              .
            </p>
          )}
        </CardContent>
      </Card>

      <Alert>
        <KeyRound className="h-4 w-4" />
        <AlertTitle>Password manager reminder</AlertTitle>
        <AlertDescription>
          StorePilot never stores passwords. Keep all business passwords in your approved
          password manager (1Password or Bitwarden) and never share them in chat or email.
        </AlertDescription>
      </Alert>
    </div>
  );
}
