import Telnyx from "telnyx";
import type { MessagingProvider } from "../types";

let client: Telnyx | null = null;

function getClient(): Telnyx {
  if (!process.env.TELNYX_API_KEY) {
    throw new Error(
      "TELNYX_API_KEY is not set. Set it in .env.local or use MESSAGING_PROVIDER=console for local dev."
    );
  }
  if (!client) {
    client = new Telnyx({ apiKey: process.env.TELNYX_API_KEY });
  }
  return client;
}

export const telnyxProvider: MessagingProvider = {
  name: "telnyx",
  async send(to, body) {
    const from = process.env.TELNYX_PHONE_NUMBER;
    if (!from) {
      throw new Error("TELNYX_PHONE_NUMBER is not set.");
    }
    const response = await getClient().messages.send({ from, to, text: body });
    return { providerMessageId: response.data?.id ?? null };
  },
};
