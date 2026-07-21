import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { PhoneFrame } from "./components/PhoneFrame";
import { Bubble } from "./components/Bubble";
import { TypingDots } from "./components/TypingDots";
import { InputBar } from "./components/InputBar";

// Time budget @ 30fps, ~22s total. Numbers in frames (30 = 1s).
// Start & end frames render identically so <video loop> is seamless.
//
//   0–30   phone fades in
//   30–75  Nudge typing dots
//   75–165 Nudge bubble 1 visible
//  165–210 user typing (letter-by-letter in input bar)
//  210–300 user bubble 1 visible
//  240–285 Nudge typing dots
//  300–420 Nudge bubble 2 visible
//  390–540 tagline overlay "one text is all it takes."
//  540–630 everything cross-fades out
//  630–660 empty phone frame — matches frame 0 for the loop

export const DEMO_DURATION_FRAMES = 660; // 22s @ 30fps

export function DemoComposition() {
  const frame = useCurrentFrame();

  // phone fade-in AND matching fade-out at the tail, so the loop point is
  // an empty-thread frame at both ends
  const phoneOpacity = Math.min(
    interpolate(frame, [0, 30], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    interpolate(frame, [600, 640], [1, 0.6], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // tagline drifts in at 390, out at 540
  const taglineOpacity = Math.min(
    interpolate(frame, [390, 430], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    interpolate(frame, [540, 580], [1, 0]),
  );
  const taglineY = interpolate(frame, [390, 430], [14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        // warm cream so the ambient blurred glow (rendered by DemoVideo.tsx)
        // reads as a cream + green wash matching the signup page
        background: "#F9F5EC",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 24,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif",
      }}
    >
      <div style={{ opacity: phoneOpacity }}>
        <PhoneFrame>
          {/* --- typing dots slot: nudge #1 (frames 30–75) --- */}
          {frame >= 30 && frame <= 78 && (
            <TypingDots enterAt={30} exitAt={72} />
          )}

          {/* --- nudge bubble 1 (75 → 540 fade) --- */}
          {frame >= 75 && (
            <Bubble sender="nudge" enterAt={75} exitAt={540}>
              hey! your Netflix trial ends tomorrow — you&apos;ll get charged
              $15.99
            </Bubble>
          )}

          {/* --- user bubble 1 (210 → 540 fade) --- */}
          {frame >= 210 && (
            <Bubble sender="user" enterAt={210} exitAt={540}>
              cancel it
            </Bubble>
          )}

          {/* --- typing dots: nudge #2 (240–288) --- */}
          {frame >= 240 && frame <= 288 && (
            <TypingDots enterAt={240} exitAt={285} />
          )}

          {/* --- nudge bubble 2 (300 → 540) --- */}
          {frame >= 300 && (
            <Bubble sender="nudge" enterAt={300} exitAt={540}>
              done ✅ that&apos;s $15.99 staying in your pocket
            </Bubble>
          )}

          {/* --- input bar (types "cancel it" 165→200, sends at 210) --- */}
          <InputBar
            text="cancel it"
            typeStart={165}
            typeEnd={200}
            sendAt={210}
          />
        </PhoneFrame>
      </div>

      {/* --- tagline underneath (390–580) --- */}
      <div
        style={{
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          fontSize: 34,
          fontWeight: 500,
          color: "#1B1B18",
          letterSpacing: "-0.01em",
        }}
      >
        one text is all it takes.
      </div>
    </AbsoluteFill>
  );
}
