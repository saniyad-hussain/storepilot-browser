import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { isSubscriptionUsable } from "@/lib/permissions";

/**
 * Extension token authentication.
 *
 * Tokens are random 32-byte values shown to the user exactly once. Only the
 * SHA-256 hash is stored in the database. The extension sends the raw token
 * in the Authorization header: `Bearer sp_ext_<token>`.
 */

export const TOKEN_PREFIX = "sp_ext_";

export function generateExtensionToken(): { raw: string; hash: string } {
  const raw = TOKEN_PREFIX + randomBytes(32).toString("hex");
  return { raw, hash: hashToken(raw) };
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export type ExtensionAuthResult =
  | { ok: true; token: ExtensionTokenContext }
  | { ok: false; status: number; error: string };

export type ExtensionTokenContext = {
  tokenId: string;
  workspaceId: string;
  userId: string;
  role: string;
  subscriptionUsable: boolean;
};

/**
 * Authenticates a Request from the Chrome extension using its bearer token.
 * Also enforces subscription gating with a clear error message.
 */
export async function authenticateExtension(
  req: Request,
  { requireSubscription = true }: { requireSubscription?: boolean } = {}
): Promise<ExtensionAuthResult> {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match || !match[1].startsWith(TOKEN_PREFIX)) {
    return { ok: false, status: 401, error: "Missing or invalid extension token." };
  }

  const tokenHash = hashToken(match[1].trim());
  const token = await prisma.extensionToken.findUnique({
    where: { tokenHash },
    include: {
      workspace: { select: { subscriptionStatus: true } },
      user: { select: { id: true } },
    },
  });

  if (!token || token.revokedAt) {
    return { ok: false, status: 401, error: "Extension token is invalid or revoked." };
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: token.workspaceId, userId: token.userId } },
  });
  if (!membership) {
    return { ok: false, status: 403, error: "Token owner is no longer a workspace member." };
  }

  const subscriptionUsable = isSubscriptionUsable(token.workspace.subscriptionStatus);
  if (requireSubscription && !subscriptionUsable) {
    return {
      ok: false,
      status: 402,
      error: "Subscription inactive. Please contact your workspace owner.",
    };
  }

  // Update lastUsedAt without blocking the request.
  prisma.extensionToken
    .update({ where: { id: token.id }, data: { lastUsedAt: new Date() } })
    .catch(() => undefined);

  return {
    ok: true,
    token: {
      tokenId: token.id,
      workspaceId: token.workspaceId,
      userId: token.userId,
      role: membership.role,
      subscriptionUsable,
    },
  };
}
