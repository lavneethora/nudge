"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import SignupForm from "@/components/signup/SignupForm";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Transparent overlay occupying the hero's final pinned viewport (-100vh):
// the hero's own black veil supplies the darkness, so its sticker-scatter and
// text fade stay fully visible "through" this section. The moment the hero
// text has dissolved (scroll end), the cream signup page — demo-video card
// included — auto-crossfades in. No extra scrolling, no chat, no flash.
export default function SignupReveal() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(wrapRef);
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      const cream = q("[data-cream]")[0] as HTMLElement;

      if (reduced) {
        gsap.set(cream, { autoAlpha: 1, overflowY: "auto" });
        gsap.set(q("[data-form]"), { opacity: 1, y: 0 });
        return;
      }

      // swallow all scroll input while the transition plays — Lenis skips
      // this layer (data-lenis-prevent) but unhandled wheel events would
      // otherwise chain to the document and rewind the hero
      const block = (e: Event) => e.preventDefault();

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapRef.current,
          start: "top 5%",
          once: true,
        },
        onStart: () => {
          window.addEventListener("wheel", block, { passive: false });
          window.addEventListener("touchmove", block, { passive: false });
        },
        // the layer opens at its very top; from here on it scrolls natively
        // (overscroll-none stops any chaining back to the document, so the
        // hero is one-way, like the reference site — refresh to replay)
        onComplete: () => {
          window.removeEventListener("wheel", block);
          window.removeEventListener("touchmove", block);
          cream.scrollTop = 0;
          cream.style.overflowY = "auto";
        },
      });

      // let the black land for a full beat after the hero text dissolves,
      // then ease the cream page in slowly — the pause is the transition
      tl.to(
        q("[data-cream]"),
        { autoAlpha: 1, duration: 2.0, ease: "power2.inOut" },
        1.1
      );
      tl.fromTo(
        q("[data-form]"),
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.3, ease: "power2.out" },
        1.9
      );

      return () => {
        window.removeEventListener("wheel", block);
        window.removeEventListener("touchmove", block);
      };
    },
    { scope: wrapRef }
  );

  return (
    <div
      ref={wrapRef}
      className="relative z-10 -mt-[100vh] h-screen overflow-clip"
    >
      {/* data-lenis-prevent: Lenis hijacks wheel events for the (already
          maxed-out) document scroll — this opts the layer out so its own
          overflow scrolling works and nothing below the fold is unreachable */}
      <div
        data-cream
        data-lenis-prevent
        className="invisible absolute inset-0 overflow-hidden overscroll-none opacity-0"
        style={{ backgroundColor: "var(--offwhite)" }}
      >
        {/* the campaign page gets its paper grain from body::before, which
            this opaque layer covers — recreate the exact same texture here
            (fixed, so it doesn't scroll with the content, just like prod) */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 opacity-60"
          style={{
            backgroundImage: 'url("/bgNoise.png")',
            backgroundRepeat: "repeat",
            backgroundSize: "90px 90px",
          }}
        />
        <div data-form className="relative opacity-0">
          <SignupForm showVideo />
        </div>
      </div>
    </div>
  );
}
