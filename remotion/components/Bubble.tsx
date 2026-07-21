import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

// A single SMS bubble that fades + springs in at `enterAt` (frames) and
// cross-fades out at `exitAt`. Sender-side coloring, tail via asymmetric
// corner radius. Text stays cased for readability of proper nouns.
type Sender = "nudge" | "user";

export function Bubble({
  sender,
  enterAt,
  exitAt,
  children,
}: {
  sender: Sender;
  enterAt: number;
  exitAt?: number;
  children: React.ReactNode;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // spring for the pop-in
  const enterProgress = spring({
    frame: frame - enterAt,
    fps,
    config: { damping: 18, stiffness: 200, mass: 0.7 },
  });
  const opacityIn = interpolate(frame, [enterAt, enterAt + 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = 0.9 + 0.1 * enterProgress;
  const y = interpolate(enterProgress, [0, 1], [10, 0]);

  // exit fade (skipped if exitAt undefined)
  const opacityOut =
    exitAt !== undefined
      ? interpolate(frame, [exitAt, exitAt + 20], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;

  const opacity = Math.min(opacityIn, opacityOut);

  const isNudge = sender === "nudge";
  const align = isNudge ? "flex-start" : "flex-end";
  const bg = isNudge ? "#26262A" : "#34C759";
  const color = isNudge ? "#F4F1E8" : "#FFFFFF";
  const radius = isNudge
    ? "22px 22px 22px 8px"
    : "22px 22px 8px 22px";

  return (
    <div style={{ display: "flex", justifyContent: align }}>
      <div
        style={{
          maxWidth: "78%",
          padding: "14px 18px",
          background: bg,
          color,
          borderRadius: radius,
          fontSize: 22,
          lineHeight: 1.35,
          opacity,
          transform: `translateY(${y}px) scale(${scale})`,
          boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
          willChange: "transform, opacity",
        }}
      >
        {children}
      </div>
    </div>
  );
}
