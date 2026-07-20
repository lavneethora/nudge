import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { users, subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthenticatedClient } from "@/lib/gmail/oauth";
import { scanEmails } from "@/lib/gmail/scanner";
import { parseEmail } from "@/lib/llm/parse-email";
import { sendSMSToUser } from "@/lib/messaging";
import { isCronAuthorized } from "@/lib/cron-auth";
import { setAwaitingDateForSub } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  const targetUserId = request.nextUrl.searchParams.get("userId");

  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let userList;
  if (targetUserId) {
    userList = await db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);
  } else {
    userList = await db
      .select()
      .from(users)
      .where(eq(users.oauthConnected, true));
  }

  let totalFound = 0;

  for (const user of userList) {
    if (!user.oauthConnected || user.status !== "active") continue;

    try {
      const auth = await getAuthenticatedClient(user);

      const existingSubs = await db
        .select({ emailMessageId: subscriptions.emailMessageId })
        .from(subscriptions)
        .where(eq(subscriptions.userId, user.id));

      const existingIds = new Set(
        existingSubs
          .map((s) => s.emailMessageId)
          .filter((id): id is string => id !== null)
      );

      const emails = await scanEmails(auth, existingIds);
      const newTrials: Array<{
        vendorName: string;
        trialEndDate: string | null;
        billingAmount: number | null;
        cancelUrl: string | null;
        emailMessageId: string;
      }> = [];

      for (const email of emails) {
        const parsed = await parseEmail(email.subject, email.from, email.body);
        if (!parsed || parsed.confidence < 0.7) continue;
        // Sanity check: reject trial end dates in the past or over a year out —
        // catches LLM hallucinations like "2025-01-17" on a July 2026 email.
        if (parsed.trialEndDate) {
          const end = new Date(parsed.trialEndDate);
          const now = new Date();
          const yearOut = new Date();
          yearOut.setFullYear(now.getFullYear() + 1);
          if (isNaN(end.getTime()) || end < now || end > yearOut) {
            console.warn(
              `Rejected LLM-parsed trial for ${parsed.vendorName}: implausible end date ${parsed.trialEndDate}`
            );
            continue;
          }
        }
        newTrials.push({
          vendorName: parsed.vendorName,
          trialEndDate: parsed.trialEndDate,
          billingAmount: parsed.billingAmount,
          cancelUrl: parsed.cancelUrl,
          emailMessageId: email.messageId,
        });
      }

      if (newTrials.length > 0) {
        // Insert each and remember the DB rows so we can ask about date-less ones
        const insertedRows: Array<{
          id: string;
          vendorName: string;
          trialEndDate: string | null;
        }> = [];
        for (const trial of newTrials) {
          const [row] = await db
            .insert(subscriptions)
            .values({
              userId: user.id,
              vendorName: trial.vendorName,
              trialEndDate: trial.trialEndDate,
              billingAmount: trial.billingAmount,
              cancelUrl: trial.cancelUrl,
              source: "email_detected",
              status: "active",
              emailMessageId: trial.emailMessageId,
            })
            .returning({
              id: subscriptions.id,
              vendorName: subscriptions.vendorName,
              trialEndDate: subscriptions.trialEndDate,
            });
          insertedRows.push(row);
        }

        const withDate = insertedRows.filter((r) => r.trialEndDate);
        const withoutDate = insertedRows.filter((r) => !r.trialEndDate);

        // Announce the ones we know the date for
        if (withDate.length > 0) {
          const lines = withDate.map((r) => {
            const trial = newTrials.find((t) => t.vendorName === r.vendorName)!;
            const amount = trial.billingAmount ? ` ($${trial.billingAmount}/mo)` : "";
            const date = ` — ends ${new Date(r.trialEndDate!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
            return `• ${r.vendorName}${date}${amount}`;
          });
          const msg =
            withDate.length === 1
              ? `📧 found a new trial:\n${lines[0]}\n\ni'll ping you before it charges.`
              : `📧 found ${withDate.length} trials:\n\n${lines.join("\n")}\n\ni'll ping you before each one charges.`;
          await sendSMSToUser(user.id, user.phoneNumber, msg);
        }

        // For subs we detected but couldn't get an end date from — ask the user.
        // We only ask about the FIRST one; the rest sit in `list` until the user
        // adds a date via `add [name] [date]` (or the follow-up conversation
        // continues for the next scan cycle).
        if (withoutDate.length > 0) {
          const first = withoutDate[0];
          await setAwaitingDateForSub(user.id, first.id);
          const extraNote =
            withoutDate.length > 1
              ? `\n\nps: found ${withoutDate.length - 1} more without dates — text "list" to see them.`
              : "";
          await sendSMSToUser(
            user.id,
            user.phoneNumber,
            `saw you signed up for ${first.vendorName}! is this a free trial? when does it end? (like "aug 15", "in 14 days", or "not a trial" if it isn't one)${extraNote}`
          );
        }

        totalFound += newTrials.length;
      } else if (targetUserId) {
        await sendSMSToUser(
          user.id,
          user.phoneNumber,
          "scanned your recent emails, no active trials yet. i'll keep watching and text you as soon as i spot one!\n\nyou can also add trials manually by texting: add [service] [date]"
        );
      }
    } catch (err) {
      console.error(`Error scanning emails for user ${user.id}:`, err);
    }
  }

  return NextResponse.json({ scanned: userList.length, found: totalFound });
}
