import { NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";
import { PermissionError } from "@/lib/permissions";

/** Standard JSON error response. */
export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Parse and validate a JSON body against a Zod schema. */
export async function parseBody<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new PermissionError("Invalid JSON body.", 400);
  }
  return schema.parse(body);
}

/**
 * Wraps a route handler with consistent error handling for validation and
 * permission errors.
 */
export function handleApiError(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    const first = err.errors[0];
    return jsonError(first ? `${first.path.join(".")}: ${first.message}`.replace(/^: /, "") : "Invalid input.", 400);
  }
  if (err instanceof PermissionError) {
    return jsonError(err.message, err.status);
  }
  console.error("Unhandled API error:", err);
  return jsonError("Something went wrong. Please try again.", 500);
}
