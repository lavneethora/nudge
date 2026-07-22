import { handleList } from "./commands/list";
import { handleCancel } from "./commands/cancel";
import { handleAdd } from "./commands/add";
import { handleSnooze } from "./commands/snooze";
import { handleHelp } from "./commands/help";
import { handleStop } from "./commands/stop";
import {
  setOnboardingState,
  setAwaitingDateForSub,
  getSubscriptionById,
  updateSubscriptionTrialEnd,
  deleteSubscription,
} from "@/lib/db/queries";
import { parseUserDate } from "@/lib/dates/parse-user-date";
import { parseAddRequest } from "@/lib/llm/parse-add";
import { db } from "@/lib/db/client";
import { subscriptions } from "@/lib/db/schema";

export type OnboardingState = "awaiting_connect" | null;

export type CommandContext = {
  userId: string;
  phoneNumber: string;
  body: string;
  oauthConnected: boolean;
  onboardingState: OnboardingState;
  awaitingDateForSubId: string | null;
};

type CommandRoute = {
  pattern: RegExp;
  handler: (ctx: CommandContext, match: RegExpMatchArray) => Promise<string>;
};

const routes: CommandRoute[] = [
  { pattern: /^(help|\?)$/i, handler: (ctx) => handleHelp(ctx) },
  { pattern: /^(list|show|trials|what)/i, handler: (ctx) => handleList(ctx) },
  { pattern: /^cancel\s+(.+)/i, handler: (ctx, m) => handleCancel(ctx, m[1]) },
  { pattern: /^add\s+(.+?)\s+([\w]+\s+\d{1,2}(?:,?\s+\d{4})?)$/i, handler: (ctx, m) => handleAdd(ctx, m[1], m[2]) },
  { pattern: /^snooze\s+(.+)/i, handler: (ctx, m) => handleSnooze(ctx, m[1]) },
];

// affirmative replies to "wanna connect your gmail?" — kept loose on purpose
const YES = /^(y|ya|yea|yes|yeah|yep|yup|sure|ok|okay|please|do it|dope|yesss+|👍|✅)$/i;

function connectLink(phoneNumber: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${appUrl}/auth/gmail?phone=${encodeURIComponent(phoneNumber)}`;
}

// The intro Nudge sends as its FIRST message — this reply carries the 10DLC
// opt-in disclosures (brand + frequency + fees + HELP + STOP) that the MNO
// review requires on the confirmation message. Lowercase Nudge voice; the
// STOP/HELP keywords stay cased so users can spot them at a glance.
function intro() {
  return (
    "hey! im nudge — i watch your inbox and text you before free trials charge your card. " +
    "msg frequency varies, msg & data rates may apply. text HELP for help or STOP to opt out.\n\n" +
    "wanna connect your gmail so i can start scanning?"
  );
}

export async function routeMessage(ctx: CommandContext): Promise<string> {
  const trimmed = ctx.body.trim();

  // STOP/START must always work — even mid-onboarding — so an opt-out actually
  // pauses the record instead of just replying (this is the compliance guarantee).
  if (/^(stop|pause|quit|unsubscribe|cancel|end)$/i.test(trimmed)) {
    return handleStop(ctx, "pause");
  }
  if (/^(start|resume|go|unstop)$/i.test(trimmed)) {
    return handleStop(ctx, "resume");
  }

  // --- Poke-style conversational onboarding (pre-OAuth) ---
  // The user pre-fill sms link seeds "so, what is nudge anyway??". Their
  // first text triggers the intro (any content — state, not text, decides).
  if (!ctx.oauthConnected) {
    // Explicit HELP anytime returns the campaign HELP reply.
    if (/^(help|\?)$/i.test(trimmed)) {
      return handleHelp(ctx);
    }

    if (ctx.onboardingState === "awaiting_connect") {
      await setOnboardingState(ctx.userId, null);
      if (YES.test(trimmed)) {
        return (
          "got it! one sec — here's your gmail connect link:\n" +
          connectLink(ctx.phoneNumber) +
          "\n\noh, and save me in your contacts as \"nudge\" so my texts don't get lost 💾"
        );
      }
      return "no worries, lmk when you're ready. text HELP anytime.";
    }

    // First inbound from an un-onboarded user: send the intro + connect ask.
    await setOnboardingState(ctx.userId, "awaiting_connect");
    return intro();
  }

  // --- OAuth-connected: check normal commands FIRST so a mid-conversation
  // "list" or "cancel netflix" still works even while we're waiting for a
  // date reply — commands beat state.
  for (const route of routes) {
    const match = trimmed.match(route.pattern);
    if (match) {
      return route.handler(ctx, match);
    }
  }

  // --- Awaiting a date reply for a specific subscription -----------------
  // Nudge previously asked "when does the [Vendor] trial end?" and stored
  // the sub's id on the user. Any non-command text now gets parsed as a
  // date response for that sub.
  if (ctx.awaitingDateForSubId) {
    const subId = ctx.awaitingDateForSubId;
    const sub = await getSubscriptionById(subId);
    if (!sub) {
      // sub was deleted meanwhile — clear the state and fall through
      await setAwaitingDateForSub(ctx.userId, null);
    } else {
      const parsed = parseUserDate(trimmed);
      if (parsed.kind === "date") {
        await updateSubscriptionTrialEnd(subId, parsed.date);
        await setAwaitingDateForSub(ctx.userId, null);
        const pretty = new Date(parsed.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        return `perfect — locked in. i'll ping you before your ${sub.vendorName} trial ends ${pretty} 👌`;
      }
      if (parsed.kind === "cancel") {
        await deleteSubscription(subId);
        await setAwaitingDateForSub(ctx.userId, null);
        return `no worries — dropped ${sub.vendorName} from your list.`;
      }
      if (parsed.kind === "unknown") {
        // keep the sub, keep the state cleared — user can text `add [name] [date]` later
        await setAwaitingDateForSub(ctx.userId, null);
        return `all good — i'll keep ${sub.vendorName} on your list without a reminder date. text me "add ${sub.vendorName} [date]" whenever you find out (like "add ${sub.vendorName} aug 15").`;
      }
      // unparseable — keep state, nudge them for a clearer format
      return `hm, couldn't parse that. try something like "aug 15", "8/15", "in 14 days", or "not a trial" if it isn't one.`;
    }
  }

  // --- Natural-language add: "youtube tv trial ends on 23rd july" ----------
  // Fall back to Claude Haiku to see if this is someone trying to add a trial
  // in freeform language. If yes, insert it just like `add x y` would have.
  const parsed = await parseAddRequest(trimmed);
  if (parsed) {
    await db.insert(subscriptions).values({
      userId: ctx.userId,
      vendorName: parsed.vendorName,
      trialEndDate: parsed.trialEndDate,
      source: "manual_add",
      status: "active",
    });
    const pretty = new Date(parsed.trialEndDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return `got it! i'll ping you before your ${parsed.vendorName} trial ends ${pretty} 👌`;
  }

  return 'didnt catch that. text "help" to see what i can do.';
}
