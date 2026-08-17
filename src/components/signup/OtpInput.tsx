"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type Props = {
  length?: number;
  onComplete: (code: string) => void;
  loading: boolean;
  error?: string;
  attemptsRemaining?: number | null;
  phone: string;
  onResend: () => void;
  onChangeNumber: () => void;
};

export default function OtpInput({
  length = 6,
  onComplete,
  loading,
  error,
  phone,
  onResend,
  onChangeNumber,
}: Props) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const submit = useCallback(
    (d: string[]) => {
      const code = d.join("");
      if (code.length === length) onComplete(code);
    },
    [length, onComplete],
  );

  function handleChange(i: number, value: string) {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = char;
    setDigits(next);
    if (char && i < length - 1) {
      refs.current[i + 1]?.focus();
    }
    if (char && i === length - 1) submit(next);
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      const next = [...digits];
      next[i - 1] = "";
      setDigits(next);
      refs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    const next = Array(length).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    const focusIdx = Math.min(pasted.length, length - 1);
    refs.current[focusIdx]?.focus();
    if (pasted.length === length) submit(next);
  }

  function handleResend() {
    setDigits(Array(length).fill(""));
    setCooldown(60);
    refs.current[0]?.focus();
    onResend();
  }

  const masked =
    phone.length >= 4
      ? phone.slice(0, -4).replace(/\d/g, "*") + phone.slice(-4)
      : phone;

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <p className="text-[14px] text-ink">enter your verification code</p>
        <p className="text-[12px] text-[rgba(27,27,24,0.5)]">
          sent to {masked}
          <button
            type="button"
            onClick={onChangeNumber}
            className="ml-2 underline hover:text-ink transition-colors"
          >
            wrong number?
          </button>
        </p>
      </div>

      <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            disabled={loading}
            className="w-11 h-14 text-center text-[20px] tracking-[0.02em] border border-[rgba(27,27,24,0.14)] rounded-xl bg-white/40 focus:outline-none focus:border-[rgba(27,27,24,0.4)] focus:bg-white/60 text-ink transition-colors disabled:opacity-30"
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>

      {error && (
        <p className="text-[12px] text-[#c65e32]">{error}</p>
      )}

      {loading && (
        <p className="text-[12px] text-[rgba(27,27,24,0.5)]">verifying...</p>
      )}

      <div>
        {cooldown > 0 ? (
          <p className="text-[12px] text-[rgba(27,27,24,0.35)]">
            resend code in {cooldown}s
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="text-[12px] text-[rgba(27,27,24,0.5)] underline hover:text-ink transition-colors"
          >
            resend code
          </button>
        )}
      </div>
    </div>
  );
}
