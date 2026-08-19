import Navbar from "@/components/landing/Navbar";
import HowItWorks from "@/components/landing/HowItWorks";
import Footer from "@/components/landing/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How Nudge works",
  description:
    "Connect Gmail, Nudge detects your free trials, and texts you five days, two days, and the day before you get charged.",
  alternates: { canonical: "/how-it-works" },
};

export default function HowItWorksPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--offwhite)" }}
    >
      <Navbar />
      <div className="py-16 flex-1">
        <HowItWorks />
      </div>
      <Footer spacing="mt-auto" />
    </div>
  );
}
