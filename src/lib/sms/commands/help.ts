import type { CommandContext } from "../router";

export async function handleHelp(_ctx: CommandContext): Promise<string> {
  return [
    "Nudge: Trial reminder service. Support: 31lavneet@gmail.com or nudge-xi-nine.vercel.app. Msg&data rates may apply. Reply STOP to opt out.",
    "",
    "Commands:",
    '"list" - See active trials',
    '"cancel [service]" - Get cancel link',
    '"add [service] [date]" - Track a trial',
    '"snooze [service]" - Delay 24hrs',
    '"stop" - Unsubscribe',
  ].join("\n");
}
