import { NextRequest } from "next/server";

/**
 * Cron routes are authorized by either:
 *   - a `?secret=` query param (used by the internal scan trigger and the
 *     local verification harness), or
 *   - an `Authorization: Bearer <CRON_SECRET>` header, which Vercel Cron sends
 *     automatically when a CRON_SECRET env var is set.
 */
export function isCronAuthorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const secretParam = request.nextUrl.searchParams.get("secret");
  if (secretParam === expected) return true;

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${expected}`;
}
