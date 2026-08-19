/**
 * Telnyx spend breakdown.
 *
 *   npm run costs           → last 30 days
 *   npm run costs -- 60     → last 60 days (queried in 31-day chunks)
 *
 * Shows current balance, cost split by direction, the per-day trail, and how
 * many message *parts* you're paying for. Parts are the thing to watch: one
 * emoji flips a message to UCS-2 encoding, which halves the characters per
 * segment and can silently double the price of every send.
 */
process.loadEnvFile(".env.local");

const KEY = process.env.TELNYX_API_KEY;
if (!KEY) {
  console.error("TELNYX_API_KEY missing from .env.local");
  process.exit(1);
}

const DAYS = Number(process.argv[2]) || 30;
const API = "https://api.telnyx.com/v2";
const money = (n: number) => `$${n.toFixed(4)}`;

async function tx(path: string, params?: Record<string, string>) {
  const url = new URL(API + path);
  for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${KEY}` } });
  if (!res.ok) throw new Error(`${path} → ${res.status} ${await res.text()}`);
  return res.json();
}

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Telnyx caps a usage query at 31 days, so walk the range in chunks. */
function windows(days: number) {
  const out: [string, string][] = [];
  let end = new Date();
  end.setDate(end.getDate() + 1);
  let remaining = days;
  while (remaining > 0) {
    const span = Math.min(remaining, 30);
    const start = new Date(end);
    start.setDate(start.getDate() - span);
    out.unshift([iso(start), iso(end)]);
    end = start;
    remaining -= span;
  }
  return out;
}

type Row = Record<string, string | number | null>;

async function usage(from: string, to: string, dimensions: string) {
  const d = await tx("/usage_reports", {
    product: "messaging",
    start_date: `${from}T00:00:00Z`,
    end_date: `${to}T00:00:00Z`,
    dimensions,
    metrics: "cost,count,parts,customer_carrier_fee",
  });
  return (d.data ?? []) as Row[];
}

async function main() {
  const bal = (await tx("/balance")).data;
  console.log(`\n  balance ${bal.balance} ${bal.currency}   credit limit ${bal.credit_limit}`);
  console.log(`  (a $0.00 credit limit means Telnyx hard-stops sending at zero)\n`);

  const chunks = windows(DAYS);
  const byDir: Row[] = [];
  const byDay: Row[] = [];
  for (const [f, t] of chunks) {
    byDir.push(...(await usage(f, t, "direction,message_type")));
    byDay.push(...(await usage(f, t, "date,direction")));
  }

  const num = (r: Row, k: string) => Number(r[k] ?? 0);

  console.log(`  ── by direction (last ${DAYS} days) ──`);
  let cost = 0, fee = 0, count = 0, parts = 0;
  for (const r of byDir) {
    cost += num(r, "cost"); fee += num(r, "customer_carrier_fee");
    count += num(r, "count"); parts += num(r, "parts");
    console.log(
      `  ${String(r.direction).padEnd(9)} ${String(r.count).padStart(4)} msgs  ` +
      `${String(r.parts).padStart(4)} parts  ${money(num(r, "cost")).padStart(9)}  ` +
      `(carrier ${money(num(r, "customer_carrier_fee"))})`
    );
  }
  if (!byDir.length) console.log("  no messaging usage in this window");

  console.log(`\n  ── per day ──`);
  const days = new Map<string, number>();
  for (const r of byDay) {
    const k = String(r.date).slice(0, 10);
    days.set(k, (days.get(k) ?? 0) + num(r, "cost"));
  }
  for (const [d, c] of [...days.entries()].sort()) {
    const bar = "█".repeat(Math.max(1, Math.round(c / 0.005)));
    console.log(`  ${d}  ${money(c).padStart(9)}  ${bar}`);
  }
  if (!days.size) console.log("  (nothing)");

  console.log(`\n  ── totals ──`);
  console.log(`  messages     ${count}`);
  console.log(`  parts billed ${parts}`);
  console.log(`  total cost   ${money(cost)}  (of which carrier fees ${money(fee)})`);

  if (count > 0) {
    const per = parts / count;
    console.log(`  avg parts/msg ${per.toFixed(2)}`);
    if (per > 1.15) {
      const waste = cost * (1 - 1 / per);
      console.log(
        `\n  ⚠ paying for ${per.toFixed(2)} segments per message. Anything over 1.0\n` +
        `    is usually an emoji forcing UCS-2 (70 chars/segment instead of 160),\n` +
        `    or copy running past the limit. Trimming to 1 part would have saved\n` +
        `    about ${money(waste)} over this window.`
      );
    }
  }
  console.log();
}

main().catch((e) => { console.error(e.message); process.exit(1); });
