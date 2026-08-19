"use client";

import { useState } from "react";
import { FAQ_ITEMS } from "@/lib/faq";

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="mt-24 w-full max-w-lg mx-auto px-6">
      <h1 className="text-[13px] font-medium uppercase tracking-[0.12em] text-[rgba(27,27,24,0.5)] mb-12">
        FAQ
      </h1>

      <div className="divide-y divide-[rgba(27,27,24,0.08)]">
        {FAQ_ITEMS.map((item, i) => (
          <button
            key={i}
            type="button"
            className="w-full text-left py-5 group"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-[14px] font-medium text-ink">{item.q}</p>
              <span
                className="shrink-0 text-[rgba(27,27,24,0.35)] text-[18px] leading-none mt-0.5 transition-transform"
                style={{ transform: open === i ? "rotate(45deg)" : "none" }}
              >
                +
              </span>
            </div>
            <div
              className="overflow-hidden transition-all duration-300"
              style={{
                maxHeight: open === i ? "200px" : "0",
                opacity: open === i ? 1 : 0,
              }}
            >
              <p className="text-[12px] text-[rgba(27,27,24,0.5)] leading-relaxed pt-3">
                {item.a}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
