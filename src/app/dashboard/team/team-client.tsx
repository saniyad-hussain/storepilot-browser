"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Trash2, Users, Loader2 } from "lucide-react";
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

const ASSIGNABLE_ROLES = ["ADMIN", "MANAGER", "STAFF", "VIEWER"] as const;

const ROLE_DESCRIPTIONS: Record<string, string> = {
  OWNER: "Full access to everything",
  ADMIN: "Full workspace management except removing the owner",
  MANAGER: "Manage stores, links, templates, support, devices, safety checks",
  STAFF: "View extension dashboard and create support requests",
  VIEWER: "View allowed links and templates only",
};

export type MemberItem = {
  id: string;
  role: string;
  userId: string;
  name: string;
  email: string;
};

type Props = {
  workspaceId: string;
  currentUserId: string;
  canManage: boolean;
  initialMembers: MemberItem[];
};

export function TeamClient({ workspaceId, currentUserId, canManage, initialMembers }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [members, setMembers] = useState<MemberItem[]>(initialMembers);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removing, setRemoving] = useState<MemberItem | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("STAFF");
  const [saving, setSaving] = useState(false);

  async function invite() {
    if (!inviteEmail.trim()) {
      toast({ title: "Email is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          name: inviteName.trim() || undefined,
          role: inviteRole,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: body.error, variant: "destructive" });
        return;
      }
      setMembers((prev) => [
        ...prev,
        {
          id: body.member.id,
          role: body.member.role,
          userId: body.member.user.id,
          name: body.member.user.name,
          email: body.member.user.email,
        },
      ]);
      toast({
        title: "Member invited",
        description: "They can log in by registering with this email address.",
      });
      setInviteOpen(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("STAFF");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function changeRole(member: MemberItem, role: string) {
    const res = await fetch(`/api/workspaces/${workspaceId}/members/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const body = await res.json();
    if (!res.ok) {
      toast({ title: "Error", description: body.error, variant: "destructive" });
      return;
    }
    setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, role } : m)));
    toast({ title: "Role updated" });
    router.refresh();
  }

  async function confirmRemove() {
    if (!removing) return;
    const res = await fetch(`/api/workspaces/${workspaceId}/members/${removing.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast({ title: "Error", description: body.error, variant: "destructive" });
    } else {
      setMembers((prev) => prev.filter((m) => m.id !== removing.id));
      toast({ title: "Member removed" });
      router.refresh();
    }
    setRemoving(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-muted-foreground">Invite team members and manage their roles.</p>
        </div>
        {canManage && (
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" /> Invite member
          </Button>
        )}
      </div>

      {members.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Users className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No members yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  {canManage && <TableHead className="w-24">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.name}
                      {member.userId === currentUserId && (
                        <Badge variant="secondary" className="ml-2">
                          You
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{member.email}</TableCell>
                    <TableCell>
                      {member.role === "OWNER" || !canManage ? (
                        <Badge variant={member.role === "OWNER" ? "default" : "secondary"}>
                          {member.role}
                        </Badge>
                      ) : (
                        <Select
                          value={member.role}
                          onValueChange={(v) => changeRole(member, v)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ASSIGNABLE_ROLES.map((r) => (
                              <SelectItem key={r} value={r}>
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        {member.role !== "OWNER" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setRemoving(member)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Role explanations */}
      <Card>
        <CardContent className="space-y-2 pt-4 text-sm">
          <p className="font-medium">Role permissions</p>
          {Object.entries(ROLE_DESCRIPTIONS).map(([role, desc]) => (
            <div key={role} className="flex gap-2 text-muted-foreground">
              <Badge variant="outline" className="w-24 justify-center">
                {role}
              </Badge>
              <span>{desc}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite team member</DialogTitle>
            <DialogDescription>
              The invited person completes setup by registering with this email address.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Email *</Label>
              <Input
                id="inviteEmail"
                type="email"
                placeholder="team@business.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inviteName">Name</Label>
              <Input
                id="inviteName"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r} — {ROLE_DESCRIPTIONS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={invite} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove confirmation */}
      <AlertDialog open={!!removing} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will lose access to this workspace immediately. Remember to also review any
              shared account access and rotate credentials in your password manager.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmRemove}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
