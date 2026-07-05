export type Plan = "NONE" | "STARTER" | "BUSINESS" | "PRO";

/** Plan limits and Stripe price mapping. Price IDs come from env vars only. */
export type PlanConfig = {
  plan: Plan;
  name: string;
  priceMonthly: number;
  maxUsers: number;
  maxStores: number;
  maxDevices: number;
  features: string[];
};

export const PLAN_CONFIGS: Record<Exclude<Plan, "NONE">, PlanConfig> = {
  STARTER: {
    plan: "STARTER",
    name: "Starter",
    priceMonthly: 99,
    maxUsers: 3,
    maxStores: 3,
    maxDevices: 3,
    features: [
      "Up to 3 users",
      "Up to 3 stores",
      "Up to 3 store PCs",
      "Chrome extension access",
      "Store links & reply templates",
      "Monthly browser safety checks",
      "Support requests",
    ],
  },
  BUSINESS: {
    plan: "BUSINESS",
    name: "Business",
    priceMonthly: 199,
    maxUsers: 10,
    maxStores: 10,
    maxDevices: 10,
    features: [
      "Up to 10 users",
      "Up to 10 stores",
      "Up to 10 store PCs",
      "Everything in Starter",
      "Team roles & permissions",
      "Audit logs",
      "Priority support",
    ],
  },
  PRO: {
    plan: "PRO",
    name: "Pro",
    priceMonthly: 299,
    maxUsers: 25,
    maxStores: 25,
    maxDevices: 25,
    features: [
      "Up to 25 users",
      "Up to 25 stores",
      "Up to 25 store PCs",
      "Everything in Business",
      "Onboarding/offboarding support",
      "Access reviews & 2FA support",
      "Dedicated support",
    ],
  },
};

/** Server-side only: resolve Stripe price id for a plan. */
export function getPriceIdForPlan(plan: Plan): string | null {
  switch (plan) {
    case "STARTER":
      return process.env.STRIPE_PRICE_STARTER ?? null;
    case "BUSINESS":
      return process.env.STRIPE_PRICE_BUSINESS ?? null;
    case "PRO":
      return process.env.STRIPE_PRICE_PRO ?? null;
    default:
      return null;
  }
}

/** Server-side only: resolve plan from a Stripe price id. */
export function getPlanForPriceId(priceId: string): Plan {
  if (priceId === process.env.STRIPE_PRICE_STARTER) return "STARTER";
  if (priceId === process.env.STRIPE_PRICE_BUSINESS) return "BUSINESS";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "PRO";
  return "NONE";
}

export function getPlanLimits(plan: Plan): { maxUsers: number; maxStores: number; maxDevices: number } {
  if (plan === "NONE") return { maxUsers: 1, maxStores: 1, maxDevices: 1 };
  const cfg = PLAN_CONFIGS[plan];
  return { maxUsers: cfg.maxUsers, maxStores: cfg.maxStores, maxDevices: cfg.maxDevices };
}
