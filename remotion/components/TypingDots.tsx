import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

// The pulsing three dots inside a Nudge bubble. Appears at enterAt and
// disappears at exitAt (both in frames). Individual dots bounce with a
// staggered sine so the loop reads as "typing".
export function TypingDots({
  enterAt,
  exitAt,
}: {
  enterAt: number;
  exitAt: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacityIn = interpolate(frame, [enterAt, enterAt + 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacityOut = interpolate(frame, [exitAt, exitAt + 6], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(opacityIn, opacityOut);

  const dot = (delay: number) => {
    const t = ((frame - enterAt) / fps + delay) * 2.4; // Hz-ish
    const y = Math.sin(t * Math.PI) * 3;
    const alpha = 0.35 + (Math.sin(t * Math.PI) + 1) / 2 * 0.5;
    return { y, alpha };
  };

  const dots = [dot(0), dot(0.15), dot(0.3)];

  return (
    <div style={{ display: "flex", justifyContent: "flex-start", opacity }}>
      <div
        style={{
          padding: "16px 18px",
          background: "#26262A",
          borderRadius: "22px 22px 22px 8px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
        }}
      >
        {dots.map((d, i) => (
          <span
            key={i}
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: `rgba(249,245,236,${d.alpha})`,
              transform: `translateY(${d.y}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
