"use client";

// Catches anything that escapes a route so users never see a stack trace or
// framework error page. Real details go to the server logs, not the browser.
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <h1 className="text-[18px] font-medium mb-3">something went wrong</h1>
          <p className="text-[14px] text-[rgba(27,27,24,0.6)] mb-6">
            that&apos;s on us, not you. try again in a moment.
          </p>
          <button
            onClick={reset}
            className="text-[13px] uppercase tracking-[0.06em] underline"
          >
            try again
          </button>
        </div>
      </body>
    </html>
  );
}
