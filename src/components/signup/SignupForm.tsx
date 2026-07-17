"use client";

import { useState } from "react";
import { formatUSPhone } from "@/lib/format";
import DemoVideo from "@/components/landing/DemoVideo";

export default function SignupForm({
  showVideo = false,
}: {
  /** renders the demo-video card between the description and the form —
      local landing only; the deployed campaign page stays unchanged */
  showVideo?: boolean;
}) {
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone, smsConsent: consent }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      const data = await res.json();
      setSent(true);

      setTimeout(() => {
        window.location.href = `sms:${data.smsNumber}`;
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        <div className="text-center mb-12">
          <h1 className="uppercase font-medium text-[30px] tracking-[0.04em] leading-none text-[rgba(27,27,24,0.92)]">
            Nudge
          </h1>
        </div>

        <div className="text-center mb-10 space-y-4">
          <p className="text-[clamp(1.05rem,1.8vw,1.35rem)] leading-snug text-ink">
            Never get charged for a trial you forgot.
          </p>
          <p className="text-[13px] leading-relaxed text-[rgba(27,27,24,0.58)] max-w-sm mx-auto">
            A text-message assistant that watches your inbox and reminds you
            before free trials convert to paid charges. No app to download.
          </p>
        </div>

        {showVideo && <DemoVideo />}

        {sent ? (
          <p className="text-center text-[14px] text-ink">
            Check your texts — opening Messages now.
          </p>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="phone" className="sr-only">
                Mobile phone number
              </label>
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="(555) 123-4567"
                className="w-full px-5 py-4 text-[15px] tracking-[0.02em] border border-[rgba(27,27,24,0.14)] rounded-xl bg-white/40 focus:outline-none focus:border-[rgba(27,27,24,0.4)] focus:bg-white/60 text-center text-ink placeholder:text-[rgba(27,27,24,0.35)] transition-colors"
                value={phone}
                onChange={(e) => setPhone(formatUSPhone(e.target.value))}
                maxLength={14}
              />
            </div>

            <label
              htmlFor="sms-consent"
              className="flex gap-3 text-[12px] leading-[1.55] text-[rgba(27,27,24,0.72)] cursor-pointer"
            >
              <input
                id="sms-consent"
                type="checkbox"
                className="mt-[3px] h-4 w-4 shrink-0 accent-[rgba(27,27,24,0.85)] cursor-pointer"
                aria-describedby="sms-consent-desc"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span id="sms-consent-desc">
                By providing your phone number, you agree to receive SMS trial
                reminders and subscription notifications from Nudge. Message
                frequency may vary. Standard Message and Data Rates may
                apply. Reply{" "}
                <span className="font-medium">STOP</span> to opt out,{" "}
                <span className="font-medium">HELP</span> for help. Nudge will
                not share your mobile information with third parties for
                promotional or marketing purposes. See our{" "}
                <a
                  className="underline hover:text-ink"
                  href="/legal/privacy"
                >
                  Privacy Policy
                </a>{" "}
                for details.
              </span>
            </label>

            {error && (
              <p className="text-[12px] text-center text-[#c65e32]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ink text-offwhite font-medium py-4 rounded-xl text-[14px] tracking-[0.06em] uppercase hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? "Sending…" : "Get Started"}
            </button>

            <p className="text-[11px] text-center text-[rgba(27,27,24,0.5)] leading-relaxed pt-2">
              Only Gmail read-only access needed. By continuing, you also
              agree to our{" "}
              <a
                href="https://www.termsfeed.com/live/c05cbfe9-6347-40ef-84a9-8b717adb1344"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-ink"
              >
                Terms &amp; Conditions
              </a>{" "}
              and{" "}
              <a className="underline hover:text-ink" href="/legal/privacy">
                Privacy Policy
              </a>
              .
            </p>
          </form>
        )}

        <div className="mt-16 grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-[13px] font-medium text-ink mb-1">
              Lives in texts
            </p>
            <p className="text-[11px] text-[rgba(27,27,24,0.5)] leading-snug">
              No app to download
            </p>
          </div>
          <div>
            <p className="text-[13px] font-medium text-ink mb-1">
              Auto-detects
            </p>
            <p className="text-[11px] text-[rgba(27,27,24,0.5)] leading-snug">
              Scans email for trials
            </p>
          </div>
          <div>
            <p className="text-[13px] font-medium text-ink mb-1">
              Timely alerts
            </p>
            <p className="text-[11px] text-[rgba(27,27,24,0.5)] leading-snug">
              Before you get charged
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
