"use client";

import { useState } from "react";
import { CreditCard, ExternalLink, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { PLAN_CONFIGS } from "@/lib/plans";
import { humanize } from "@/lib/utils";

type Props = {
  workspaceId: string;
  plan: string;
  subscriptionStatus: string;
  hasStripeCustomer: boolean;
  canManage: boolean;
};

export function BillingClient({
  workspaceId,
  plan,
  subscriptionStatus,
  hasStripeCustomer,
  canManage,
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const isActive = subscriptionStatus === "ACTIVE" || subscriptionStatus === "TRIALING";

  async function openPortal() {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: body.error, variant: "destructive" });
        return;
      }
      window.location.href = body.url;
    } finally {
      setLoading(null);
    }
  }

  async function startCheckout(selectedPlan: string) {
    setLoading(selectedPlan);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, plan: selectedPlan }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: body.error, variant: "destructive" });
        return;
      }
      window.location.href = body.url;
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Manage your StorePilot subscription.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" /> Current subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <span className="text-sm text-muted-foreground">Plan:</span>{" "}
              <span className="font-medium">
                {plan === "NONE" ? "No plan selected" : humanize(plan)}
              </span>
            </div>
            <Badge variant={isActive ? "success" : "warning"}>
              {humanize(subscriptionStatus)}
            </Badge>
          </div>
          {canManage && hasStripeCustomer && (
            <Button onClick={openPortal} disabled={loading === "portal"}>
              {loading === "portal" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Manage billing through Stripe
            </Button>
          )}
          {!canManage && (
            <p className="text-sm text-muted-foreground">
              Only workspace owners and admins can manage billing.
            </p>
          )}
        </CardContent>
      </Card>

      {canManage && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">
            {isActive ? "Change plan" : "Choose a plan"}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.values(PLAN_CONFIGS).map((planConfig) => (
              <Card
                key={planConfig.plan}
                className={plan === planConfig.plan ? "border-primary ring-1 ring-primary" : ""}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    {planConfig.name}
                    {plan === planConfig.plan && <Badge>Current</Badge>}
                  </CardTitle>
                  <CardDescription>
                    <span className="text-2xl font-bold text-foreground">
                      ${planConfig.priceMonthly}
                    </span>
                    /month
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {planConfig.features.slice(0, 4).map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {plan !== planConfig.plan && (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => startCheckout(planConfig.plan)}
                      disabled={loading === planConfig.plan}
                    >
                      {loading === planConfig.plan && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      {isActive ? `Switch to ${planConfig.name}` : `Choose ${planConfig.name}`}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
