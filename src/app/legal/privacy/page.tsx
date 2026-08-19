import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/legal/privacy" },
  title: "Privacy Policy — Nudge",
  description:
    "How Nudge collects, uses, and protects your information — including SMS opt-in data and mobile information handling.",
};

const LAST_UPDATED = "August 17, 2026";
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
                of your emails. We do send the text of matching emails to an AI
                provider for analysis — see section 3.
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
              <li>
                Detect subscription trials from your Gmail inbox, using
                automated analysis described in section 3.
              </li>
              <li>
                Respond to your SMS commands (list, cancel, add, snooze, stop,
                start, help, disconnect, delete).
              </li>
              <li>Improve reliability and prevent abuse.</li>
            </ul>
          </Section>

          <Section title="3. Automated Processing and AI">
            <p>
              Nudge uses artificial intelligence to read and interpret text on
              your behalf. Specifically, we send the following to{" "}
              <span className="font-medium">Anthropic PBC</span>, which operates
              the Claude AI models we use:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-3">
              <li>
                <span className="font-medium">Email content</span> — when our
                scanner finds an email in your inbox that matches subscription,
                trial, billing, or renewal terms, we send an excerpt of that
                email (currently up to the first 3,000 characters, which may
                include the sender, subject, and body) to Claude so it can
                extract the service name, trial end date, and price.
              </li>
              <li>
                <span className="font-medium">Your text messages</span> — when
                you text us something that isn&apos;t a recognized command, we
                send that message to Claude to work out whether you&apos;re
                trying to add a trial in plain English.
              </li>
              <li>
                <span className="font-medium">Service names</span> — when you
                ask how to cancel something we don&apos;t have on file, we send
                the service name to Claude to look up a cancellation method.
              </li>
            </ul>
            <p className="mt-3">
              Anthropic processes this data to return a result to us and does
              not use it to train their models. We do not use AI to make any
              decision that has a legal or similarly significant effect on you.
              Automated output can be wrong — always confirm a trial date or
              cancellation link with the service itself before relying on it.
            </p>
            <p className="mt-3">
              If you would rather no email content be processed this way, text{" "}
              <span className="font-medium">DISCONNECT</span> to stop Gmail
              scanning, or don&apos;t connect Gmail at all — you can still track
              trials by texting them to us manually.
            </p>
          </Section>

          <Section title="4. Google User Data and Limited Use">
            <p>
              Nudge&apos;s use and transfer of information received from Google
              APIs to any other app will adhere to the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-ink"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
            <p className="mt-3">
              We request a single scope,{" "}
              <span className="font-medium">gmail.readonly</span>, which allows
              us to read your mail but never to send, delete, or modify
              anything. We use it only to detect subscription trials and tell
              you about them. We restrict our scan to messages from the last
              seven days that match subscription-related search terms, and we
              store only the extracted trial details — never the message body.
            </p>
            <p className="mt-3">
              We do not transfer Google user data to third parties except as
              needed to provide the Service (the AI processing described in
              section 3, and our hosting providers), for security purposes, or
              to comply with applicable law. We do not sell Google user data,
              and we do not use it for advertising or to train any AI model.
            </p>
            <p className="mt-3">
              You can revoke our access at any time by texting{" "}
              <span className="font-medium">DISCONNECT</span> to your Nudge
              number, which revokes the token with Google and deletes our copy.
              You can also revoke it directly at{" "}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-ink"
              >
                myaccount.google.com/permissions
              </a>
              .
            </p>
          </Section>

          <Section title="5. SMS and Mobile Information — No Sharing or Sale">
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

          <Section title="6. Service Providers">
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
                <span className="font-medium">AI processing</span> — Anthropic
                PBC, whose Claude models analyze email excerpts, your inbound
                text messages, and service names, as detailed in section 3.
              </li>
            </ul>
            <p className="mt-3">
              We share only the minimum data each provider needs to do its job,
              and we do not authorize any of them to use your information for
              their own marketing purposes. Anthropic&apos;s commercial terms
              expressly prohibit training their models on data we submit,
              including the email excerpts described in section 3. Our other
              providers process your data under their own standard terms of
              service and privacy commitments rather than a separately
              negotiated agreement with us. As Nudge grows we intend to put
              formal data processing agreements in place with each of them.
            </p>
          </Section>

          <Section title="7. Message Frequency, Rates, and Opt-Out">
            <p>
              Message frequency varies based on your trials and settings.
              Standard message and data rates may apply from your mobile
              carrier. You can opt out at any time by replying{" "}
              <span className="font-medium">STOP</span> to any message from us;
              reply <span className="font-medium">HELP</span> for help. Mobile
              carriers are not liable for delayed or undelivered messages.
            </p>
          </Section>

          <Section title="8. Data Retention and Deletion">
            <p>
              We retain your data while your account is active. You are in
              control of removing it, and every option below takes effect
              immediately — you do not need to email us or wait:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-3">
              <li>
                <span className="font-medium">STOP</span> — pauses all
                messages and stops any inbox scanning. Your account and saved
                trials are kept so you can resume with START.
              </li>
              <li>
                <span className="font-medium">DISCONNECT</span> — revokes our
                Gmail access with Google and deletes the stored access tokens.
                We can no longer see your inbox.
              </li>
              <li>
                <span className="font-medium">DELETE</span> — revokes Gmail
                access and permanently erases your account, phone number,
                saved trials, and message history. This cannot be undone.
              </li>
            </ul>
            <p className="mt-3">
              If you stop using the Service without deleting your account, we
              retain your data for up to twenty-four (24) months after your
              last activity and then delete it. Verification codes are deleted
              within one hour. If you prefer, you can also email us at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="underline hover:text-ink"
              >
                {CONTACT_EMAIL}
              </a>{" "}
              and we will delete your data within thirty (30) days, except
              where retention is required by law.
            </p>
          </Section>

          <Section title="9. Security">
            <p>
              We use industry-standard practices to protect your information,
              including encryption of OAuth tokens at rest (AES-256-GCM) and
              HTTPS for all data in transit. No system is perfectly secure, and
              we cannot guarantee absolute security.
            </p>
          </Section>

          <Section title="10. Your Rights">
            <p>
              Depending on where you live, you may have rights to access,
              correct, or delete your personal information, and to opt out of
              certain processing. The self-serve commands in section 8 exercise
              the deletion right immediately; for anything else, contact us
              using the details below and we will respond within 30 days. We
              will not discriminate against you for exercising these rights.
            </p>
            <p className="mt-3">
              <span className="font-medium">California residents (CCPA/CPRA).</span>{" "}
              In the past 12 months we have collected the categories of personal
              information listed in section 1: identifiers (phone number),
              electronic network activity and message content, and commercial
              information (your subscription and trial details). We collect it
              for the purposes in section 2 and share it only with the service
              providers in section 6.{" "}
              <span className="font-medium">
                We do not sell your personal information, and we do not share it
                for cross-context behavioral advertising.
              </span>{" "}
              You have the right to know, delete, correct, and to limit use of
              sensitive personal information.
            </p>
            <p className="mt-3">
              <span className="font-medium">EU/UK residents (GDPR).</span> Our
              lawful basis for processing is your consent (which you may
              withdraw at any time via STOP, DISCONNECT, or DELETE) and our
              legitimate interest in operating and securing the Service. You
              additionally have rights of access, rectification, erasure,
              restriction, portability, and objection, and the right to lodge a
              complaint with your local supervisory authority. Nudge is operated
              from the United States, so your data is processed there and by the
              providers listed in section 6.
            </p>
          </Section>

          <Section title="11. Children">
            <p>
              Nudge is not directed to children under 13 (or the equivalent
              minimum age in your jurisdiction). We do not knowingly collect
              personal information from children.
            </p>
          </Section>

          <Section title="12. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. Material
              changes will be reflected by an updated &quot;Last updated&quot; date at
              the top of this page.
            </p>
          </Section>

          <Section title="13. Contact">
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
