import Navbar from "@/components/landing/Navbar";
import SignupForm from "@/components/signup/SignupForm";

export default function SignupPage() {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--offwhite)" }}
    >
      <Navbar />
      <SignupForm showVideo />
    </div>
  );
}
