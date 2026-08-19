import HeroScroll from "@/components/hero/HeroScroll";
import SignupReveal from "@/components/landing/SignupReveal";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <main>
      <HeroScroll />
      <SignupReveal />
    </main>
  );
}
