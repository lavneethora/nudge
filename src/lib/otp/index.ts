import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db/client";
import { otpCodes } from "@/lib/db/schema";
import { eq, and, gt, lt, isNull, desc } from "drizzle-orm";

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const MAX_SENDS_PER_WINDOW = 3;
const SEND_WINDOW_MINUTES = 15;
// Per-phone limits alone don't stop SMS pumping — an attacker just iterates
// phone numbers, and every send costs real money. Cap each source IP too.
const MAX_SENDS_PER_IP = 10;
const IP_WINDOW_MINUTES = 60;

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function safeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "hex");
  const bBuf = Buffer.from(b, "hex");
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function minutesFromNow(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export type SendResult =
  | { ok: true; expiresAt: string }
  | { ok: false; error: "rate_limited"; retryAfterSeconds: number }
  | { ok: false; error: "send_failed" };

export async function createAndSendOtp(
  phoneNumber: string,
  sendFn: (phone: string, code: string) => Promise<void>,
  requestIp?: string | null,
): Promise<SendResult> {
  await cleanupExpiredOtps();

  if (requestIp) {
    const ipWindowStart = minutesAgo(IP_WINDOW_MINUTES);
    const recentFromIp = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.requestIp, requestIp),
          gt(otpCodes.createdAt, ipWindowStart),
        ),
      );

    if (recentFromIp.length >= MAX_SENDS_PER_IP) {
      return {
        ok: false,
        error: "rate_limited",
        retryAfterSeconds: IP_WINDOW_MINUTES * 60,
      };
    }
  }

  const windowStart = minutesAgo(SEND_WINDOW_MINUTES);
  const recentCodes = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.phoneNumber, phoneNumber),
        gt(otpCodes.createdAt, windowStart),
      ),
    );

  if (recentCodes.length >= MAX_SENDS_PER_WINDOW) {
    const oldest = recentCodes.reduce((a, b) =>
      (a.createdAt ?? "") < (b.createdAt ?? "") ? a : b,
    );
    const oldestTime = new Date(oldest.createdAt ?? Date.now()).getTime();
    const retryAfter = Math.ceil(
      (oldestTime + SEND_WINDOW_MINUTES * 60_000 - Date.now()) / 1000,
    );
    return {
      ok: false,
      error: "rate_limited",
      retryAfterSeconds: Math.max(retryAfter, 1),
    };
  }

  const code = randomInt(100_000, 1_000_000).toString();
  const expiresAt = minutesFromNow(OTP_EXPIRY_MINUTES);

  await db.insert(otpCodes).values({
    phoneNumber,
    codeHash: hashCode(code),
    maxAttempts: MAX_ATTEMPTS,
    expiresAt,
    requestIp: requestIp ?? null,
  });

  try {
    await sendFn(phoneNumber, code);
  } catch {
    return { ok: false, error: "send_failed" };
  }

  return { ok: true, expiresAt };
}

export type VerifyResult =
  | { ok: true }
  | {
      ok: false;
      error: "expired" | "max_attempts" | "invalid" | "not_found";
      attemptsRemaining?: number;
    };

export async function verifyOtp(
  phoneNumber: string,
  code: string,
): Promise<VerifyResult> {
  const now = new Date().toISOString();

  const rows = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.phoneNumber, phoneNumber),
        isNull(otpCodes.verifiedAt),
      ),
    )
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);

  const row = rows[0];
  if (!row) return { ok: false, error: "not_found" };

  if (row.expiresAt < now) {
    return { ok: false, error: "expired" };
  }

  if (row.attempts >= row.maxAttempts) {
    return { ok: false, error: "max_attempts" };
  }

  const newAttempts = row.attempts + 1;
  await db
    .update(otpCodes)
    .set({ attempts: newAttempts })
    .where(eq(otpCodes.id, row.id));

  if (!safeCompare(hashCode(code), row.codeHash)) {
    return {
      ok: false,
      error: "invalid",
      attemptsRemaining: row.maxAttempts - newAttempts,
    };
  }

  await db
    .update(otpCodes)
    .set({ verifiedAt: now })
    .where(eq(otpCodes.id, row.id));

  return { ok: true };
}

export async function cleanupExpiredOtps(): Promise<void> {
  const oneHourAgo = minutesAgo(60);
  await db.delete(otpCodes).where(lt(otpCodes.expiresAt, oneHourAgo));
}
