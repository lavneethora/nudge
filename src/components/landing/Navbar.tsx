import Link from "next/link";

const LINKS = [
  { label: "how it works", href: "/how-it-works" },
  { label: "faq", href: "/faq" },
  { label: "about", href: "/about" },
  { label: "contact", href: "/contact" },
] as const;

export default function Navbar() {
  return (
    <header
      data-nav
      className="sticky top-0 z-20 border-b border-[rgba(27,27,24,0.08)] backdrop-blur-md"
      style={{ backgroundColor: "rgba(249,245,236,0.85)" }}
    >
      <div className="mx-auto max-w-5xl flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <Link
          href="/home"
          className="shrink-0 uppercase font-medium text-[14px] sm:text-[15px] tracking-[0.04em] text-[rgba(27,27,24,0.92)] hover:opacity-70 transition-opacity"
        >
          Nudge
        </Link>
        <nav aria-label="Page sections" className="flex items-center gap-3 sm:gap-6">
          {LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="whitespace-nowrap text-[11px] sm:text-[13px] text-[rgba(27,27,24,0.5)] hover:text-ink transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
