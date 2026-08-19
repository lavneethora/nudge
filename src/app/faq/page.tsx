import Navbar from "@/components/landing/Navbar";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";
import { jsonLdScript, faqPageLd } from "@/lib/jsonld";

export default function FAQPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--offwhite)" }}
    >
      {/* Built from the same FAQ_ITEMS the accordion renders, so the markup
          can never claim answers a visitor wouldn't see on the page. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(faqPageLd) }}
      />
      <Navbar />
      <div className="py-16 flex-1">
        <FAQ />
      </div>
      <Footer spacing="mt-auto" />
    </div>
  );
}
