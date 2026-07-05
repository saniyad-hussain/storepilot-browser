import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { requireMembership, PermissionError } from "@/lib/permissions";
import { getStripe } from "@/lib/stripe";
import { portalSchema } from "@/lib/validation";
import { handleApiError, parseBody } from "@/lib/api-helpers";

/**
 * POST /api/stripe/create-portal-session
 * Creates a Stripe Customer Portal session so the owner can manage billing.
 */
export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    const data = await parseBody(req, portalSchema);
    await requireMembership(userId, data.workspaceId, "ADMIN");

    const workspace = await prisma.workspace.findUniqueOrThrow({
      where: { id: data.workspaceId },
    });
    if (!workspace.stripeCustomerId) {
      throw new PermissionError("No billing account exists yet. Choose a plan first.", 400);
    }

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.billingPortal.sessions.create({
      customer: workspace.stripeCustomerId,
      return_url: `${appUrl}/dashboard/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return handleApiError(err);
  }
}
