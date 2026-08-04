import Navbar from "@/components/landing/Navbar";
import Contact from "@/components/landing/Contact";

export default function ContactPage() {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--offwhite)" }}
    >
      <Navbar />
      <div className="py-16">
        <Contact />
      </div>
    </div>
  );
}
