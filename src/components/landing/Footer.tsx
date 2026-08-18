import Link from "next/link";

const TERMS_URL =
  "https://www.termsfeed.com/live/c05cbfe9-6347-40ef-84a9-8b717adb1344";

// Deliberately not a "footer bar" — no border, no background of its own, so it
// sits on the same cream + grain surface as everything above it. It's just
// quiet text at the bottom of the signup screen. Exists because Google's OAuth
// review wants the privacy policy reachable from the homepage.
export default function Footer() {
  return (
    <div className="mt-20 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] tracking-[0.02em] text-[rgba(27,27,24,0.32)]">
      <span>© {new Date().getFullYear()} nudge</span>
      <Link
        href="/legal/privacy"
        className="transition-colors hover:text-[rgba(27,27,24,0.6)]"
      >
        privacy
      </Link>
      <a
        href={TERMS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="transition-colors hover:text-[rgba(27,27,24,0.6)]"
      >
        terms
      </a>
      <Link
        href="/contact"
        className="transition-colors hover:text-[rgba(27,27,24,0.6)]"
      >
        contact
      </Link>
    </div>
  );
}
