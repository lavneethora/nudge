export type FieldPill = {
  id: string;
  spacer?: undefined;
  color: string;
  textColor: string;
  /** horizontal padding in px per side — the only per-pill size variation */
  padX: number;
  /** 0..1 — when during the fill phase this pill appears */
  revealOrder: number;
  /** scatter drift, in vw/vh units and degrees */
  dx: number;
  dy: number;
  rot: number;
  /** 0..1 — when during the scatter phase this pill leaves */
  scatterOrder: number;
};

/** invisible placeholder in the center row that the hero pill overlays */
export type FieldSpacer = { id: string; spacer: true; width: number };
export type FieldItem = FieldPill | FieldSpacer;

export type FieldRow = {
  id: string;
  /** px; negative so the first pill sits half-cut at the viewport edge */
  offset: number;
  center: boolean;
  items: FieldItem[];
};

// Virio-matched palette. Light tiles get ink text, dark tiles get cream text.
// Cream tiles intentionally blend into the page background, like the reference.
const CREAM = "#F9F5EC";
const INK = "#1B1B18";
const PALETTE: Array<{ bg: string; text: string }> = [
  { bg: CREAM, text: INK }, // cream
  { bg: "#D7B86A", text: INK }, // mustard
  { bg: "#E65A20", text: CREAM }, // orange
  { bg: "#8F8B1D", text: CREAM }, // olive
  { bg: "#294E56", text: CREAM }, // dark teal
  { bg: "#5F9098", text: CREAM }, // light teal
  { bg: "#1D1D1A", text: CREAM }, // near black
];

/** Deterministic PRNG so the server render matches the client render. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates rows of content-sized pills for a wrapping packed layout.
 * Rows deliberately hold more pills than any viewport can show — the hero
 * container clips the overflow, so no measurement is needed and the server
 * render always matches the client.
 */
export function generatePillField(opts: {
  rows: number;
  perRow: number;
  seed: number;
  padMin: number;
  padMax: number;
  /** width reserved in the middle row for the hero's focal pill */
  spacerWidth: number;
  /** px; roughly one pill pitch — each row starts anywhere within this */
  offsetMax: number;
}): FieldRow[] {
  const { rows, perRow, seed, padMin, padMax, spacerWidth, offsetMax } = opts;
  const rand = mulberry32(seed);
  // Math.cos/sin can differ by 1 ulp between server and browser V8,
  // which breaks hydration on data attributes — round everything.
  const r4 = (n: number) => Math.round(n * 10000) / 10000;
  const centerRow = Math.floor(rows / 2);
  const field: FieldRow[] = [];

  // track neighbor colors so no pill repeats its left or upper neighbor —
  // keeps the field feeling scattered instead of striped
  let aboveColors: number[] = [];
  let prevOffset = Infinity;

  for (let row = 0; row < rows; row++) {
    const items: FieldItem[] = [];
    const rowColors: number[] = [];
    let leftIdx = -1;

    const randPad = () => Math.round(padMin + rand() * (padMax - padMin));

    const addPill = (i: number, padX: number) => {
      let idx = Math.floor(rand() * PALETTE.length);
      for (
        let tries = 0;
        tries < 4 && (idx === leftIdx || idx === (aboveColors[i] ?? -1));
        tries++
      ) {
        idx = Math.floor(rand() * PALETTE.length);
      }
      leftIdx = idx;
      rowColors[i] = idx;
      const angle = rand() * Math.PI * 2;
      const dist = 18 + rand() * 45;
      items.push({
        id: `p-${row}-${i}`,
        color: PALETTE[idx].bg,
        textColor: PALETTE[idx].text,
        padX,
        // top rows land first, like the reference fill
        revealOrder: r4(Math.min(1, (row / rows) * 0.55 + rand() * 0.45)),
        dx: r4(Math.cos(angle) * dist),
        dy: r4(Math.sin(angle) * dist),
        rot: r4((rand() - 0.5) * 16),
        scatterOrder: r4(rand()),
      });
    };

    if (row === centerRow) {
      // center row is justify-centered around an invisible spacer; the right
      // half mirrors the left half's paddings so the spacer stays dead-center
      const half = Math.ceil(perRow / 2);
      const pads: number[] = [];
      for (let i = 0; i < half; i++) {
        const p = randPad();
        pads.push(p);
        addPill(i, p);
      }
      items.push({ id: `p-${row}-spacer`, spacer: true, width: spacerWidth });
      for (let i = 0; i < half; i++) {
        addPill(half + 1 + i, pads[i]);
      }
      field.push({ id: `row-${row}`, offset: 0, center: true, items });
    } else {
      for (let i = 0; i < perRow; i++) {
        addPill(i, randPad());
      }
      // each row starts anywhere within a full pill pitch (negative, so the
      // first pill sits cut at the edge) and is forced away from the previous
      // row's offset — no implicit vertical columns can form
      let offset = -Math.round(rand() * offsetMax);
      for (
        let tries = 0;
        tries < 6 && Math.abs(offset - prevOffset) < offsetMax * 0.22;
        tries++
      ) {
        offset = -Math.round(rand() * offsetMax);
      }
      prevOffset = offset;
      field.push({ id: `row-${row}`, offset, center: false, items });
    }
    aboveColors = rowColors;
  }
  return field;
}
