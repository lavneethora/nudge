"use client";

import { useState } from "react";

// Poke-style demo video card: a plain <video> (no player chrome) inside a
// rounded card, with a second blurred copy of the same video behind it that
// throws a soft ambient glow matching the footage. Degrades to the blank
// white card shell while /demo.mp4 doesn't exist yet.
const SRC = "/demo.mp4";
const POSTER = "/demo-poster.jpg";

const videoProps = {
  src: SRC,
  muted: true,
  loop: true,
  playsInline: true,
  autoPlay: true,
  tabIndex: -1,
  disablePictureInPicture: true,
  disableRemotePlayback: true,
  controlsList: "nodownload noplaybackrate",
} as const;

export default function DemoVideo() {
  const [videoOk, setVideoOk] = useState(true);
  const [posterOk, setPosterOk] = useState(true);

  return (
    <div className="relative mx-auto mb-10 aspect-video max-h-[34vh] w-auto max-w-full">
      {/* ambient glow: same video, blurred, behind the card */}
      {videoOk && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <video
            {...videoProps}
            preload="auto"
            className="h-full w-full rounded-[24px] object-cover"
            style={{ filter: "blur(40px)", opacity: 0.8 }}
            onError={() => setVideoOk(false)}
          />
        </div>
      )}

      {/* the card */}
      <div className="relative z-10 h-full w-full overflow-hidden rounded-[24px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_18px_50px_-16px_rgba(0,0,0,0.22)]">
        {videoOk && posterOk && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={POSTER}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setPosterOk(false)}
          />
        )}
        {videoOk && (
          <video
            {...videoProps}
            preload="metadata"
            poster={posterOk ? POSTER : undefined}
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setVideoOk(false)}
          />
        )}
      </div>
    </div>
  );
}
