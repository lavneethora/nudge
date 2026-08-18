import Link from "next/link";

const TERMS_URL =
  "https://www.termsfeed.com/live/c05cbfe9-6347-40ef-84a9-8b717adb1344";

// Google's OAuth verification requires the privacy policy to be reachable
// from the homepage, so this renders in the root layout on every route.
export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[rgba(27,27,24,0.08)] px-4 sm:px-6 py-6">
      <div className="mx-auto max-w-5xl flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] sm:text-[12px] text-[rgba(27,27,24,0.5)]">
        <span>© {new Date().getFullYear()} Nudge</span>
        <Link href="/legal/privacy" className="hover:text-ink transition-colors">
          privacy policy
        </Link>
        <a
          href={TERMS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-ink transition-colors"
        >
          terms
        </a>
        <Link href="/contact" className="hover:text-ink transition-colors">
          contact
        </Link>
      </div>
    </footer>
  );
}
