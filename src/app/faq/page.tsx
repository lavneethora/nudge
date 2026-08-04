import Navbar from "@/components/landing/Navbar";
import FAQ from "@/components/landing/FAQ";

export default function FAQPage() {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--offwhite)" }}
    >
      <Navbar />
      <div className="py-16">
        <FAQ />
      </div>
    </div>
  );
}
