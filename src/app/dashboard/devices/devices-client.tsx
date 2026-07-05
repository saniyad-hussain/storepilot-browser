"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Monitor, Pencil, Trash2, ClipboardCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";

export type DeviceItem = {
  id: string;
  name: string;
  extensionInstallId: string;
  storeId: string | null;
  storeName: string | null;
  lastSeenAt: string | null;
  lastCheckAt: string | null;
};

type StoreOption = { id: string; name: string };

type Props = {
  workspaceId: string;
  canManage: boolean;
  stores: StoreOption[];
  initialDevices: DeviceItem[];
};

export function DevicesClient({ workspaceId, canManage, stores, initialDevices }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [devices, setDevices] = useState<DeviceItem[]>(initialDevices);
  const [editing, setEditing] = useState<DeviceItem | null>(null);
  const [deleting, setDeleting] = useState<DeviceItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editStoreId, setEditStoreId] = useState("none");
  const [saving, setSaving] = useState(false);

  function openEdit(device: DeviceItem) {
    setEditing(device);
    setEditName(device.name);
    setEditStoreId(device.storeId ?? "none");
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/devices/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          storeId: editStoreId === "none" ? null : editStoreId,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: body.error, variant: "destructive" });
        return;
      }
      const storeName = stores.find((s) => s.id === body.device.storeId)?.name ?? null;
      setDevices((prev) =>
        prev.map((d) =>
          d.id === editing.id
            ? { ...d, name: body.device.name, storeId: body.device.storeId, storeName }
            : d
        )
      );
      toast({ title: "Device updated" });
      setEditing(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    const res = await fetch(`/api/workspaces/${workspaceId}/devices/${deleting.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast({ title: "Error", description: body.error, variant: "destructive" });
    } else {
      setDevices((prev) => prev.filter((d) => d.id !== deleting.id));
      toast({ title: "Device removed" });
      router.refresh();
    }
    setDeleting(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Devices / Store PCs</h1>
        <p className="text-muted-foreground">
          Store computers with the StorePilot extension installed. Devices register themselves
          from the extension options page.
        </p>
      </div>

      {devices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Monitor className="h-10 w-10 text-muted-foreground" />
            <p className="max-w-md text-muted-foreground">
              No devices registered yet. Install the Chrome extension on a store PC and connect
              it from the extension options page using a connection token from Settings.
            </p>
            <Button variant="outline" asChild>
              <Link href="/dashboard/settings">Extension setup instructions</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device name</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Last seen</TableHead>
                  <TableHead>Last safety check</TableHead>
                  <TableHead>Install ID</TableHead>
                  <TableHead className="w-40">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="font-medium">{device.name}</TableCell>
                    <TableCell>
                      {device.storeName ? (
                        <Badge variant="outline">{device.storeName}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(device.lastSeenAt, "Never")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(device.lastCheckAt, "Never")}
                    </TableCell>
                    <TableCell className="max-w-32 truncate font-mono text-xs text-muted-foreground">
                      {device.extensionInstallId}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {canManage && (
                          <>
                            <Button variant="ghost" size="icon" title="Mark safety check completed" asChild>
                              <Link href={`/dashboard/safety-checks?device=${device.id}`}>
                                <ClipboardCheck className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openEdit(device)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => setDeleting(device)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit device</DialogTitle>
            <DialogDescription>Rename the device or assign it to a store.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deviceName">Device name</Label>
              <Input
                id="deviceName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Assigned store</Label>
              <Select value={editStoreId} onValueChange={setEditStoreId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No store</SelectItem>
                  {stores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The device will need to be re-registered from its extension options page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
