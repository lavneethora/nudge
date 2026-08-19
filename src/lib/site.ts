/** Canonical public origin, with no trailing slash.
 *
 * Everything that has to emit absolute URLs (robots, sitemap, llms.txt) reads
 * from here, so pointing the app at a real domain is a single env-var change
 * on Vercel rather than a hunt through hardcoded strings. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"
).replace(/\/+$/, "");

/** Public pages, in the order a person would sensibly read them. Shared by
 * the sitemap and llms.txt so the two can't drift apart. */
export const PUBLIC_PAGES = [
  { path: "/", title: "Home", blurb: "What Nudge is and how to sign up." },
  {
    path: "/how-it-works",
    title: "How it works",
    blurb:
      "The four steps: connect Gmail, automatic trial detection, SMS reminders, and adding trials manually.",
  },
  {
    path: "/faq",
    title: "FAQ",
    blurb:
      "Cost, what Nudge can see in Gmail, whether it cancels trials for you, and how to stop messages.",
  },
  {
    path: "/about",
    title: "About",
    blurb: "Who built Nudge and why.",
  },
  {
    path: "/contact",
    title: "Contact",
    blurb: "How to reach support, by SMS or email.",
  },
  {
    path: "/legal/privacy",
    title: "Privacy Policy",
    blurb:
      "Data collected, AI processing of email content, named service providers, Google Limited Use compliance, retention, and deletion.",
  },
  {
    path: "/legal/terms",
    title: "Terms & Conditions",
    blurb: "The terms governing use of the service.",
  },
] as const;
