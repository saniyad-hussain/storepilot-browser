import { prisma } from "@/lib/prisma";

/**
 * Audit log helper. Logs important admin actions for accountability.
 * Failures are swallowed (logged to console) so an audit issue never blocks
 * the primary action.
 */
export async function logAudit(params: {
  workspaceId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: unknown;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        workspaceId: params.workspaceId,
        userId: params.userId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        metadata: params.metadata !== undefined ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}
