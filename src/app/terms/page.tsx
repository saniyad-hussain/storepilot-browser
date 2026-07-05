import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Terms of Service | StorePilot",
};

export default function TermsPage() {
  return (
    <div className="container max-w-3xl py-12">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
      </Button>

      <div className="mb-8 flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Terms of Service</h1>
      </div>

      <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">1. What StorePilot is</h2>
          <p>
            StorePilot Browser Security &amp; Access Hub is a business organization tool. It helps
            multi-store businesses organize browser access to their tools, share customer reply
            templates, track store PCs, and follow safer browser practices through checklists and
            reviews.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">2. What StorePilot is NOT</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong className="text-foreground">This is not antivirus software.</strong>{" "}
              StorePilot does not scan for, detect, or remove malware. You should maintain
              separate, reputable antivirus/endpoint protection on your computers.
            </li>
            <li>
              <strong className="text-foreground">
                This does not guarantee full protection from hacking.
              </strong>{" "}
              No product can make a computer or browser 100% safe. StorePilot helps reduce common
              risks (like password sharing and suspicious extensions), but it cannot prevent every
              threat.
            </li>
            <li>
              <strong className="text-foreground">This is not a password manager.</strong>{" "}
              StorePilot never stores passwords. Passwords should be stored in an approved
              password manager such as 1Password or Bitwarden.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">3. Your responsibilities</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              Users are responsible for safe account practices, including strong unique passwords,
              enabling two-factor authentication, and keeping recovery information up to date.
            </li>
            <li>
              Passwords for business tools should be stored only in an approved password manager,
              never in StorePilot links, templates, notes, or support requests.
            </li>
            <li>
              Workspace owners are responsible for managing team member access, removing former
              employees promptly, and reviewing audit logs.
            </li>
            <li>
              You must only add links and content you have the right to use, and you must not use
              StorePilot for unlawful purposes.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">4. Subscriptions and billing</h2>
          <p>
            StorePilot is billed monthly through Stripe. If your subscription becomes inactive,
            access to the dashboard and extension features will be limited until billing is
            resolved. You may cancel at any time through the billing portal; access continues
            until the end of the paid period.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">5. Limitation of liability</h2>
          <p>
            StorePilot is provided &quot;as is&quot; without warranties of any kind. To the
            maximum extent permitted by law, we are not liable for security incidents, data
            breaches, account compromises, or business losses arising from the use of your
            computers, browsers, or third-party services. StorePilot is an organizational aid, not
            a security guarantee.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">6. Changes</h2>
          <p>
            We may update these terms from time to time. Continued use of the service after
            changes constitutes acceptance of the updated terms.
          </p>
        </section>
      </div>
    </div>
  );
}
