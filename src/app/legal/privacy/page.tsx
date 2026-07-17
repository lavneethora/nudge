import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Nudge",
  description:
    "How Nudge collects, uses, and protects your information — including SMS opt-in data and mobile information handling.",
};

const LAST_UPDATED = "July 8, 2026";
const CONTACT_EMAIL = "31lavneet@gmail.com";

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen px-6 py-16 md:py-24">
      <article className="max-w-2xl mx-auto text-ink">
        <header className="mb-12">
          <Link
            href="/"
            className="text-[12px] tracking-[0.12em] uppercase text-[rgba(27,27,24,0.55)] hover:text-ink transition-colors"
          >
            ← Back to Nudge
          </Link>
          <h1 className="mt-8 text-[clamp(1.5rem,2.4vw,2rem)] font-medium tracking-[0.02em] leading-tight">
            Privacy Policy
          </h1>
          <p className="mt-3 text-[12px] tracking-[0.08em] uppercase text-[rgba(27,27,24,0.55)]">
            Last updated: {LAST_UPDATED}
          </p>
        </header>

        <div className="space-y-8 text-[14.5px] leading-[1.7] text-[rgba(27,27,24,0.85)]">
          <section>
            <p>
              This Privacy Policy explains how Nudge (&quot;we,&quot; &quot;us,&quot; or
              &quot;our&quot;) collects, uses, and safeguards your information when
              you use our SMS-based subscription trial reminder service (the
              &quot;Service&quot;). By using the Service, you agree to the practices
              described here.
            </p>
          </section>

          <Section title="1. Information We Collect">
            <p>We collect the following categories of information:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-3">
              <li>
                <span className="font-medium">Mobile phone number</span> —
                provided by you at signup so we can send SMS reminders.
              </li>
              <li>
                <span className="font-medium">SMS opt-in and consent status</span>
                {" "}— a record that you agreed to receive text messages from us,
                along with the date and time.
              </li>
              <li>
                <span className="font-medium">Gmail account access</span> — if
                you connect Gmail, we request read-only access to scan for
                subscription-related emails. We do not store the full contents
                of your emails.
              </li>
              <li>
                <span className="font-medium">Subscription and trial data</span>
                {" "}— vendor names, trial end dates, billing amounts, and cancel
                links that we detect from your inbox or that you add manually.
              </li>
              <li>
                <span className="font-medium">Message history</span> — the SMS
                messages sent to and received from you through the Service.
              </li>
            </ul>
          </Section>

          <Section title="2. How We Use Your Information">
            <p>We use your information solely to operate the Service:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-3">
              <li>Send you SMS trial reminders and account notifications.</li>
              <li>Detect subscription trials from your Gmail inbox.</li>
              <li>
                Respond to your SMS commands (list, cancel, add, snooze, stop,
                start, help).
              </li>
              <li>Improve reliability and prevent abuse.</li>
            </ul>
          </Section>

          <Section title="3. SMS and Mobile Information — No Sharing or Sale">
            <p className="font-medium">
              Your mobile information will not be sold or shared with third
              parties for promotional or marketing purposes.
            </p>
            <p className="mt-3">
              All the categories described in this Privacy Policy exclude text
              messaging originator opt-in data and consent; this information
              will not be shared with any third parties.
            </p>
            <p className="mt-3">
              We will not share your opt-in to an SMS campaign with any third
              party for purposes unrelated to providing you with the services
              of that campaign.
            </p>
            <p className="mt-3">
              We may share your Personal Data, including your SMS opt-in or
              consent status, with third parties that help us provide our
              messaging services, including but not limited to platform
              providers, phone companies, and any other vendors who assist us
              in the delivery of text messages.
            </p>
          </Section>

          <Section title="4. Service Providers">
            <p>
              We use the following categories of service providers, and share
              only the minimum data required for them to perform their function:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-3">
              <li>
                <span className="font-medium">Messaging platform</span> —
                Telnyx, LLC, which delivers SMS on our behalf.
              </li>
              <li>
                <span className="font-medium">Email access</span> — Google LLC,
                for read-only Gmail scanning under scopes you approve during
                OAuth.
              </li>
              <li>
                <span className="font-medium">Hosting and database</span> —
                Vercel Inc. and Turso Corp., which host the application and
                store your account data.
              </li>
              <li>
                <span className="font-medium">Email parsing</span> — Anthropic
                PBC, whose Claude model helps identify trial information from
                emails you have consented to have scanned.
              </li>
            </ul>
            <p className="mt-3">
              These providers are contractually restricted to processing your
              information only to deliver services back to Nudge, and we do not
              authorize them to use your mobile information for their own
              marketing purposes.
            </p>
          </Section>

          <Section title="5. Message Frequency, Rates, and Opt-Out">
            <p>
              Message frequency varies based on your trials and settings.
              Standard message and data rates may apply from your mobile
              carrier. You can opt out at any time by replying{" "}
              <span className="font-medium">STOP</span> to any message from us;
              reply <span className="font-medium">HELP</span> for help. Mobile
              carriers are not liable for delayed or undelivered messages.
            </p>
          </Section>

          <Section title="6. Data Retention and Deletion">
            <p>
              We retain your data while your account is active. You may request
              deletion at any time by texting{" "}
              <span className="font-medium">STOP</span> and emailing us to
              request full account removal. We will delete your personal data
              within thirty (30) days of your request, except where retention
              is required by law.
            </p>
          </Section>

          <Section title="7. Security">
            <p>
              We use industry-standard practices to protect your information,
              including encryption of OAuth tokens at rest (AES-256-GCM) and
              HTTPS for all data in transit. No system is perfectly secure, and
              we cannot guarantee absolute security.
            </p>
          </Section>

          <Section title="8. Your Rights">
            <p>
              Depending on where you live, you may have rights to access,
              correct, or delete your personal information, and to opt out of
              certain processing. To exercise these rights, contact us using
              the details below.
            </p>
          </Section>

          <Section title="9. Children">
            <p>
              Nudge is not directed to children under 13 (or the equivalent
              minimum age in your jurisdiction). We do not knowingly collect
              personal information from children.
            </p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. Material
              changes will be reflected by an updated &quot;Last updated&quot; date at
              the top of this page.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              For questions about this Privacy Policy or to exercise your
              rights, contact us at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="underline hover:text-ink"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </Section>
        </div>

        <footer className="mt-16 pt-8 border-t border-[rgba(27,27,24,0.1)]">
          <Link
            href="/"
            className="text-[12px] tracking-[0.12em] uppercase text-[rgba(27,27,24,0.55)] hover:text-ink transition-colors"
          >
            ← Back to Nudge
          </Link>
        </footer>
      </article>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-[15px] font-medium tracking-[0.02em] text-ink mb-3">
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
