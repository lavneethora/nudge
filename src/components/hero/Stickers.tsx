import type { CSSProperties, ReactNode } from "react";

// Physical subscription stickers scattered over the hero — like a laptop lid
// covered in decals. ~80% brand marks, ~20% reminder labels. Every sticker is
// a different material (glossy vinyl, matte paper, thermal receipt, kraft,
// transparent) with its own imperfection, rotation and shadow. Hand-placed:
// outer thirds only, the center stays clear for the hero copy.

const NOISE: CSSProperties = {
  backgroundImage: 'url("/bgNoise.png")',
  backgroundRepeat: "repeat",
  backgroundSize: "90px 90px",
};

type Peel = "br" | "tr" | "bl";

type StickerDef = {
  id: string;
  left: string;
  top: string;
  rot: number;
  /** 0..1 scrambled stagger orders for enter/exit */
  in: number;
  out: number;
  desktopOnly?: boolean;
  /** paper/vinyl body: size, color, radius, shadow */
  bodyClass?: string;
  bodyStyle: CSSProperties;
  /** diagonal light streak — glossy vinyl */
  gloss?: boolean;
  /** paper grain opacity (default 0.35; 0 disables) */
  noise?: number;
  /** faint handled-crease line */
  crease?: boolean;
  /** lifted corner */
  peel?: Peel;
  /** thermal-print fade toward the bottom */
  fade?: boolean;
  body: ReactNode;
};

/* ---------- tiny inline brand-inspired marks (not official assets) ---------- */

/** a logo PNG used as-is: die-cut sticker whose shadow hugs the image's own
    alpha contour — no tile, no border, no recoloring */
function LogoSticker({
  src,
  size,
}: {
  src: string;
  size: number;
}) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      draggable={false}
      style={{
        display: "block",
        filter:
          "drop-shadow(0 2px 3px rgba(27,27,24,0.22)) drop-shadow(0 7px 14px rgba(27,27,24,0.15))",
      }}
    />
  );
}

/* --------------------------------- stickers -------------------------------- */

/** price-gun label — the tiny accents of the composition */
const PRICE_STYLE: CSSProperties = {
  padding: "8px 12px",
  borderRadius: 3,
  backgroundColor: "#FBF7EA",
  border: "1px solid rgba(27,27,24,0.14)",
  boxShadow: "0 1px 2px rgba(27,27,24,0.1), 0 4px 10px rgba(27,27,24,0.12)",
};

function Price({ amount }: { amount: string }) {
  return (
    <span className="flex flex-col items-center gap-[3px] leading-none">
      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "#B4452A",
          whiteSpace: "nowrap",
        }}
      >
        {amount}
      </span>
      <span className="text-[8px] uppercase tracking-[0.14em] text-[rgba(27,27,24,0.55)]">
        per month
      </span>
    </span>
  );
}

// Art-directed composition, not a border scatter. Six hand-placed clusters on
// diagonals; a few pieces drift 25–35% into the page toward the copy; ~240px
// radius around the text stays clear. Sizes mix three weights (large 78–96,
// medium 52–64, tiny 44–48 + price tags) and no third piece shares a row or
// column with two others. Rotations are all distinct within −8°…+8°.
const STICKERS: StickerDef[] = [
  // cluster A — upper-left diagonal (large anchor + tiny + medium)
  {
    id: "spotify",
    left: "8%",
    top: "9%",
    rot: -6,
    in: 0.1,
    out: 0.55,
    noise: 0,
    bodyStyle: {},
    body: <LogoSticker src="/logos/spotify.png" size={96} />,
  },
  {
    id: "price-5",
    left: "17%",
    top: "21%",
    rot: 3,
    in: 0.7,
    out: 0.15,
    desktopOnly: true,
    noise: 0.4,
    bodyStyle: PRICE_STYLE,
    body: <Price amount="$5.99" />,
  },
  {
    id: "audible",
    left: "3%",
    top: "28%",
    rot: -1.5,
    in: 0.85,
    out: 0.4,
    desktopOnly: true,
    noise: 0,
    bodyStyle: {},
    body: <LogoSticker src="/logos/audible.png" size={58} />,
  },

  // cluster B — top-center, price tag drifting toward the copy
  {
    id: "netflix",
    left: "57%",
    top: "7%",
    rot: 2.5,
    in: 0.5,
    out: 0.2,
    noise: 0,
    bodyStyle: {},
    body: <LogoSticker src="/logos/netflix.png" size={78} />,
  },
  {
    id: "applemusic",
    left: "67%",
    top: "19%",
    rot: 5,
    in: 0,
    out: 0.7,
    desktopOnly: true,
    noise: 0,
    bodyStyle: {},
    body: <LogoSticker src="/logos/applemusic.png" size={56} />,
  },
  {
    id: "price-9",
    left: "46%",
    top: "17%",
    rot: 1,
    in: 0.3,
    out: 0.9,
    noise: 0.4,
    crease: true,
    bodyStyle: PRICE_STYLE,
    body: <Price amount="$9.99" />,
  },

  // cluster C — right side, canva pushes 30% into the page
  {
    id: "youtube",
    left: "87%",
    top: "13%",
    rot: -8,
    in: 0.6,
    out: 0.05,
    noise: 0,
    bodyStyle: {},
    body: <LogoSticker src="/logos/youtube.png" size={64} />,
  },
  {
    id: "paywall",
    left: "78%",
    top: "25%",
    rot: -3,
    in: 0.25,
    out: 0.5,
    desktopOnly: true,
    noise: 0,
    bodyStyle: {},
    body: <LogoSticker src="/logos/paywall.png" size={44} />,
  },
  {
    id: "canva",
    left: "70%",
    top: "33%",
    rot: -4,
    in: 0.4,
    out: 0.6,
    noise: 0,
    bodyStyle: {},
    body: <LogoSticker src="/logos/canva.png" size={88} />,
  },
  {
    id: "microsoft",
    left: "92%",
    top: "41%",
    rot: 2,
    in: 0.45,
    out: 0.65,
    desktopOnly: true,
    noise: 0,
    bodyStyle: {},
    body: <LogoSticker src="/logos/microsoft.png" size={52} />,
  },
  {
    id: "subscription",
    left: "75%",
    top: "49%",
    rot: 7,
    in: 0.05,
    out: 0.95,
    desktopOnly: true,
    noise: 0,
    bodyStyle: {},
    body: <LogoSticker src="/logos/subscription.png" size={46} />,
  },

  // cluster D — bottom-right diagonal
  {
    id: "appletv",
    left: "85%",
    top: "63%",
    rot: 6,
    in: 0.65,
    out: 0.3,
    desktopOnly: true,
    noise: 0,
    bodyStyle: {},
    body: <LogoSticker src="/logos/appletv.png" size={62} />,
  },
  {
    id: "lyft",
    left: "77%",
    top: "74%",
    rot: -2.5,
    in: 0.9,
    out: 0.55,
    desktopOnly: true,
    noise: 0,
    bodyStyle: {},
    body: <LogoSticker src="/logos/lyft.png" size={48} />,
  },
  {
    id: "price",
    left: "89%",
    top: "81%",
    rot: 6.5,
    in: 0.15,
    out: 0.45,
    noise: 0.4,
    crease: true,
    bodyStyle: PRICE_STYLE,
    body: <Price amount="$19.99" />,
  },
  {
    id: "adobe",
    left: "68%",
    top: "85%",
    rot: -4.5,
    in: 0.45,
    out: 0.15,
    desktopOnly: true,
    noise: 0,
    bodyStyle: {},
    body: <LogoSticker src="/logos/adobe.png" size={58} />,
  },

  // cluster E — bottom center-left, hbo drifting toward the copy
  {
    id: "prime",
    left: "55%",
    top: "80%",
    rot: -1,
    in: 0.75,
    out: 1,
    desktopOnly: true,
    noise: 0,
    bodyStyle: {},
    body: <LogoSticker src="/logos/amazonprime.png" size={56} />,
  },
  {
    id: "price-12",
    left: "43%",
    top: "84%",
    rot: -2,
    in: 0.5,
    out: 0.65,
    desktopOnly: true,
    noise: 0.4,
    crease: true,
    bodyStyle: PRICE_STYLE,
    body: <Price amount="$12.99" />,
  },
  {
    id: "doordash",
    left: "23%",
    top: "81%",
    rot: 4,
    in: 0.55,
    out: 0.75,
    noise: 0,
    bodyStyle: {},
    body: <LogoSticker src="/logos/doordash.png" size={60} />,
  },
  {
    id: "hbo",
    left: "33%",
    top: "70%",
    rot: -6.5,
    in: 0.35,
    out: 0.85,
    desktopOnly: true,
    noise: 0,
    bodyStyle: {},
    body: <LogoSticker src="/logos/hbo.png" size={62} />,
  },

  // cluster F — left-mid, disney pulls 26% into the page toward the copy
  {
    id: "disney",
    left: "26%",
    top: "41%",
    rot: 7.5,
    in: 0.75,
    out: 0.5,
    noise: 0,
    bodyStyle: {},
    body: <LogoSticker src="/logos/disneyplus.png" size={84} />,
  },
  {
    id: "instacart",
    left: "8%",
    top: "53%",
    rot: 1.5,
    in: 0.2,
    out: 0.8,
    noise: 0,
    bodyStyle: {},
    body: <LogoSticker src="/logos/instacart.png" size={78} />,
  },
  {
    id: "price-29",
    left: "16%",
    top: "64%",
    rot: -5.5,
    in: 0.8,
    out: 0.3,
    noise: 0.4,
    crease: true,
    bodyStyle: PRICE_STYLE,
    body: <Price amount="$29.99" />,
  },
  {
    id: "cancel",
    left: "12%",
    top: "75%",
    rot: -7,
    in: 0.95,
    out: 0.1,
    noise: 0,
    bodyStyle: {},
    body: <LogoSticker src="/logos/cancel.png" size={44} />,
  },
];

/* ------------------------------ imperfections ------------------------------ */

function PeelCorner({ peel, radius }: { peel: Peel; radius: number }) {
  const base: CSSProperties = {
    position: "absolute",
    width: 15,
    height: 15,
    pointerEvents: "none",
  };
  const variants: Record<Peel, CSSProperties> = {
    br: {
      ...base,
      right: -1,
      bottom: -1,
      clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
      background:
        "linear-gradient(315deg, rgba(255,255,255,0.95) 10%, rgba(214,207,191,0.9) 45%, rgba(27,27,24,0.2) 100%)",
      filter: "drop-shadow(-2px -2px 2px rgba(27,27,24,0.16))",
      borderBottomRightRadius: radius,
    },
    tr: {
      ...base,
      right: -1,
      top: -1,
      clipPath: "polygon(0 0, 100% 0, 100% 100%)",
      background:
        "linear-gradient(225deg, rgba(255,255,255,0.95) 10%, rgba(214,207,191,0.9) 45%, rgba(27,27,24,0.2) 100%)",
      filter: "drop-shadow(-2px 2px 2px rgba(27,27,24,0.16))",
      borderTopRightRadius: radius,
    },
    bl: {
      ...base,
      left: -1,
      bottom: -1,
      clipPath: "polygon(0 0, 100% 100%, 0 100%)",
      background:
        "linear-gradient(45deg, rgba(255,255,255,0.95) 10%, rgba(202,183,132,0.9) 45%, rgba(27,27,24,0.2) 100%)",
      filter: "drop-shadow(2px -2px 2px rgba(27,27,24,0.16))",
      borderBottomLeftRadius: radius,
    },
  };
  return <span aria-hidden="true" style={variants[peel]} />;
}

/* --------------------------------- layer ----------------------------------- */

export default function StickerLayer() {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      {STICKERS.map((s) => {
        const radius =
          typeof s.bodyStyle.borderRadius === "number"
            ? s.bodyStyle.borderRadius
            : 12;
        return (
          <div
            key={s.id}
            className={`sub-sticker absolute opacity-0 will-change-transform ${
              s.desktopOnly ? "hidden md:block" : ""
            }`}
            style={{
              left: s.left,
              top: s.top,
              transform: `rotate(${s.rot}deg)`,
            }}
            data-in={s.in}
            data-out={s.out}
          >
            <div
              className={`relative flex items-center justify-center ${
                s.bodyClass ?? ""
              }`}
              style={{
                ...s.bodyStyle,
                ...(s.fade
                  ? {
                      maskImage:
                        "linear-gradient(180deg, #000 55%, rgba(0,0,0,0.72) 100%)",
                      WebkitMaskImage:
                        "linear-gradient(180deg, #000 55%, rgba(0,0,0,0.72) 100%)",
                    }
                  : null),
              }}
            >
              {s.body}
              {/* paper / vinyl grain */}
              {(s.noise ?? 0.35) > 0 && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    ...NOISE,
                    opacity: s.noise ?? 0.35,
                    borderRadius: s.bodyStyle.borderRadius,
                  }}
                />
              )}
              {/* glossy vinyl light streak */}
              {s.gloss && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    borderRadius: s.bodyStyle.borderRadius,
                    background:
                      "linear-gradient(115deg, transparent 32%, rgba(255,255,255,0.34) 43%, rgba(255,255,255,0.07) 52%, transparent 62%)",
                  }}
                />
              )}
              {/* faint handled crease */}
              {s.crease && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    borderRadius: s.bodyStyle.borderRadius,
                    background:
                      "linear-gradient(108deg, transparent 44%, rgba(255,255,255,0.3) 47%, rgba(27,27,24,0.06) 50%, transparent 54%)",
                  }}
                />
              )}
              {s.peel && <PeelCorner peel={s.peel} radius={radius} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
