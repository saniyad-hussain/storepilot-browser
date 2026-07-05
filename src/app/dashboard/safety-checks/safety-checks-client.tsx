"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, ClipboardCheck, CheckCircle2, XCircle, MinusCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";

export type CheckItem = {
  id: string;
  deviceName: string | null;
  storeName: string | null;
  checkedByName: string | null;
  chromeUpdated: boolean | null;
  suspiciousExtensionsRemoved: boolean | null;
  savedPasswordRiskReviewed: boolean | null;
  twoFactorReviewed: boolean | null;
  recoveryInfoReviewed: boolean | null;
  notes: string | null;
  createdAt: string;
};

type Option = { id: string; name: string };

type Props = {
  workspaceId: string;
  canManage: boolean;
  devices: Option[];
  stores: Option[];
  initialChecks: CheckItem[];
};

const CHECK_ITEMS = [
  { key: "chromeUpdated", label: "Chrome updated to the latest version" },
  { key: "suspiciousExtensionsRemoved", label: "Suspicious extensions reviewed / removed" },
  { key: "savedPasswordRiskReviewed", label: "Saved password risk reviewed" },
  { key: "twoFactorReviewed", label: "Two-factor authentication (2FA) reviewed" },
  { key: "recoveryInfoReviewed", label: "Recovery email / phone reviewed" },
] as const;

type CheckKey = (typeof CHECK_ITEMS)[number]["key"];

function StatusIcon({ value }: { value: boolean | null }) {
  if (value === true) return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  if (value === false) return <XCircle className="h-4 w-4 text-red-500" />;
  return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
}

export function SafetyChecksClient({ workspaceId, canManage, devices, stores, initialChecks }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [checks, setChecks] = useState<CheckItem[]>(initialChecks);
  const preselectedDevice = searchParams.get("device");
  const [dialogOpen, setDialogOpen] = useState(!!preselectedDevice && canManage);
  const [deviceId, setDeviceId] = useState(preselectedDevice ?? "none");
  const [storeId, setStoreId] = useState("none");
  const [flags, setFlags] = useState<Record<CheckKey, boolean>>({
    chromeUpdated: false,
    suspiciousExtensionsRemoved: false,
    savedPasswordRiskReviewed: false,
    twoFactorReviewed: false,
    recoveryInfoReviewed: false,
  });
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/safety-checks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: deviceId === "none" ? null : deviceId,
          storeId: storeId === "none" ? null : storeId,
          ...flags,
          notes,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: body.error, variant: "destructive" });
        return;
      }
      const deviceName = devices.find((d) => d.id === body.check.deviceId)?.name ?? null;
      const storeName = stores.find((s) => s.id === body.check.storeId)?.name ?? null;
      setChecks((prev) => [
        {
          ...body.check,
          deviceName,
          storeName,
          checkedByName: "You",
          createdAt: body.check.createdAt,
        },
        ...prev,
      ]);
      toast({ title: "Safety check recorded" });
      setDialogOpen(false);
      setFlags({
        chromeUpdated: false,
        suspiciousExtensionsRemoved: false,
        savedPasswordRiskReviewed: false,
        twoFactorReviewed: false,
        recoveryInfoReviewed: false,
      });
      setNotes("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Browser Safety Checks</h1>
          <p className="text-muted-foreground">
            Record monthly safety reviews for each store PC. This is a checklist aid — it does
            not scan or guarantee anything.
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> New safety check
          </Button>
        )}
      </div>

      {checks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <ClipboardCheck className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              No safety checks recorded yet. Run your first monthly review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {checks.map((check) => (
            <Card key={check.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                  {check.deviceName ? (
                    <Badge variant="outline">{check.deviceName}</Badge>
                  ) : (
                    <Badge variant="secondary">Workspace-wide</Badge>
                  )}
                  {check.storeName && <Badge variant="outline">{check.storeName}</Badge>}
                </CardTitle>
                <span className="text-sm text-muted-foreground">
                  {formatDate(check.createdAt)}
                  {check.checkedByName && ` · by ${check.checkedByName}`}
                </span>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="grid gap-1 sm:grid-cols-2">
                  {CHECK_ITEMS.map((item) => (
                    <div key={item.key} className="flex items-center gap-2 text-sm">
                      <StatusIcon value={check[item.key]} />
                      <span className="text-muted-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
                {check.notes && (
                  <p className="pt-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Notes:</span> {check.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New browser safety check</DialogTitle>
            <DialogDescription>
              Work through the checklist on the store PC, then record the results here.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Device</Label>
                <Select value={deviceId} onValueChange={setDeviceId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific device</SelectItem>
                    {devices.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Store</Label>
                <Select value={storeId} onValueChange={setStoreId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific store</SelectItem>
                    {stores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              {CHECK_ITEMS.map((item) => (
                <div key={item.key} className="flex items-center gap-2">
                  <Checkbox
                    id={item.key}
                    checked={flags[item.key]}
                    onCheckedChange={(v) => setFlags({ ...flags, [item.key]: v === true })}
                  />
                  <Label htmlFor={item.key} className="cursor-pointer font-normal">
                    {item.label}
                  </Label>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={3}
                placeholder="Anything worth noting from this review..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Record check
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
