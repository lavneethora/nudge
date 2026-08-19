"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  if (status === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">🔗</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Link expired
            </h1>
            <p className="text-gray-600">
              Connect links are single-use and expire after 24 hours. Text{" "}
              <span className="font-semibold">&quot;yes&quot;</span> to Nudge
              and it&apos;ll send you a fresh one.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Connection Failed
            </h1>
            <p className="text-gray-600">
              Something went wrong connecting your Gmail. Please go back to your
              texts and try the link again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Gmail Connected!
          </h1>
          <p className="text-gray-600 mb-4">
            You&apos;re all set. I&apos;m scanning your inbox for active trials
            now. You can close this tab and head back to your texts.
          </p>
          <p className="text-sm text-gray-400">
            You&apos;ll receive a text with your trial results shortly.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-gray-400">Loading...</div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
