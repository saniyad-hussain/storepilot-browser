"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LifeBuoy, Monitor, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { formatDate, humanize } from "@/lib/utils";

const TYPES = [
  "LOGIN_PROBLEM",
  "NEED_ACCESS",
  "WRONG_STORE",
  "WEBSITE_ISSUE",
  "SOCIAL_MEDIA_ISSUE",
  "BROWSER_SAFETY",
  "OTHER",
] as const;

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED"] as const;

export type RequestItem = {
  id: string;
  type: string;
  message: string;
  status: string;
  storeId: string | null;
  storeName: string | null;
  userName: string | null;
  deviceName: string | null;
  createdAt: string;
};

type StoreOption = { id: string; name: string };

type Props = {
  workspaceId: string;
  canManage: boolean;
  stores: StoreOption[];
  initialRequests: RequestItem[];
};

function statusVariant(status: string): "warning" | "secondary" | "success" {
  if (status === "OPEN") return "warning";
  if (status === "IN_PROGRESS") return "secondary";
  return "success";
}

export function SupportClient({ workspaceId, canManage, stores, initialRequests }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [requests, setRequests] = useState<RequestItem[]>(initialRequests);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterStore, setFilterStore] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const filtered = useMemo(
    () =>
      requests.filter((r) => {
        if (filterStatus !== "all" && r.status !== filterStatus) return false;
        if (filterStore !== "all" && r.storeId !== (filterStore === "none" ? null : filterStore))
          return false;
        if (filterType !== "all" && r.type !== filterType) return false;
        return true;
      }),
    [requests, filterStatus, filterStore, filterType]
  );

  async function changeStatus(request: RequestItem, status: string) {
    const res = await fetch(`/api/workspaces/${workspaceId}/support-requests/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const body = await res.json();
    if (!res.ok) {
      toast({ title: "Error", description: body.error, variant: "destructive" });
      return;
    }
    setRequests((prev) => prev.map((r) => (r.id === request.id ? { ...r, status } : r)));
    toast({ title: "Status updated" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Support Requests</h1>
        <p className="text-muted-foreground">
          Requests submitted by your team from the dashboard and Chrome extension.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {humanize(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStore} onValueChange={setFilterStore}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All stores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stores</SelectItem>
            <SelectItem value="none">No store</SelectItem>
            {stores.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {humanize(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <LifeBuoy className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              {requests.length === 0
                ? "No support requests yet."
                : "No requests match your filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((request) => (
            <Card key={request.id}>
              <CardContent className="space-y-3 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusVariant(request.status)}>
                      {humanize(request.status)}
                    </Badge>
                    <Badge variant="secondary">{humanize(request.type)}</Badge>
                    {request.storeName && <Badge variant="outline">{request.storeName}</Badge>}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(request.createdAt)}
                  </span>
                </div>
                <p className="text-sm">{request.message}</p>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    {request.userName && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" /> {request.userName}
                      </span>
                    )}
                    {request.deviceName && (
                      <span className="flex items-center gap-1">
                        <Monitor className="h-3 w-3" /> {request.deviceName}
                      </span>
                    )}
                  </div>
                  {canManage && (
                    <Select
                      value={request.status}
                      onValueChange={(v) => changeStatus(request, v)}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {humanize(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
