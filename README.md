# Nudge

**Never get charged for a trial you forgot.**

Nudge is a text-message assistant that watches your inbox and reminds you before free trials convert to paid charges. No app to download — everything happens over SMS.

🌐 **[nudge-xi-nine.vercel.app](https://nudge-xi-nine.vercel.app)**

## The problem

Free trials are designed to be forgotten. You sign up, the two weeks fly by, and the $15.99 hits your card before you ever opened the app again. Subscription companies count on it.

## What Nudge does

1. **Sign up with just your phone number** — no account, no password, no app.
2. **Connect Gmail (read-only)** — Nudge scans for trial signups and subscription receipts, pulling out the service, trial end date, and billing amount.
3. **Get texted before you get charged** — 5 days out, 2 days out, and a final warning the day a trial converts, with the amount at stake and a cancel link when Nudge has one.
4. **Run everything from your texts:**

   | You text… | Nudge does… |
   |---|---|
   | `list` | shows your active trials |
   | `cancel netflix` | sends the cancellation link |
   | `add hulu jul 30` | tracks a trial manually |
   | `snooze spotify` | delays reminders 24h |
   | `STOP` / `START` | opt out / back in anytime |

## Under the hood

- **Next.js 16** on Vercel, **SQLite/Turso** with Drizzle ORM
- **Telnyx** SMS on a registered 10DLC campaign, with an Ed25519-verified inbound webhook and idempotent message handling
- **Gmail API** (read-only OAuth) + **Claude** for parsing trial emails
- Provider abstraction (`console | telnyx`) so development can never fire a real text
- Landing page: GSAP scroll hero → the signup form registered with the campaign

---

Built by [Lavneet Hora](https://github.com/lavneethora).
