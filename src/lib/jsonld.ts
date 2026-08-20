import { SITE_URL } from "./site";
import { FAQ_ITEMS } from "./faq";

/** Renders as <script type="application/ld+json">. The `<` escape is what
 * Next's guide prescribes — it stops a stray sequence in any string field
 * from closing the script tag early. */
export function jsonLdScript(data: object) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

// Deliberately absent, and both should stay absent:
//
//   address    — the only address on file is a home address from the 10DLC
//                registration. Publishing a private residence in a
//                machine-readable format is a real privacy exposure.
//   telephone  — the Telnyx number costs money on every inbound message.
//                Advertising it to scrapers is an invitation to the exact
//                flood the webhook throttle exists to absorb.
//
// Also absent: aggregateRating. There are no reviews, and inventing them is
// both dishonest and a documented cause of Google penalties.

export const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Nudge",
  url: SITE_URL,
  logo: `${SITE_URL}/og.jpg`,
  description:
    "Nudge is an SMS service that reminds people before a free trial converts to a paid subscription.",
  email: "help@nudgeme.app",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "help@nudgeme.app",
    availableLanguage: "English",
    areaServed: "US",
  },
};

export const webApplicationLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Nudge",
  url: SITE_URL,
  applicationCategory: "UtilitiesApplication",
  // There is no app to install; signup is a web page and everything after
  // that happens over SMS.
  operatingSystem: "Any",
  description:
    "Scans a connected Gmail inbox for free-trial confirmations and sends SMS reminders five days, two days, and on the day a trial ends. Trials can also be added by text.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free during beta.",
  },
  areaServed: { "@type": "Country", name: "United States" },
  provider: { "@type": "Organization", name: "Nudge", url: SITE_URL },
};

export const faqPageLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};
