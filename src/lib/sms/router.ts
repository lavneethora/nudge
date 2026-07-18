import { handleList } from "./commands/list";
import { handleCancel } from "./commands/cancel";
import { handleAdd } from "./commands/add";
import { handleSnooze } from "./commands/snooze";
import { handleHelp } from "./commands/help";
import { handleStop } from "./commands/stop";
import { setOnboardingState } from "@/lib/db/queries";

export type OnboardingState = "awaiting_connect" | null;

export type CommandContext = {
  userId: string;
  phoneNumber: string;
  body: string;
  oauthConnected: boolean;
  onboardingState: OnboardingState;
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

  // --- OAuth-connected: normal command routing ---
  for (const route of routes) {
    const match = trimmed.match(route.pattern);
    if (match) {
      return route.handler(ctx, match);
    }
  }

  return 'didnt catch that. text "help" to see what i can do.';
}
