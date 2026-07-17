"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";
import { generatePillField, type FieldRow } from "./pills";
import StickerLayer from "./Stickers";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// content-sized pills in wrapping rows — odd row counts so the center row
// (which carries the focal-pill spacer) sits at exactly 50vh.
// Proportions measured off the virio reference: text fills ~75% of the pill,
// pill height ≈ 2.1× font size, h-gap ≈ 0.3× height, v-gap ≈ 0.55× height.
const DESKTOP_FIELD = generatePillField({
  rows: 21,
  perRow: 24,
  seed: 20260707,
  padMin: 10,
  padMax: 18,
  spacerWidth: 102,
  offsetMax: 116,
});
const MOBILE_FIELD = generatePillField({
  rows: 21,
  perRow: 11,
  seed: 926,
  padMin: 8,
  padMax: 13,
  spacerWidth: 75,
  offsetMax: 85,
});

function PillField({
  rows,
  pillHeight,
  fontSize,
  gapX,
  gapY,
  className,
}: {
  rows: FieldRow[];
  pillHeight: number;
  fontSize: number;
  gapX: number;
  gapY: number;
  className: string;
}) {
  return (
    <div className={`absolute inset-0 ${className}`} aria-hidden="true">
      {/* rows overflow the viewport on every side and get clipped by the
          hero — no measuring, so SSR always matches the client */}
      <div
        className="flex h-full flex-col items-start justify-center"
        style={{ rowGap: gapY }}
      >
        {rows.map((row) => (
          <div
            key={row.id}
            className={`flex shrink-0 ${
              row.center ? "w-full justify-center" : ""
            }`}
            style={{
              columnGap: gapX,
              ...(row.center ? null : { marginLeft: row.offset }),
            }}
          >
            {row.items.map((item) =>
              item.spacer ? (
                <span
                  key={item.id}
                  className="shrink-0"
                  style={{ width: item.width }}
                />
              ) : (
                <span
                  key={item.id}
                  className="pill inline-flex shrink-0 items-center justify-center uppercase font-medium whitespace-nowrap select-none rounded-[6px] tracking-[0.04em] opacity-0 will-change-transform shadow-[0_1px_2px_rgba(27,27,24,0.08)]"
                  style={{
                    height: pillHeight,
                    fontSize,
                    padding: `0 ${item.padX}px`,
                    backgroundColor: item.color,
                    color: item.textColor,
                  }}
                  data-reveal={item.revealOrder}
                  data-dx={item.dx}
                  data-dy={item.dy}
                  data-rot={item.rot}
                  data-scatter={item.scatterOrder}
                >
                  NUDGE
                </span>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HeroScroll() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (reduced) {
        // static fallback: show final text state on the gradient, no pin
        gsap.set(".pill", { opacity: 0 });
        gsap.set(".sub-sticker", { opacity: 0 });
        gsap.set("[data-veil-gradient]", { opacity: 1 });
        gsap.set("[data-line1]", { color: "var(--offwhite)" });
        gsap.set("[data-line2]", { opacity: 1 });
        gsap.set("[data-hint]", { opacity: 0 });
        return;
      }

      const lenis = new Lenis();
      lenis.on("scroll", ScrollTrigger.update);
      const raf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      // scroll-hint chevrons: subtle time-based drift, independent of scroll
      gsap.fromTo(
        ".scroll-chevron",
        { y: -4, opacity: 0.25 },
        {
          y: 5,
          opacity: 1,
          duration: 0.85,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          stagger: 0.16,
        }
      );

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: wrapRef.current,
          start: "top top",
          end: "+=550%",
          pin: true,
          scrub: 0.4,
        },
      });

      const pills = gsap.utils.toArray<HTMLElement>(".pill");

      // --- 0 → 5: scroll hint out, hero word becomes a pill
      tl.to("[data-hint]", { opacity: 0, duration: 5 }, 0);
      tl.to(
        "[data-line1-bg]",
        { opacity: 1, duration: 6 },
        2
      );

      // --- 5 → 30: pills stagger in (each pill keyed to its own revealOrder)
      pills.forEach((el) => {
        const at = 5 + parseFloat(el.dataset.reveal ?? "0") * 22;
        tl.fromTo(
          el,
          { opacity: 0, scale: 0.92 },
          { opacity: 1, scale: 1, duration: 3 },
          at
        );
      });

      // --- 36 → 58: scatter out
      pills.forEach((el) => {
        const at = 36 + parseFloat(el.dataset.scatter ?? "0") * 15;
        tl.to(
          el,
          {
            x: () => (parseFloat(el.dataset.dx ?? "0") / 100) * window.innerWidth,
            y: () =>
              (parseFloat(el.dataset.dy ?? "0") / 100) * window.innerHeight,
            rotation: parseFloat(el.dataset.rot ?? "0"),
            opacity: 0,
            duration: 7,
          },
          at
        );
      });

      // hero word sheds its pill background as the wall departs
      tl.to("[data-line1-bg]", { opacity: 0, duration: 8 }, 50);

      // --- 58 → 74: gradient veil + text goes cream + tagline in
      tl.to("[data-veil-gradient]", { opacity: 1, duration: 12 }, 58);
      tl.to("[data-line1]", { color: "var(--offwhite)", duration: 8 }, 60);
      tl.fromTo(
        "[data-line2]",
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 10 },
        62
      );

      // --- 64 → 86: subscription stickers develop in one by one once the
      // tagline is readable, then peel away as darkness falls — every sticker
      // is gone (≤86) before the black veil finishes (88)
      const stickers = gsap.utils.toArray<HTMLElement>(".sub-sticker");
      stickers.forEach((el) => {
        const inAt = 64 + parseFloat(el.dataset.in ?? "0") * 7;
        const outAt = 76 + parseFloat(el.dataset.out ?? "0") * 7;
        tl.fromTo(
          el,
          { opacity: 0, scale: 0.95, filter: "brightness(0.85)" },
          { opacity: 1, scale: 1, filter: "brightness(1)", duration: 2.5 },
          inAt
        );
        tl.to(
          el,
          { opacity: 0, scale: 0.97, filter: "brightness(0.8)", duration: 2.5 },
          outAt
        );
      });

      // --- 74 → 90: darkness falls
      tl.to("[data-veil-black]", { opacity: 1, duration: 14 }, 74);

      // --- 85 → 88: text dissolves fast, finishing exactly as the black veil
      // completes — this is the timeline's last beat, so the scroll ends here
      // and the conversation overlay takes over with no dead black tail
      tl.to("[data-text-stack]", { opacity: 0, duration: 3 }, 85);

      return () => {
        gsap.ticker.remove(raf);
        lenis.destroy();
      };
    },
    { scope: wrapRef }
  );

  return (
    <div ref={wrapRef} data-hero className="relative h-screen overflow-clip bg-offwhite">
      {/* pill wall */}
      <PillField
        rows={DESKTOP_FIELD}
        pillHeight={48}
        fontSize={23}
        gapX={14}
        gapY={23}
        className="hidden md:block"
      />
      <PillField
        rows={MOBILE_FIELD}
        pillHeight={39}
        fontSize={17}
        gapX={11}
        gapY={16}
        className="block md:hidden"
      />

      {/* dusk gradient veil */}
      <div
        data-veil-gradient
        className="absolute inset-0 opacity-0 scale-110"
        style={{
          background:
            "radial-gradient(120% 140% at 12% 20%, var(--slate) 0%, var(--teal) 34%, rgba(44,67,71,0) 68%), radial-gradient(130% 120% at 88% 78%, #6b6430 0%, rgba(125,119,48,0.55) 40%, rgba(125,119,48,0) 75%), linear-gradient(118deg, var(--slate) 0%, #3d4a40 48%, #59532c 100%)",
          filter: "blur(48px)",
        }}
      />
      {/* black veil */}
      <div
        data-veil-black
        className="absolute inset-0 opacity-0"
        style={{ backgroundColor: "var(--ink)" }}
      />

      {/* subscription stickers — above the veils so they stay legible while
          darkness falls, below the text stack and grain */}
      <StickerLayer />

      {/* center text */}
      <div
        data-text-stack
        className="absolute inset-0 flex flex-col items-center justify-center gap-7 text-center"
      >
        <h1
          data-line1
          className="relative uppercase font-medium leading-none text-[17px] md:text-[23px] tracking-[0.04em] text-[rgba(27,27,24,0.92)]"
          style={{ transform: "translateY(23px)" }}
        >
          {/* focal pill: identical to a field pill (font/height/padding/radius
              via insets that hug the text) — only the bronze color differs.
              translateY(23px) compensates for the tagline below in the stack
              so this label sits exactly in the field's center row. */}
          <span
            data-line1-bg
            aria-hidden="true"
            className="absolute -inset-x-[10px] -inset-y-[11px] md:-inset-x-[14px] md:-inset-y-[12.5px] rounded-[6px] opacity-0 shadow-[0_1px_2px_rgba(27,27,24,0.08)]"
            style={{ backgroundColor: "#B8865B" }}
          />
          <span className="relative">NUDGE</span>
        </h1>
        <p
          data-line2
          className="font-medium leading-none text-[clamp(0.95rem,1.3vw,1.35rem)] tracking-[0.04em] text-offwhite opacity-0"
        >
          is all you need.
        </p>
      </div>

      {/* scroll hint */}
      <div
        data-hint
        className="absolute inset-x-0 bottom-[50px] flex flex-col items-center gap-3 text-ink"
      >
        <span className="text-[13px] font-medium uppercase tracking-[0.12em] leading-none text-[rgba(27,27,24,0.58)]">
          Scroll down
        </span>
        <span className="flex flex-col items-center" aria-hidden="true">
          <span className="scroll-chevron text-[15px] leading-[0.7]">⌄</span>
          <span className="scroll-chevron text-[15px] leading-[0.7]">⌄</span>
        </span>
      </div>

      {/* paper grain — above the hero's own layers so it also shows over
          the gradient/dark phases (the body-level noise sits below content) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: 'url("/bgNoise.png")',
          backgroundRepeat: "repeat",
          backgroundSize: "90px 90px",
        }}
        aria-hidden="true"
      />
    </div>
  );
}
