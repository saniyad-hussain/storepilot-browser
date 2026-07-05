import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Privacy Policy | StorePilot",
};

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-12">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
      </Button>

      <div className="mb-8 flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
      </div>

      <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Our privacy commitment</h2>
          <p>
            StorePilot Browser Security &amp; Access Hub is designed with privacy as a core
            principle. We collect the minimum data needed to organize your team&apos;s browser
            workflow — nothing more.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">What we do NOT collect</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong className="text-foreground">We do not store passwords.</strong> StorePilot
              never asks for, stores, or transmits passwords for your business tools. Passwords
              belong in an approved password manager such as 1Password or Bitwarden.
            </li>
            <li>
              <strong className="text-foreground">We do not collect browsing history.</strong> The
              Chrome extension does not read, track, or transmit the pages you visit.
            </li>
            <li>
              <strong className="text-foreground">We do not collect cookies.</strong> The extension
              does not read or access browser cookies from any website.
            </li>
            <li>
              <strong className="text-foreground">We do not record keystrokes.</strong> No
              keylogging of any kind is performed.
            </li>
            <li>
              <strong className="text-foreground">We do not track employees secretly.</strong> All
              device tracking (device name and last-seen time) is visible to your whole team in the
              dashboard.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">What we store</h2>
          <p>We only store the business data you and your team intentionally create:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Your account name, email, and a securely hashed login password for this dashboard</li>
            <li>Business links (URLs and titles) that your team adds</li>
            <li>Customer reply templates your team writes</li>
            <li>Support requests submitted by your team</li>
            <li>Device names and extension install identifiers for registered store PCs</li>
            <li>Browser safety checklist records created by your team</li>
            <li>Audit logs of important admin actions in your workspace</li>
            <li>Subscription status from our payment provider (Stripe)</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Chrome extension permissions</h2>
          <p>
            The StorePilot Access Hub extension uses the minimum permissions required: local
            storage (to remember your connection settings) and the ability to open links in new
            tabs when you click them. It does not request access to your browsing history,
            cookies, web requests, or the content of websites you visit.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Payments</h2>
          <p>
            Payments are processed by Stripe. We never see or store your full card details.
            Stripe&apos;s privacy policy applies to payment processing.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Data deletion</h2>
          <p>
            Workspace owners can delete stores, links, templates, devices, and safety check
            records at any time. Contact us to request full account and workspace deletion.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Contact</h2>
          <p>Questions about privacy? Contact your workspace administrator or our support team.</p>
        </section>
      </div>
    </div>
  );
}
