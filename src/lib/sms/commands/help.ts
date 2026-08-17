import type { CommandContext } from "../router";

export async function handleHelp(_ctx: CommandContext): Promise<string> {
  // brand + support contact + STOP required by MNO — kept intact
  return [
    "hey! im nudge. i watch your inbox and text you before trials charge you. need help? email 31lavneet@gmail.com. msg & data rates may apply. text STOP to opt out.",
    "",
    "here's what i can do:",
    "list: your active trials",
    "cancel [service]: get the cancel link",
    "add [service] [date]: track a trial manually",
    "snooze [service]: delay reminders 24hrs",
    "stop: unsubscribe",
  ].join("\n");
}
