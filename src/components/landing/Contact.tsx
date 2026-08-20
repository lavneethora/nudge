export default function Contact() {
  return (
    <section id="contact" className="mt-24 pb-20 w-full max-w-lg mx-auto px-6">
      <h1 className="text-[13px] font-medium uppercase tracking-[0.12em] text-[rgba(27,27,24,0.5)] mb-8">
        Contact
      </h1>
      <div className="space-y-4 text-[14px] text-[rgba(27,27,24,0.72)] leading-relaxed">
        <p>
          text{" "}
          <span className="font-medium text-ink">HELP</span>{" "}
          to your nudge number anytime for quick support.
        </p>
        <p>
          or email{" "}
          <a
            href="mailto:help@nudgeme.app"
            className="underline hover:text-ink transition-colors"
          >
            help@nudgeme.app
          </a>
        </p>
      </div>
    </section>
  );
}
