const STEPS = [
  {
    title: "connect your gmail",
    desc: "nudge gets read-only access to your inbox. it looks for trial confirmation emails from services like netflix, spotify, adobe, and more.",
  },
  {
    title: "we detect your trials",
    desc: "our scanner checks your recent emails daily. when it finds a trial signup, it extracts the vendor name and end date automatically.",
  },
  {
    title: "you get a text before you're charged",
    desc: "reminders arrive at 5 days, 2 days, and day-of. reply to cancel, snooze, or list all your trials. no app to open.",
  },
  {
    title: "some don't email? just text us",
    desc: 'not every service sends a confirmation email. text something like "youtube tv trial ends july 23" in plain english and nudge adds it to your list.',
  },
] as const;

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="mt-24 w-full max-w-lg mx-auto px-6">
      <h2 className="text-[13px] font-medium uppercase tracking-[0.12em] text-[rgba(27,27,24,0.5)] mb-12">
        How it works
      </h2>

      <div className="space-y-10">
        {STEPS.map((step, i) => (
          <div key={i} className="flex gap-5">
            <div
              className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-medium"
              style={{
                backgroundColor: "rgba(27,27,24,0.07)",
                color: "rgba(27,27,24,0.55)",
              }}
            >
              {i + 1}
            </div>
            <div className="pt-[2px]">
              <p className="text-[14px] font-medium text-ink mb-1.5">
                {step.title}
              </p>
              <p className="text-[12px] text-[rgba(27,27,24,0.5)] leading-relaxed">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* mock SMS bubble for step 4 */}
      <div className="mt-10 rounded-2xl border border-[rgba(27,27,24,0.08)] p-5 space-y-3">
        <div className="flex justify-end">
          <div className="rounded-2xl rounded-br-md px-4 py-2.5 text-[13px] leading-snug text-white bg-[#34C759] max-w-[75%]">
            youtube tv trial ends july 23
          </div>
        </div>
        <div className="flex justify-start">
          <div
            className="rounded-2xl rounded-bl-md px-4 py-2.5 text-[13px] leading-snug max-w-[75%]"
            style={{
              backgroundColor: "rgba(27,27,24,0.06)",
              color: "rgba(27,27,24,0.82)",
            }}
          >
            got it! i'll ping you before your YouTube TV trial ends Jul 23 👌
          </div>
        </div>
      </div>
    </section>
  );
}
