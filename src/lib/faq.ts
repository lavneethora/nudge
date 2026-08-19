/** Single source for the FAQ.
 *
 * The visible accordion and the FAQPage JSON-LD both read from here. Google
 * penalises structured data that doesn't match what a visitor actually sees,
 * so these must never be maintained in two places. */
export const FAQ_ITEMS = [
  {
    q: "is nudge free?",
    a: "yep — nudge is completely free during beta. no credit card, no catch.",
  },
  {
    q: "what can nudge see in my gmail?",
    a: "read-only access. nudge only scans for trial and subscription emails — it never reads your personal messages, and it can't send, delete, or modify anything.",
  },
  {
    q: "can nudge cancel trials for me?",
    a: "right now nudge just reminds you before you get charged — cancelling is still on you. we're working on making that easier though, so stay tuned.",
  },
  {
    q: "can i add trials manually?",
    a: 'absolutely. text something like "hulu trial ends aug 15" — no rigid format needed, just plain english.',
  },
  {
    q: "how do i stop getting texts?",
    a: "text STOP anytime and nudge goes quiet immediately. text START to resume.",
  },
] as const;
