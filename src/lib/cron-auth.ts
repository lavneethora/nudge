import { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

/**
 * Cron routes are authorized by an `Authorization: Bearer <CRON_SECRET>`
 * header, which Vercel Cron sends automatically when a CRON_SECRET env var is
 * set, and which internal self-calls send explicitly.
 *
 * The secret is deliberately NOT accepted as a `?secret=` query param — query
 * strings are recorded in Vercel access logs, proxy logs, and browser history.
 */
export function isCronAuthorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;

  return safeEqual(authHeader, `Bearer ${expected}`);
}
