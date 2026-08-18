import Navbar from "@/components/landing/Navbar";
import About from "@/components/landing/About";
import Footer from "@/components/landing/Footer";

export default function AboutPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--offwhite)" }}
    >
      <Navbar />
      <div className="py-16 flex-1">
        <About />
      </div>
      <Footer spacing="mt-auto" />
    </div>
  );
}
