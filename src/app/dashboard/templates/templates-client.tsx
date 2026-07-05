"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Copy, MessageSquare, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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

export type TemplateItem = {
  id: string;
  title: string;
  body: string;
  category: string | null;
  storeId: string | null;
  storeName: string | null;
};

type StoreOption = { id: string; name: string };

type Props = {
  workspaceId: string;
  canManage: boolean;
  stores: StoreOption[];
  initialTemplates: TemplateItem[];
};

type FormState = { title: string; body: string; category: string; storeId: string };
const emptyForm: FormState = { title: "", body: "", category: "", storeId: "none" };

export function TemplatesClient({ workspaceId, canManage, stores, initialTemplates }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TemplateItem[]>(initialTemplates);
  const [filterStore, setFilterStore] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TemplateItem | null>(null);
  const [deleting, setDeleting] = useState<TemplateItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      templates.filter((t) => {
        if (filterStore === "all") return true;
        if (filterStore === "none") return t.storeId === null;
        return t.storeId === filterStore;
      }),
    [templates, filterStore]
  );

  async function copyTemplate(template: TemplateItem) {
    try {
      await navigator.clipboard.writeText(template.body);
      setCopiedId(template.id);
      toast({ title: "Copied to clipboard" });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({ title: "Could not copy", variant: "destructive" });
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(template: TemplateItem) {
    setEditing(template);
    setForm({
      title: template.title,
      body: template.body,
      category: template.category ?? "",
      storeId: template.storeId ?? "none",
    });
    setDialogOpen(true);
  }

  async function save() {
    if (!form.title.trim() || !form.body.trim()) {
      toast({ title: "Title and body are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        body: form.body,
        category: form.category,
        storeId: form.storeId === "none" ? null : form.storeId,
      };
      const url = editing
        ? `/api/workspaces/${workspaceId}/templates/${editing.id}`
        : `/api/workspaces/${workspaceId}/templates`;
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
      const storeName = stores.find((s) => s.id === body.template.storeId)?.name ?? null;
      const item: TemplateItem = { ...body.template, storeName };
      if (editing) {
        setTemplates((prev) => prev.map((t) => (t.id === editing.id ? item : t)));
        toast({ title: "Template updated" });
      } else {
        setTemplates((prev) => [item, ...prev]);
        toast({ title: "Template created" });
      }
      setDialogOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    const res = await fetch(`/api/workspaces/${workspaceId}/templates/${deleting.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast({ title: "Error", description: body.error, variant: "destructive" });
    } else {
      setTemplates((prev) => prev.filter((t) => t.id !== deleting.id));
      toast({ title: "Template deleted" });
      router.refresh();
    }
    setDeleting(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reply Templates</h1>
          <p className="text-muted-foreground">
            Ready-to-copy customer replies for your whole team.
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add template
          </Button>
        )}
      </div>

      <Select value={filterStore} onValueChange={setFilterStore}>
        <SelectTrigger className="w-56">
          <SelectValue placeholder="All stores" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All stores</SelectItem>
          <SelectItem value="none">Workspace-wide only</SelectItem>
          {stores.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              {templates.length === 0
                ? "No templates yet. Create replies your team can copy in one click."
                : "No templates match your filter."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((template) => (
            <Card key={template.id}>
              <CardContent className="space-y-3 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{template.title}</span>
                    {template.category && <Badge variant="secondary">{template.category}</Badge>}
                    {template.storeName && <Badge variant="outline">{template.storeName}</Badge>}
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{template.body}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyTemplate(template)}>
                    {copiedId === template.id ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    Copy
                  </Button>
                  {canManage && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => openEdit(template)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setDeleting(template)}
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
            <DialogTitle>{editing ? "Edit template" : "Add template"}</DialogTitle>
            <DialogDescription>
              Write the exact reply your team should copy and send.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Store hours reply"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Reply text *</Label>
              <Textarea
                id="body"
                rows={5}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g. General"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
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
                    <SelectItem value="none">All stores</SelectItem>
                    {stores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Create template"}
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
