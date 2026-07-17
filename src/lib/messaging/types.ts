export interface MessagingProvider {
  name: "telnyx" | "console";
  send(to: string, body: string): Promise<{ providerMessageId: string | null }>;
}
