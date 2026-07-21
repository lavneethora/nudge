import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

// The input pill under the thread. Between `typeStart` and `typeEnd`, letters
// of `text` appear one-by-one, with a blinking caret. Before/after that
// window we show the placeholder. Send button turns SMS-green while typing.
export function InputBar({
  text,
  typeStart,
  typeEnd,
  sendAt,
}: {
  text: string;
  typeStart: number;
  typeEnd: number;
  sendAt: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const typing = frame >= typeStart && frame < sendAt;
  const chars = [...text];
  const shown =
    frame >= typeEnd
      ? chars.length
      : frame < typeStart
      ? 0
      : Math.floor(
          ((frame - typeStart) / (typeEnd - typeStart)) * chars.length
        );

  // once "sent", clear the box back to the placeholder state
  const displayText =
    frame >= sendAt ? "" : chars.slice(0, Math.max(0, shown)).join("");

  const showPlaceholder = displayText.length === 0 && !typing;
  const caretVisible = typing && Math.floor((frame / fps) * 2) % 2 === 0;

  const sendActive = typing || (frame >= typeEnd - 4 && frame < sendAt + 4);
  const sendBg = sendActive ? "#34C759" : "rgba(255,255,255,0.1)";
  const sendColor = sendActive ? "#FFFFFF" : "rgba(249,245,236,0.4)";
  const sendGlow = interpolate(frame, [sendAt - 4, sendAt], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          flex: 1,
          height: 52,
          borderRadius: 999,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {showPlaceholder ? (
          <span style={{ color: "rgba(249,245,236,0.35)", fontSize: 18 }}>
            Text Message · SMS
          </span>
        ) : (
          <span
            style={{
              color: "#F4F1E8",
              fontSize: 19,
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "baseline",
            }}
          >
            {displayText}
            {caretVisible && (
              <span
                style={{
                  display: "inline-block",
                  width: 2,
                  height: 20,
                  background: "#F4F1E8",
                  marginLeft: 2,
                  transform: "translateY(3px)",
                }}
              />
            )}
          </span>
        )}
      </div>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: sendBg,
          color: sendColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${1 + sendGlow * 0.08})`,
          transition: "none",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 14 14" aria-hidden="true">
          <path
            d="M7 12V2M7 2L2.5 6.5M7 2l4.5 4.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
}
