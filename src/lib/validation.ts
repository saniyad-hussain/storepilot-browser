import { z } from "zod";

/**
 * Shared Zod validation schemas. Every API route validates its input with
 * one of these schemas before touching the database.
 */

// --- URL safety --------------------------------------------------------------

/**
 * Sanitizes and validates a URL. Only http/https protocols are allowed.
 * Blocks javascript:, data:, file: and any other scheme.
 */
export function sanitizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return null;
  }
  return parsed.toString();
}

export const safeUrlSchema = z
  .string()
  .min(1, "URL is required")
  .max(2048, "URL is too long")
  .transform((val, ctx) => {
    const clean = sanitizeUrl(val);
    if (!clean) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Only http:// and https:// URLs are allowed.",
      });
      return z.NEVER;
    }
    return clean;
  });

// --- Enums -------------------------------------------------------------------

export const roleSchema = z.enum(["OWNER", "ADMIN", "MANAGER", "STAFF", "VIEWER"]);
export const assignableRoleSchema = z.enum(["ADMIN", "MANAGER", "STAFF", "VIEWER"]);

export const linkCategorySchema = z.enum([
  "SOCIAL_MEDIA",
  "WEBSITE",
  "ADS",
  "POS",
  "CANVA",
  "GOOGLE",
  "VENDOR",
  "SHIPPING",
  "FINANCE",
  "PASSWORD_MANAGER",
  "OTHER",
]);

export const supportRequestTypeSchema = z.enum([
  "LOGIN_PROBLEM",
  "NEED_ACCESS",
  "WRONG_STORE",
  "WEBSITE_ISSUE",
  "SOCIAL_MEDIA_ISSUE",
  "BROWSER_SAFETY",
  "OTHER",
]);

export const supportRequestStatusSchema = z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]);

export const planChoiceSchema = z.enum(["STARTER", "BUSINESS", "PRO"]);

// --- Auth --------------------------------------------------------------------

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Enter a valid email").max(255),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .max(128, "Password is too long"),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

// --- Workspace / onboarding ----------------------------------------------------

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required").max(100),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
});

// --- Store ---------------------------------------------------------------------

export const storeSchema = z.object({
  name: z.string().min(1, "Store name is required").max(100),
  address: z.string().max(255).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  website: z
    .union([safeUrlSchema, z.literal("")])
    .optional(),
  logoUrl: z
    .union([safeUrlSchema, z.literal("")])
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex value like #2563eb")
    .optional()
    .or(z.literal("")),
  isActive: z.boolean().optional(),
});

// --- Tool link -------------------------------------------------------------------

export const toolLinkSchema = z.object({
  title: z.string().min(1, "Title is required").max(150),
  url: safeUrlSchema,
  category: linkCategorySchema,
  storeId: z.string().cuid().nullable().optional(),
  description: z.string().max(500).optional().or(z.literal("")),
  isSensitive: z.boolean().optional(),
});

// --- Reply template ---------------------------------------------------------------

export const replyTemplateSchema = z.object({
  title: z.string().min(1, "Title is required").max(150),
  body: z.string().min(1, "Template body is required").max(5000),
  category: z.string().max(80).optional().or(z.literal("")),
  storeId: z.string().cuid().nullable().optional(),
});

// --- Support request ----------------------------------------------------------------

export const supportRequestSchema = z.object({
  type: supportRequestTypeSchema,
  message: z.string().min(1, "Message is required").max(4000),
  storeId: z.string().cuid().nullable().optional(),
});

export const updateSupportRequestSchema = z.object({
  status: supportRequestStatusSchema,
});

// --- Team ------------------------------------------------------------------------

export const inviteMemberSchema = z.object({
  email: z.string().email("Enter a valid email").max(255),
  name: z.string().min(1).max(100).optional(),
  role: assignableRoleSchema,
});

export const updateMemberSchema = z.object({
  role: assignableRoleSchema,
});

// --- Device ------------------------------------------------------------------------

export const deviceSchema = z.object({
  name: z.string().min(1, "Device name is required").max(100),
  storeId: z.string().cuid().nullable().optional(),
});

// --- Browser safety check --------------------------------------------------------------

export const safetyCheckSchema = z.object({
  deviceId: z.string().cuid().nullable().optional(),
  storeId: z.string().cuid().nullable().optional(),
  chromeUpdated: z.boolean().optional(),
  suspiciousExtensionsRemoved: z.boolean().optional(),
  savedPasswordRiskReviewed: z.boolean().optional(),
  twoFactorReviewed: z.boolean().optional(),
  recoveryInfoReviewed: z.boolean().optional(),
  notes: z.string().max(4000).optional().or(z.literal("")),
});

// --- Billing -----------------------------------------------------------------------

export const checkoutSchema = z.object({
  workspaceId: z.string().cuid(),
  plan: planChoiceSchema,
});

export const portalSchema = z.object({
  workspaceId: z.string().cuid(),
});

// --- Extension ----------------------------------------------------------------------

export const extensionRegisterDeviceSchema = z.object({
  extensionInstallId: z.string().min(8).max(128),
  name: z.string().min(1, "Device name is required").max(100),
  storeId: z.string().cuid().nullable().optional(),
});

export const extensionHeartbeatSchema = z.object({
  extensionInstallId: z.string().min(8).max(128),
});

export const extensionSupportRequestSchema = z.object({
  extensionInstallId: z.string().min(8).max(128).optional(),
  type: supportRequestTypeSchema,
  message: z.string().min(1, "Message is required").max(4000),
  storeId: z.string().cuid().nullable().optional(),
});
