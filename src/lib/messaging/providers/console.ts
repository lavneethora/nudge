import type { MessagingProvider } from "../types";

export const consoleProvider: MessagingProvider = {
  name: "console",
  async send(to, body) {
    const lines = body.split("\n");
    const width = Math.min(
      Math.max(...lines.map((l) => l.length), `SMS → ${to}`.length) + 2,
      70
    );
    console.log(`┌─ SMS → ${to} ${"─".repeat(Math.max(width - to.length - 8, 0))}`);
    for (const line of lines) {
      console.log(`│ ${line}`);
    }
    console.log(`└${"─".repeat(width + 1)}`);
    return { providerMessageId: `console-${crypto.randomUUID()}` };
  },
};
