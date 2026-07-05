import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe, mapStripeStatus } from "@/lib/stripe";
import { getPlanForPriceId } from "@/lib/plans";
import { logAudit } from "@/lib/audit";

/**
 * POST /api/stripe/webhook
 * Verifies the Stripe signature and syncs subscription state to the database.
 *
 * Handled events:
 * - checkout.session.completed
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured.");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const payload = await req.text();
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncSubscription(subscription);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscription(subscription);
        break;
      }

      case "invoice.payment_succeeded":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription?.id;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncSubscription(subscription);
        }
        break;
      }

      default:
        // Ignore unhandled event types.
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }
}

/** Sync a Stripe subscription to the matching workspace. */
async function syncSubscription(subscription: Stripe.Subscription): Promise<void> {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  // Prefer explicit workspaceId metadata, fall back to customer lookup.
  const workspaceId = subscription.metadata?.workspaceId;
  const workspace = workspaceId
    ? await prisma.workspace.findUnique({ where: { id: workspaceId } })
    : await prisma.workspace.findUnique({ where: { stripeCustomerId: customerId } });

  if (!workspace) {
    console.warn(`Webhook: no workspace found for Stripe customer ${customerId}`);
    return;
  }

  const priceId = subscription.items.data[0]?.price?.id ?? "";
  const status = mapStripeStatus(subscription.status);
  const isEnded = subscription.status === "canceled" || subscription.status === "incomplete_expired";
  const plan = isEnded ? "NONE" : getPlanForPriceId(priceId);

  const previousStatus = workspace.subscriptionStatus;

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: status,
      plan,
    },
  });

  if (previousStatus !== status) {
    await logAudit({
      workspaceId: workspace.id,
      action: "billing.status_changed",
      entityType: "Workspace",
      entityId: workspace.id,
      metadata: { from: previousStatus, to: status, plan },
    });
  }
}
