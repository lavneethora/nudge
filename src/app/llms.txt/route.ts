import { SITE_URL, PUBLIC_PAGES } from "@/lib/site";

// Served as a route rather than a static public/ file so the absolute URLs
// track NEXT_PUBLIC_APP_URL — a domain change shouldn't leave this stale.
//
// Kept strictly factual: an AI summarising Nudge from this file should not
// end up telling someone it cancels subscriptions for them, or that it works
// outside the US. Claims here must match what the product actually does.
export const dynamic = "force-static";

function body() {
  const links = PUBLIC_PAGES.map(
    (p) => `- [${p.title}](${SITE_URL}${p.path}): ${p.blurb}`
  ).join("\n");

  return `# Nudge

Nudge is a free SMS service that reminds people before a free trial converts to a paid subscription. A user signs up with a US mobile number, verifies it with a one-time code, and optionally connects Gmail with read-only access. Nudge scans recent email for trial and subscription confirmations, extracts the service name, end date, and price, and sends a text message five days, two days, and on the day the trial ends. Trials can also be added by texting the service name and date.

Nudge sends reminders. It does not cancel subscriptions on a user's behalf. Where a cancellation link or method is known, it is included in the reminder, but completing the cancellation is up to the user.

## Status

- Free, and in beta.
- US mobile numbers only.
- Interaction happens over SMS. There is no app and no dashboard.

## SMS commands

- \`list\` - show active trials
- \`cancel [service]\` - get the cancellation link for a trial
- \`add [service] [date]\` - track a trial manually
- \`snooze [service]\` - delay reminders by 24 hours
- \`help\` - show available commands
- \`stop\` - unsubscribe from all messages
- \`disconnect\` - revoke Gmail access and delete stored tokens
- \`delete\` - permanently erase the account and all associated data

## Data handling

- Gmail access uses the read-only scope. Nudge cannot send, delete, or modify mail.
- Email bodies are not stored. Matching messages are sent to Anthropic's Claude to extract trial details, and only the extracted fields are kept.
- Inbound text messages are also processed by Claude when they do not match a known command.
- Users can revoke Gmail access or delete all of their data at any time by text.

## Pages

${links}

## Contact

- Email: help@nudgeme.app
`;
}

export function GET() {
  return new Response(body(), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
