import Stripe from "stripe";

/**
 * Server-side Stripe client. NEVER import this from client components or
 * expose the secret key to the frontend or Chrome extension.
 */
let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not configured.");
    }
    stripeClient = new Stripe(key, {
      apiVersion: "2025-02-24.acacia" as Stripe.LatestApiVersion,
      typescript: true,
    });
  }
  return stripeClient;
}

/** Map Stripe subscription status strings to our enum values. */
export function mapStripeStatus(
  status: Stripe.Subscription.Status
): "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "UNPAID" | "INCOMPLETE" | "INCOMPLETE_EXPIRED" | "PAUSED" {
  switch (status) {
    case "trialing":
      return "TRIALING";
    case "active":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
      return "CANCELED";
    case "unpaid":
      return "UNPAID";
    case "incomplete":
      return "INCOMPLETE";
    case "incomplete_expired":
      return "INCOMPLETE_EXPIRED";
    case "paused":
      return "PAUSED";
    default:
      return "CANCELED";
  }
}
