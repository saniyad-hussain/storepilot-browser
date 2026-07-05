import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation";
import { handleApiError, jsonError, parseBody } from "@/lib/api-helpers";
import { rateLimit, clientKey } from "@/lib/rate-limit";

/** POST /api/auth/register — create a user account. */
export async function POST(req: Request) {
  try {
    if (!rateLimit(clientKey(req, "register"), 10, 60 * 60 * 1000)) {
      return jsonError("Too many registration attempts. Please try again later.", 429);
    }

    const data = await parseBody(req, registerSchema);
    const email = data.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return jsonError("An account with this email already exists.", 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: { name: data.name.trim(), email, passwordHash },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
