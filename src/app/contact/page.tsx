import Navbar from "@/components/landing/Navbar";
import Contact from "@/components/landing/Contact";
import Footer from "@/components/landing/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Nudge",
  description:
    "Reach Nudge support by text or email.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--offwhite)" }}
    >
      <Navbar />
      <div className="py-16 flex-1">
        <Contact />
      </div>
      <Footer spacing="mt-auto" />
    </div>
  );
}
