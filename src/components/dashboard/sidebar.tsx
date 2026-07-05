"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Shield,
  LayoutDashboard,
  Store,
  Link2,
  MessageSquare,
  Users,
  Monitor,
  ClipboardCheck,
  LifeBuoy,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/stores", label: "Stores", icon: Store },
  { href: "/dashboard/links", label: "Tool Links", icon: Link2 },
  { href: "/dashboard/templates", label: "Reply Templates", icon: MessageSquare },
  { href: "/dashboard/team", label: "Team", icon: Users },
  { href: "/dashboard/devices", label: "Devices", icon: Monitor },
  { href: "/dashboard/safety-checks", label: "Safety Checks", icon: ClipboardCheck },
  { href: "/dashboard/support", label: "Support Requests", icon: LifeBuoy },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

type SidebarProps = {
  workspaceName: string;
  role: string;
};

export function Sidebar({ workspaceName, role }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {navItems.map((item) => {
        const active =
          item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const header = (
    <div className="border-b px-4 py-4">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <span className="font-bold">StorePilot</span>
      </div>
      <div className="mt-2 truncate text-sm text-muted-foreground">{workspaceName}</div>
      <Badge variant="secondary" className="mt-1 text-xs">
        {role}
      </Badge>
    </div>
  );

  const footer = (
    <div className="border-t p-3">
      <Button
        variant="ghost"
        className="w-full justify-start text-muted-foreground"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        <LogOut className="h-4 w-4" /> Log out
      </Button>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b bg-background px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-bold">StorePilot</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="border-b bg-background md:hidden">
          {nav}
          {footer}
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-background md:flex">
        {header}
        {nav}
        {footer}
      </aside>
    </>
  );
}
