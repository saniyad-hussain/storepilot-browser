import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { requireMembership, PermissionError } from "@/lib/permissions";
import { getStripe } from "@/lib/stripe";
import { getPriceIdForPlan } from "@/lib/plans";
import { checkoutSchema } from "@/lib/validation";
import { handleApiError, parseBody } from "@/lib/api-helpers";

/**
 * POST /api/stripe/create-checkout-session
 * Creates a Stripe Checkout session for a subscription. OWNER/ADMIN only.
 * All Stripe operations happen server-side; no secret keys leave the backend.
 */
export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    const data = await parseBody(req, checkoutSchema);
    await requireMembership(userId, data.workspaceId, "ADMIN");

    const workspace = await prisma.workspace.findUniqueOrThrow({
      where: { id: data.workspaceId },
      include: { owner: { select: { email: true } } },
    });

    const priceId = getPriceIdForPlan(data.plan);
    if (!priceId) {
      throw new PermissionError("This plan is not configured. Contact support.", 500);
    }

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Reuse or create the Stripe customer for this workspace.
    let customerId = workspace.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: workspace.owner.email,
        name: workspace.name,
        metadata: { workspaceId: workspace.id },
      });
      customerId = customer.id;
      await prisma.workspace.update({
        where: { id: workspace.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard/billing?checkout=success`,
      cancel_url: `${appUrl}/onboarding?checkout=canceled`,
      metadata: { workspaceId: workspace.id, plan: data.plan },
      subscription_data: {
        metadata: { workspaceId: workspace.id, plan: data.plan },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return handleApiError(err);
  }
}
