"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Loader2, Building2, Store as StoreIcon, CreditCard, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { PLAN_CONFIGS } from "@/lib/plans";

type Step = "workspace" | "store" | "plan";

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("workspace");
  const [loading, setLoading] = useState(false);

  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"STARTER" | "BUSINESS" | "PRO">("BUSINESS");

  async function createWorkspace() {
    if (!workspaceName.trim()) {
      toast({ title: "Enter a workspace name", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workspaceName.trim() }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: body.error, variant: "destructive" });
        return;
      }
      setWorkspaceId(body.workspace.id);
      setStep("store");
    } finally {
      setLoading(false);
    }
  }

  async function createStore() {
    if (!workspaceId) return;
    if (!storeName.trim()) {
      toast({ title: "Enter a store name", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/stores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: storeName.trim() }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: body.error, variant: "destructive" });
        return;
      }
      setStep("plan");
    } finally {
      setLoading(false);
    }
  }

  async function startCheckout() {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, plan: selectedPlan }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast({ title: "Checkout error", description: body.error, variant: "destructive" });
        return;
      }
      // Redirect to Stripe Checkout (hosted page).
      window.location.href = body.url;
    } finally {
      setLoading(false);
    }
  }

  const steps: { key: Step; label: string; icon: React.ElementType }[] = [
    { key: "workspace", label: "Workspace", icon: Building2 },
    { key: "store", label: "First store", icon: StoreIcon },
    { key: "plan", label: "Plan", icon: CreditCard },
  ];
  const currentIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="flex min-h-screen flex-col items-center bg-muted/40 px-4 py-12">
      <div className="mb-8 flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">StorePilot</span>
      </div>

      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-4">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                i < currentIndex
                  ? "bg-primary text-primary-foreground"
                  : i === currentIndex
                    ? "border-2 border-primary text-primary"
                    : "border text-muted-foreground"
              }`}
            >
              {i < currentIndex ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={i === currentIndex ? "text-sm font-medium" : "text-sm text-muted-foreground"}>
              {s.label}
            </span>
            {i < steps.length - 1 && <div className="h-px w-8 bg-border" />}
          </div>
        ))}
      </div>

      {step === "workspace" && (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Create your workspace</CardTitle>
            <CardDescription>
              Your workspace holds all your stores, links, templates, and team members.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workspaceName">Business name</Label>
              <Input
                id="workspaceName"
                placeholder="e.g. Demo Retail Group"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={createWorkspace} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "store" && (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Add your first store</CardTitle>
            <CardDescription>You can add more stores later from the dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">Store name</Label>
              <Input
                id="storeName"
                placeholder="e.g. Style Home Furniture"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={createStore} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "plan" && (
        <div className="w-full max-w-4xl">
          <h2 className="mb-6 text-center text-2xl font-semibold">Choose your plan</h2>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            {Object.values(PLAN_CONFIGS).map((plan) => (
              <Card
                key={plan.plan}
                className={`cursor-pointer transition-colors ${
                  selectedPlan === plan.plan ? "border-primary ring-1 ring-primary" : ""
                }`}
                onClick={() => setSelectedPlan(plan.plan as "STARTER" | "BUSINESS" | "PRO")}
              >
                <CardHeader>
                  {plan.plan === "BUSINESS" && <Badge className="mb-1 w-fit">Most popular</Badge>}
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="text-2xl font-bold">
                    ${plan.priceMonthly}
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {plan.features.slice(0, 4).map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex flex-col items-center gap-2">
            <Button size="lg" onClick={startCheckout} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Continue to secure checkout
            </Button>
            <p className="text-xs text-muted-foreground">
              Payment is processed securely by Stripe. You can manage or cancel anytime.
            </p>
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
              Skip for now — go to dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
