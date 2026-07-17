import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export type ParsedTrial = {
  vendorName: string;
  trialEndDate: string | null;
  billingAmount: number | null;
  cancelUrl: string | null;
  confidence: number;
};

const TOOL_DEFINITION: Anthropic.Tool = {
  name: "extract_trial_info",
  description:
    "Extract subscription trial information from an email. Only call this if the email is about a free trial or subscription.",
  input_schema: {
    type: "object" as const,
    properties: {
      vendor_name: {
        type: "string",
        description: "Name of the service/company offering the trial",
      },
      trial_end_date: {
        type: "string",
        description:
          "ISO 8601 date when the trial ends (e.g. 2025-06-15). null if not found.",
      },
      billing_amount: {
        type: "number",
        description:
          "Monthly billing amount in USD after trial ends. null if not found.",
      },
      cancel_url: {
        type: "string",
        description: "URL to cancel the subscription. null if not found.",
      },
      confidence: {
        type: "number",
        description:
          "Confidence score 0-1 that this email is about a subscription trial",
      },
    },
    required: ["vendor_name", "confidence"],
  },
};

export async function parseEmail(
  subject: string,
  from: string,
  body: string
): Promise<ParsedTrial | null> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    tools: [TOOL_DEFINITION],
    tool_choice: { type: "auto" },
    messages: [
      {
        role: "user",
        content: `Analyze this email and extract subscription trial information if present. If this is NOT about a free trial or subscription, do not use the tool.

Subject: ${subject}
From: ${from}
Body:
${body}`,
      },
    ],
  });

  for (const block of response.content) {
    if (block.type === "tool_use" && block.name === "extract_trial_info") {
      const input = block.input as Record<string, unknown>;
      return {
        vendorName: input.vendor_name as string,
        trialEndDate: (input.trial_end_date as string) ?? null,
        billingAmount: (input.billing_amount as number) ?? null,
        cancelUrl: (input.cancel_url as string) ?? null,
        confidence: input.confidence as number,
      };
    }
  }

  return null;
}
