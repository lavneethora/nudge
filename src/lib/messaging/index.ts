import { db } from "@/lib/db/client";
import { messages } from "@/lib/db/schema";
import type { MessagingProvider } from "./types";
import { consoleProvider } from "./providers/console";
import { telnyxProvider } from "./providers/telnyx";

export function getProvider(): MessagingProvider {
  // Defaults to console so a missing env var can never hit the paid provider
  return process.env.MESSAGING_PROVIDER === "telnyx"
    ? telnyxProvider
    : consoleProvider;
}

export async function sendSMSToUser(userId: string, to: string, body: string) {
  const { providerMessageId } = await getProvider().send(to, body);

  await db.insert(messages).values({
    userId,
    direction: "outbound",
    body,
    providerMessageId,
  });

  return { providerMessageId };
}
