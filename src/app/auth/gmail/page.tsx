"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function GmailAuthContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("t");

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <p className="text-red-500">
            This link is invalid or expired. Text Nudge again to get a fresh one.
          </p>
        </div>
      </div>
    );
  }

  const connectUrl = `/api/auth/gmail?t=${encodeURIComponent(token)}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-4xl mb-4">📧</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Connect your Gmail
          </h1>
          <p className="text-gray-600 mb-6">
            Nudge needs read-only access to your Gmail to scan for subscription
            trial emails. We never store your emails — only trial details like
            vendor names and dates. Matching emails are analyzed by an AI model
            (Anthropic&apos;s Claude) to pull out those details.
          </p>
          <a
            href={connectUrl}
            className="inline-block w-full bg-black text-white font-semibold py-3 px-6 rounded-xl hover:bg-gray-800 transition-colors"
          >
            Connect Gmail
          </a>
          <p className="text-xs text-gray-400 mt-4">
            We only request read-only access — we can never send, delete, or
            modify anything. Text{" "}
            <span className="font-semibold">&quot;disconnect&quot;</span> anytime
            to revoke this access and delete the stored tokens, or{" "}
            <span className="font-semibold">&quot;delete&quot;</span> to erase
            your account entirely. See our{" "}
            <a href="/legal/privacy" className="underline hover:text-gray-600">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export default function GmailAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-gray-400">Loading...</div>
        </div>
      }
    >
      <GmailAuthContent />
    </Suspense>
  );
}
