import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export type FoundCancelLink = {
  cancelLink: string;
  method: string;
};

const TOOL_DEFINITION: Anthropic.Tool = {
  name: "report_cancel_link",
  description: [
    "Call this tool ONLY if you recognize the named company as a real,",
    "identifiable service AND you are reasonably confident about how a",
    "customer actually cancels their subscription with them today.",
    "Do NOT call this tool, and do NOT guess, if the name is unfamiliar,",
    "ambiguous, misspelled beyond recognition, or you aren't confident the",
    "cancellation method you'd report is currently accurate. It's better to",
    "not call the tool than to report a wrong or made-up URL.",
  ].join(" "),
  input_schema: {
    type: "object" as const,
    properties: {
      cancel_link: {
        type: "string",
        description:
          "Either the URL of the account/subscription page where the user can cancel (no protocol needed, e.g. 'example.com/account'), or a short plain-text instruction if there's no direct URL (e.g. 'cancel via the App Store: Settings > [name] > Subscriptions').",
      },
      method: {
        type: "string",
        description:
          "One short word/phrase describing the channel: 'web', 'app_store', 'play_store', 'call_or_chat', or 'mixed'.",
      },
    },
    required: ["cancel_link", "method"],
  },
};

/** Fallback lookup for a vendor not in the static/cached vendor_cancel_info
 * table. Returns null if the model isn't confident enough to call the tool. */
export async function findCancelLink(
  vendorName: string
): Promise<FoundCancelLink | null> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    tools: [TOOL_DEFINITION],
    tool_choice: { type: "auto" },
    messages: [
      {
        role: "user",
        content: `A user wants to cancel their "${vendorName}" trial/subscription. If you recognize this as a real company and know how customers cancel it, call report_cancel_link. Otherwise, don't call the tool.`,
      },
    ],
  });

  for (const block of response.content) {
    if (block.type === "tool_use" && block.name === "report_cancel_link") {
      const input = block.input as Record<string, unknown>;
      const cancelLink = String(input.cancel_link ?? "").trim();
      const method = String(input.method ?? "").trim();
      if (!cancelLink) return null;
      return { cancelLink, method };
    }
  }

  return null;
}
