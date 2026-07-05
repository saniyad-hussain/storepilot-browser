"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Store as StoreIcon, Globe, Phone, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

export type StoreItem = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  logoUrl: string | null;
  color: string | null;
  isActive: boolean;
};

type Props = {
  workspaceId: string;
  canManage: boolean;
  canDelete: boolean;
  initialStores: StoreItem[];
};

type FormState = {
  name: string;
  address: string;
  phone: string;
  website: string;
  logoUrl: string;
  color: string;
};

const emptyForm: FormState = { name: "", address: "", phone: "", website: "", logoUrl: "", color: "#2563eb" };

export function StoresClient({ workspaceId, canManage, canDelete, initialStores }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [stores, setStores] = useState<StoreItem[]>(initialStores);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StoreItem | null>(null);
  const [deleting, setDeleting] = useState<StoreItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(store: StoreItem) {
    setEditing(store);
    setForm({
      name: store.name,
      address: store.address ?? "",
      phone: store.phone ?? "",
      website: store.website ?? "",
      logoUrl: store.logoUrl ?? "",
      color: store.color ?? "#2563eb",
    });
    setDialogOpen(true);
  }

  async function save() {
    if (!form.name.trim()) {
      toast({ title: "Store name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const url = editing
        ? `/api/workspaces/${workspaceId}/stores/${editing.id}`
        : `/api/workspaces/${workspaceId}/stores`;
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: body.error, variant: "destructive" });
        return;
      }
      if (editing) {
        setStores((prev) => prev.map((s) => (s.id === editing.id ? body.store : s)));
        toast({ title: "Store updated" });
      } else {
        setStores((prev) => [...prev, body.store]);
        toast({ title: "Store created" });
      }
      setDialogOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    const res = await fetch(`/api/workspaces/${workspaceId}/stores/${deleting.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast({ title: "Error", description: body.error, variant: "destructive" });
    } else {
      setStores((prev) => prev.filter((s) => s.id !== deleting.id));
      toast({ title: "Store deleted" });
      router.refresh();
    }
    setDeleting(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stores</h1>
          <p className="text-muted-foreground">Manage the store locations in your workspace.</p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add store
          </Button>
        )}
      </div>

      {stores.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <StoreIcon className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No stores yet. Add your first store to get started.</p>
            {canManage && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> Add store
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <Card key={store.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: store.color ?? "#2563eb" }}
                  />
                  <CardTitle className="text-base">{store.name}</CardTitle>
                </div>
                {!store.isActive && <Badge variant="secondary">Inactive</Badge>}
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {store.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" /> {store.address}
                  </div>
                )}
                {store.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" /> {store.phone}
                  </div>
                )}
                {store.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5" />
                    <a
                      href={store.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-primary hover:underline"
                    >
                      {store.website}
                    </a>
                  </div>
                )}
                {(canManage || canDelete) && (
                  <div className="flex gap-2 pt-2">
                    {canManage && (
                      <Button variant="outline" size="sm" onClick={() => openEdit(store)}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setDeleting(store)}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit store" : "Add store"}</DialogTitle>
            <DialogDescription>
              Store details help your team identify the right tools and links.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website (https:// only)</Label>
              <Input
                id="website"
                placeholder="https://example.com"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL (https:// only)</Label>
              <Input
                id="logoUrl"
                placeholder="https://example.com/logo.png"
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Create store"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the store. Links, templates and devices assigned to it will remain
              but lose their store assignment. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
