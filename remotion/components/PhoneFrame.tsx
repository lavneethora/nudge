import type { ReactNode } from "react";

// A dark rounded phone chrome: iMessage-y header + safe home indicator.
// Height-first so the SMS thread has room; width scales via aspect ratio.
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        // sized as a proportion of the 1920×1080 composition
        width: 600,
        height: 900,
        borderRadius: 60,
        background: "#0F0F11",
        boxShadow:
          "0 30px 80px rgba(0,0,0,0.45), 0 0 0 2px rgba(255,255,255,0.05) inset",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* header */}
      <div
        style={{
          padding: "44px 24px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "#B8865B",
            color: "#F4F1E8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            fontWeight: 500,
          }}
        >
          N
        </div>
        <div
          style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}
        >
          <span style={{ fontSize: 18, fontWeight: 500, color: "#F4F1E8" }}>
            Nudge
          </span>
          <span style={{ fontSize: 13, color: "rgba(249,245,236,0.4)" }}>
            Text Message · SMS
          </span>
        </div>
      </div>

      {/* thread */}
      <div
        style={{
          flex: 1,
          padding: "24px 20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          gap: 12,
        }}
      >
        {children}
      </div>
    </div>
  );
}
