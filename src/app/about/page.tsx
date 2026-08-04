import Navbar from "@/components/landing/Navbar";
import About from "@/components/landing/About";

export default function AboutPage() {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--offwhite)" }}
    >
      <Navbar />
      <div className="py-16">
        <About />
      </div>
    </div>
  );
}
