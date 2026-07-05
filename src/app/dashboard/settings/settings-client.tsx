"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings, Shield, KeyRound, Chrome, Copy, Check, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";

type Props = {
  workspaceId: string;
  workspaceName: string;
  canManage: boolean;
  canGenerateToken: boolean;
};

export function SettingsClient({ workspaceId, workspaceName, canManage, canGenerateToken }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState(workspaceName);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function saveName() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: body.error, variant: "destructive" });
        return;
      }
      toast({ title: "Workspace updated" });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function generateToken() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/extension-tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: "Extension connection token" }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: body.error, variant: "destructive" });
        return;
      }
      setNewToken(body.token);
    } finally {
      setGenerating(false);
    }
  }

  async function downloadExtension() {
    setDownloading(true);
    try {
      const res = await fetch("/api/extension/download");
      if (!res.ok) {
        toast({ title: "Error", description: "Failed to download extension.", variant: "destructive" });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "storepilot-extension.zip";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  async function copyToken() {
    if (!newToken) return;
    await navigator.clipboard.writeText(newToken);
    setCopied(true);
    toast({ title: "Token copied" });
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Workspace settings and extension setup.</p>
      </div>

      {/* Workspace settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" /> Workspace
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-md space-y-2">
            <Label htmlFor="workspaceName">Workspace name</Label>
            <Input
              id="workspaceName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canManage}
            />
          </div>
          {canManage && (
            <Button onClick={saveName} disabled={saving || name === workspaceName}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Extension setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Chrome className="h-5 w-5" /> Chrome extension setup
          </CardTitle>
          <CardDescription>
            Install the StorePilot Access Hub extension on each store PC and connect it with a
            token.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="mb-4">
            <Button variant="outline" onClick={downloadExtension} disabled={downloading}>
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download Chrome Extension (.zip)
            </Button>
            <p className="mt-1 text-xs text-muted-foreground">Download the Chrome extension ZIP, then load it on each store PC using Developer mode.</p>
          </div>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              Open Chrome on the store PC and go to <code>chrome://extensions</code>.
            </li>
            <li>Enable “Developer mode” (top right).</li>
            <li>
              Click “Load unpacked” and select the <code>extension</code> folder from the
              StorePilot package.
            </li>
            <li>Open the extension options page (right-click icon → Options).</li>
            <li>Enter your API base URL and paste a connection token generated below.</li>
            <li>Give the PC a clear name (e.g. “Front Counter PC”) and pick its store.</li>
            <li>Click “Connect &amp; register device”.</li>
          </ol>

          {canGenerateToken && (
            <div className="space-y-3 rounded-lg border p-4">
              <p className="text-sm font-medium">Generate a connection token</p>
              <p className="text-sm text-muted-foreground">
                The token is shown once only. Treat it like a key — anyone with the token can
                read your workspace links and templates.
              </p>
              {newToken ? (
                <div className="flex items-center gap-2">
                  <Input readOnly value={newToken} className="font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={copyToken}>
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              ) : (
                <Button onClick={generateToken} disabled={generating}>
                  {generating && <Loader2 className="h-4 w-4 animate-spin" />}
                  <KeyRound className="h-4 w-4" /> Generate token
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Security notice</AlertTitle>
        <AlertDescription className="space-y-1">
          <p>
            StorePilot never stores passwords for your business tools. Keep passwords in an
            approved password manager (1Password or Bitwarden).
          </p>
          <p>
            StorePilot is not antivirus software and does not guarantee protection from hacking.
            It helps your team organize access and follow safer browser practices.
          </p>
        </AlertDescription>
      </Alert>

      {/* Privacy notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Privacy notice</AlertTitle>
        <AlertDescription>
          The extension does not collect browsing history, cookies, or keystrokes, and does not
          monitor employees secretly. Devices report only their name and a last-seen timestamp.
          See the full{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="text-primary hover:underline">
            Terms
          </Link>
          .
        </AlertDescription>
      </Alert>
    </div>
  );
}
