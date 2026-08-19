import Anthropic from "@anthropic-ai/sdk";
import {
  sanitizeCancelLink,
  sanitizeVendorName,
  sanitizeBillingAmount,
} from "./sanitize";

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
  description: [
    "Extract subscription/trial info from an email — but ONLY if the email is a",
    "confirmation that the recipient has ALREADY started or is now enrolled in a",
    "paid subscription or trial.",
    "",
    "Do NOT call this tool for:",
    "  - Marketing offers (\"start your free trial today\", \"try Premium free\")",
    "  - Newsletters, digests, or promotional roundups",
    "  - Emails that pitch a trial the recipient has NOT yet accepted",
    "  - Renewal reminders that are just informational (unless they name the",
    "    exact next charge date and amount)",
    "  - Discount codes, gift subscriptions, or offer emails",
    "",
    "Only call this tool when the email is clearly a receipt / welcome /",
    "activation confirming that the recipient's account is now active and will",
    "be charged in the future.",
  ].join(" "),
  input_schema: {
    type: "object" as const,
    properties: {
      vendor_name: {
        type: "string",
        description:
          "Name of the service/company (e.g. 'Netflix', 'Spotify Premium'). Use the real product name, not the sender domain.",
      },
      trial_end_date: {
        type: "string",
        description:
          "ISO 8601 date when the trial ends or the first charge hits. Must be a future date explicitly stated in the email. null if the email doesn't state a specific date.",
      },
      billing_amount: {
        type: "number",
        description:
          "Monthly billing amount in USD after trial ends. null if not stated.",
      },
      cancel_url: {
        type: "string",
        description:
          "URL to cancel the subscription. Must be a real cancellation/account/manage link — NOT a marketing tracking URL. null if not found.",
      },
      confidence: {
        type: "number",
        description:
          "0-1 confidence that this email is a genuine active-subscription confirmation (not a marketing offer or newsletter).",
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
        content: `Analyze this email. Only call the tool if this is a CONFIRMATION that the recipient has already started an active subscription or trial (not a marketing pitch, newsletter, or offer). If it's promotional / an offer to start a trial / a newsletter, do NOT call the tool.

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
      // The email body this came from was written by whoever emailed the
      // user, so treat every extracted field as hostile until checked. The
      // cancel link especially: it gets texted out as "cancel here: <url>".
      const vendorName = sanitizeVendorName(input.vendor_name);
      if (!vendorName) return null;

      return {
        vendorName,
        trialEndDate: (input.trial_end_date as string) ?? null,
        billingAmount: sanitizeBillingAmount(input.billing_amount),
        cancelUrl: sanitizeCancelLink(input.cancel_url),
        confidence: input.confidence as number,
      };
    }
  }

  return null;
}
