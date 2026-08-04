import Navbar from "@/components/landing/Navbar";
import HowItWorks from "@/components/landing/HowItWorks";

export default function HowItWorksPage() {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--offwhite)" }}
    >
      <Navbar />
      <div className="py-16">
        <HowItWorks />
      </div>
    </div>
  );
}
