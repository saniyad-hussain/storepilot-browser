import Link from "next/link";
import {
  Shield,
  Store,
  Link2,
  MessageSquare,
  MonitorCheck,
  KeyRound,
  Users,
  CheckCircle2,
  XCircle,
  Chrome,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLAN_CONFIGS } from "@/lib/plans";

const features = [
  {
    icon: Link2,
    title: "Organized store links",
    description:
      "Social media, website admin, POS, Canva, Google Drive, vendor portals — everything your team needs, one click away.",
  },
  {
    icon: MessageSquare,
    title: "Customer reply templates",
    description:
      "Store hours, delivery questions, order status, price requests — reply faster with consistent, professional answers.",
  },
  {
    icon: Chrome,
    title: "Chrome extension for store PCs",
    description:
      "A lightweight popup on every store computer with quick links, templates, and a one-click support request form.",
  },
  {
    icon: MonitorCheck,
    title: "Monthly browser safety checks",
    description:
      "Track Chrome updates, review suspicious extensions, check saved-password risk, and verify 2FA — per device.",
  },
  {
    icon: KeyRound,
    title: "Password manager support",
    description:
      "We never store passwords. We help your team adopt 1Password or Bitwarden and follow safer login practices.",
  },
  {
    icon: Users,
    title: "Team roles & audit logs",
    description:
      "Owner, admin, manager, staff and viewer roles with server-side permissions and an audit trail of admin actions.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">StorePilot</span>
            <span className="hidden text-sm text-muted-foreground sm:inline">
              Browser Security &amp; Access Hub
            </span>
          </div>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="container flex flex-col items-center gap-6 py-20 text-center">
          <Badge variant="secondary" className="px-3 py-1">
            For multi-store businesses with 5–6 store PCs
          </Badge>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            A safer browser workspace for your store team
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Organized links, secure access practices, password manager support, and monthly
            browser safety checks — for every PC in every store.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/register">Start your workspace</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#pricing">See pricing</Link>
            </Button>
          </div>
          <p className="max-w-xl text-sm text-muted-foreground">
            We organize access and support safer browser practices. We do not store passwords
            and we are not antivirus software.
          </p>
        </section>

        {/* Positioning copy */}
        <section className="border-y bg-muted/40">
          <div className="container max-w-4xl space-y-4 py-14 text-center">
            <h2 className="text-2xl font-semibold">Built for daily store operations</h2>
            <p className="text-muted-foreground">
              StorePilot Browser Security &amp; Access Hub helps multi-store businesses organize
              their daily browser workflow, reduce unsafe password sharing, and keep important
              store tools easier to access.
            </p>
            <p className="text-muted-foreground">
              Your team gets a custom Chrome extension with quick access to social media, website
              admin, POS, Canva, vendor portals, customer reply templates, and support requests.
            </p>
            <p className="text-muted-foreground">
              We do not store passwords inside the extension. Passwords should remain inside a
              secure password manager such as 1Password or Bitwarden. StorePilot helps your team
              access the right tools, follow safer login practices, and reduce common mistakes
              like using the wrong account, sharing passwords, or losing important business links.
            </p>
            <p className="text-muted-foreground">
              Our monthly service includes browser safety checks, access reviews, 2FA support,
              employee onboarding/offboarding support, and store link/template updates.
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="container py-20">
          <h2 className="mb-10 text-center text-3xl font-bold">Everything in one hub</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <feature.icon className="mb-2 h-8 w-8 text-primary" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* What we do / don't do */}
        <section className="border-y bg-muted/40 py-16">
          <div className="container grid max-w-4xl gap-8 md:grid-cols-2">
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                <CheckCircle2 className="h-5 w-5 text-green-600" /> What StorePilot does
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Organizes business links and reply templates per store</li>
                <li>Reduces risky password sharing habits</li>
                <li>Helps review suspicious browser extensions</li>
                <li>Supports 2FA setup and recovery info reviews</li>
                <li>Tracks store PCs and monthly browser safety checks</li>
                <li>Gives your team a simple support request channel</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                <XCircle className="h-5 w-5 text-red-500" /> What StorePilot does not do
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Does not store passwords — use 1Password or Bitwarden</li>
                <li>Is not antivirus software</li>
                <li>Does not collect browsing history or cookies</li>
                <li>Does not record keystrokes</li>
                <li>Does not monitor employees secretly</li>
                <li>Does not claim any computer is 100% safe</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="container py-20">
          <h2 className="mb-2 text-center text-3xl font-bold">Simple monthly pricing</h2>
          <p className="mb-10 text-center text-muted-foreground">
            Every plan includes the dashboard, Chrome extension, and monthly safety checklists.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {Object.values(PLAN_CONFIGS).map((plan) => (
              <Card key={plan.plan} className={plan.plan === "BUSINESS" ? "border-primary shadow-md" : ""}>
                <CardHeader>
                  {plan.plan === "BUSINESS" && (
                    <Badge className="mb-2 w-fit">Most popular</Badge>
                  )}
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    ${plan.priceMonthly}
                    <span className="text-base font-normal text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" asChild>
                    <Link href="/register">Choose {plan.name}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t bg-primary py-16 text-primary-foreground">
          <div className="container flex flex-col items-center gap-4 text-center">
            <Store className="h-10 w-10" />
            <h2 className="text-3xl font-bold">Make your store computers safer for daily business</h2>
            <p className="max-w-xl opacity-90">
              Organize browser access, reduce risky password sharing, review suspicious extensions,
              and help your team follow safer login practices.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register">Get started today</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} StorePilot Browser Security &amp; Access Hub
          </p>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/login" className="hover:text-foreground">
              Log in
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
