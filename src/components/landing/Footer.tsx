import Link from "next/link";

// Deliberately not a "footer bar" — no border, no background of its own, so it
// sits on the same cream + grain surface as everything above it. It's just
// quiet text at the bottom of the signup screen. Exists because Google's OAuth
// review wants the privacy policy reachable from the homepage.
export default function Footer({
  /** spacing above the links — pages with short content pass `mt-auto` so it
      settles at the bottom instead of floating under the copy */
  spacing = "mt-20",
}: {
  spacing?: string;
}) {
  return (
    <div
      className={`${spacing} pb-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] tracking-[0.02em] text-[rgba(27,27,24,0.32)]`}
    >
      <span>© {new Date().getFullYear()} nudge</span>
      <Link
        href="/legal/privacy"
        className="transition-colors hover:text-[rgba(27,27,24,0.6)]"
      >
        privacy
      </Link>
      <Link
        href="/legal/terms"
        className="transition-colors hover:text-[rgba(27,27,24,0.6)]"
      >
        terms
      </Link>
      <Link
        href="/contact"
        className="transition-colors hover:text-[rgba(27,27,24,0.6)]"
      >
        contact
      </Link>
    </div>
  );
}
