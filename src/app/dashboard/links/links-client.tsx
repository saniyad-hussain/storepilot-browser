"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Link2,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { humanize } from "@/lib/utils";

const CATEGORIES = [
  "SOCIAL_MEDIA",
  "WEBSITE",
  "ADS",
  "POS",
  "CANVA",
  "GOOGLE",
  "VENDOR",
  "SHIPPING",
  "FINANCE",
  "PASSWORD_MANAGER",
  "OTHER",
] as const;

export type LinkItem = {
  id: string;
  title: string;
  url: string;
  category: string;
  description: string | null;
  isSensitive: boolean;
  storeId: string | null;
  storeName: string | null;
};

type StoreOption = { id: string; name: string };

type Props = {
  workspaceId: string;
  canManage: boolean;
  stores: StoreOption[];
  initialLinks: LinkItem[];
};

type FormState = {
  title: string;
  url: string;
  category: string;
  storeId: string;
  description: string;
  isSensitive: boolean;
};

const emptyForm: FormState = {
  title: "",
  url: "",
  category: "OTHER",
  storeId: "none",
  description: "",
  isSensitive: false,
};

export function LinksClient({ workspaceId, canManage, stores, initialLinks }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [links, setLinks] = useState<LinkItem[]>(initialLinks);
  const [filterStore, setFilterStore] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LinkItem | null>(null);
  const [deleting, setDeleting] = useState<LinkItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(
    () =>
      links.filter((l) => {
        if (filterStore !== "all" && l.storeId !== (filterStore === "none" ? null : filterStore))
          return false;
        if (filterCategory !== "all" && l.category !== filterCategory) return false;
        return true;
      }),
    [links, filterStore, filterCategory]
  );

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(link: LinkItem) {
    setEditing(link);
    setForm({
      title: link.title,
      url: link.url,
      category: link.category,
      storeId: link.storeId ?? "none",
      description: link.description ?? "",
      isSensitive: link.isSensitive,
    });
    setDialogOpen(true);
  }

  async function save() {
    if (!form.title.trim() || !form.url.trim()) {
      toast({ title: "Title and URL are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        url: form.url,
        category: form.category,
        storeId: form.storeId === "none" ? null : form.storeId,
        description: form.description,
        isSensitive: form.isSensitive,
      };
      const url = editing
        ? `/api/workspaces/${workspaceId}/links/${editing.id}`
        : `/api/workspaces/${workspaceId}/links`;
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: body.error, variant: "destructive" });
        return;
      }
      const storeName = stores.find((s) => s.id === body.link.storeId)?.name ?? null;
      const item: LinkItem = { ...body.link, storeName };
      if (editing) {
        setLinks((prev) => prev.map((l) => (l.id === editing.id ? item : l)));
        toast({ title: "Link updated" });
      } else {
        setLinks((prev) => [item, ...prev]);
        toast({ title: "Link created" });
      }
      setDialogOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    const res = await fetch(`/api/workspaces/${workspaceId}/links/${deleting.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast({ title: "Error", description: body.error, variant: "destructive" });
    } else {
      setLinks((prev) => prev.filter((l) => l.id !== deleting.id));
      toast({ title: "Link deleted" });
      router.refresh();
    }
    setDeleting(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tool Links</h1>
          <p className="text-muted-foreground">
            Organize business tools your team uses every day.
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add link
          </Button>
        )}
      </div>

      <Alert variant="warning">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Do not enter passwords here</AlertTitle>
        <AlertDescription>
          Use 1Password, Bitwarden, or your approved password manager. StorePilot stores links
          only — never passwords.
        </AlertDescription>
      </Alert>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterStore} onValueChange={setFilterStore}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All stores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stores</SelectItem>
            <SelectItem value="none">No store assigned</SelectItem>
            {stores.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {humanize(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Link2 className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              {links.length === 0 ? "No links yet. Add your first tool link." : "No links match your filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((link) => (
            <Card key={link.id}>
              <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{link.title}</span>
                    <Badge variant="secondary">{humanize(link.category)}</Badge>
                    {link.storeName && <Badge variant="outline">{link.storeName}</Badge>}
                    {link.isSensitive && (
                      <Badge variant="warning">
                        <ShieldAlert className="mr-1 h-3 w-3" /> Sensitive
                      </Badge>
                    )}
                  </div>
                  <div className="truncate text-sm text-muted-foreground">{link.url}</div>
                  {link.description && (
                    <div className="text-sm text-muted-foreground">{link.description}</div>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" /> Open
                    </a>
                  </Button>
                  {canManage && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => openEdit(link)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setDeleting(link)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit link" : "Add link"}</DialogTitle>
            <DialogDescription>
              Only http:// and https:// URLs are allowed. Never store passwords here.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                placeholder="https://..."
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {humanize(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Store</Label>
                <Select
                  value={form.storeId}
                  onValueChange={(v) => setForm({ ...form, storeId: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">All stores / none</SelectItem>
                    {stores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isSensitive"
                checked={form.isSensitive}
                onCheckedChange={(v) => setForm({ ...form, isSensitive: v === true })}
              />
              <Label htmlFor="isSensitive" className="cursor-pointer">
                Mark as sensitive (admin/login pages)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Create link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
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
