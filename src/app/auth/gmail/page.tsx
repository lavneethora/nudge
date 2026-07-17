"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function GmailAuthContent() {
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone");

  if (!phone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <p className="text-red-500">Invalid link. Please try again from your text messages.</p>
        </div>
      </div>
    );
  }

  const connectUrl = `/api/auth/gmail?phone=${encodeURIComponent(phone)}`;

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
            vendor names and dates.
          </p>
          <a
            href={connectUrl}
            className="inline-block w-full bg-black text-white font-semibold py-3 px-6 rounded-xl hover:bg-gray-800 transition-colors"
          >
            Connect Gmail
          </a>
          <p className="text-xs text-gray-400 mt-4">
            We only request read-only access. You can disconnect anytime by
            texting &quot;stop&quot;.
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
