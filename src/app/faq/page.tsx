import Navbar from "@/components/landing/Navbar";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";

export default function FAQPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--offwhite)" }}
    >
      <Navbar />
      <div className="py-16 flex-1">
        <FAQ />
      </div>
      <Footer spacing="mt-auto" />
    </div>
  );
}
