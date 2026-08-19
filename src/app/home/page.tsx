import Navbar from "@/components/landing/Navbar";
import SignupForm from "@/components/signup/SignupForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up for Nudge",
  description:
    "Enter your US mobile number to start getting text reminders before free trials charge you.",
  alternates: { canonical: "/home" },
};

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
