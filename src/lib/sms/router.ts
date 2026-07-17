import { handleList } from "./commands/list";
import { handleCancel } from "./commands/cancel";
import { handleAdd } from "./commands/add";
import { handleSnooze } from "./commands/snooze";
import { handleHelp } from "./commands/help";
import { handleStop } from "./commands/stop";

export type CommandContext = {
  userId: string;
  phoneNumber: string;
  body: string;
  oauthConnected: boolean;
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

export async function routeMessage(ctx: CommandContext): Promise<string> {
  const trimmed = ctx.body.trim();

  // STOP/START must always work — even for users who haven't finished OAuth —
  // so an opt-out actually pauses their record instead of just replying.
  if (/^(stop|pause|quit|unsubscribe|cancel|end)$/i.test(trimmed)) {
    return handleStop(ctx, "pause");
  }
  if (/^(start|resume|go|unstop)$/i.test(trimmed)) {
    return handleStop(ctx, "resume");
  }

  if (!ctx.oauthConnected) {
    return getOnboardingResponse(trimmed, ctx);
  }

  for (const route of routes) {
    const match = trimmed.match(route.pattern);
    if (match) {
      return route.handler(ctx, match);
    }
  }

  return `I didn't understand that. Text "help" to see what I can do.`;
}

function getOnboardingResponse(body: string, ctx: CommandContext): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (/^(help|\?)$/i.test(body)) {
    return `Nudge: Trial reminder service. Support: 31lavneet@gmail.com or nudge-xi-nine.vercel.app. Msg&data rates may apply. Reply STOP to opt out.\n\nTo get started, connect your Gmail:\n${appUrl}/auth/gmail?phone=${encodeURIComponent(ctx.phoneNumber)}`;
  }

  return `Nudge: You're signed up for trial reminders. Msg frequency varies. Msg&data rates may apply. Reply HELP for help, STOP to opt out.\n\nTo get started, connect your Gmail (read-only):\n${appUrl}/auth/gmail?phone=${encodeURIComponent(ctx.phoneNumber)}`;
}
