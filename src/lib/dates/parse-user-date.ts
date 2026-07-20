// Parse a user's SMS date-response into an ISO date. Handles:
//   "aug 15", "august 15", "august 15 2026"
//   "8/15", "8/15/26", "8-15", "2026-08-15"
//   "14 days", "in 14 days", "in two weeks", "next week"
//   "next friday", "tomorrow"
//   "not a trial" / "no" / "cancelled"      → { kind: "cancel" }
//   "yes idk" / "not sure" / "idk"           → { kind: "unknown" }
//   anything else                            → { kind: "unparseable" }

export type DateParseResult =
  | { kind: "date"; date: string /* ISO YYYY-MM-DD */ }
  | { kind: "cancel" /* user says it isn't a real trial */ }
  | { kind: "unknown" /* user doesn't know the date */ }
  | { kind: "unparseable" };

const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

const WORD_NUMS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, twenty: 20, thirty: 30,
};

const DAYS: Record<string, number> = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tues: 2, tuesday: 2,
  wed: 3, wednesday: 3,
  thu: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
};

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** clamp to a future date within 1 year; returns null if impossible */
function assumeYearFuture(month: number, day: number, year?: number): string | null {
  const now = new Date();
  const y = year ?? now.getFullYear();
  const d = new Date(y, month, day);
  if (isNaN(d.getTime())) return null;
  if (!year && d < now) {
    // if the parsed date already passed this year, roll to next year
    d.setFullYear(y + 1);
  }
  const yearOut = new Date();
  yearOut.setFullYear(now.getFullYear() + 1);
  yearOut.setMonth(yearOut.getMonth() + 1); // small buffer
  if (d > yearOut) return null;
  return iso(d);
}

export function parseUserDate(input: string): DateParseResult {
  const t = input.trim().toLowerCase();
  if (!t) return { kind: "unparseable" };

  // ---- "no" / "not a trial" ---------------------------------------------
  if (/\b(no|nope|not a trial|not trial|cancel(l)?ed|nvm|nevermind|delete)\b/.test(t)) {
    return { kind: "cancel" };
  }

  // ---- "yes idk" / "not sure" / "dunno" ---------------------------------
  if (
    /\b(idk|i dont know|i don't know|not sure|dunno|dont know|don't know|no idea)\b/.test(t)
  ) {
    return { kind: "unknown" };
  }

  // ---- "tomorrow" -------------------------------------------------------
  if (/^tomorrow\b/.test(t)) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return { kind: "date", date: iso(d) };
  }
  if (/^today\b/.test(t)) {
    return { kind: "date", date: iso(new Date()) };
  }

  // ---- "in N days" / "N days" / "in a week" / "in two weeks" ------------
  const relMatch = t.match(
    /(?:^|\bin\s+)(\d+|a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|twenty|thirty)\s*(day|days|week|weeks|month|months)\b/
  );
  if (relMatch) {
    const rawNum = relMatch[1];
    const unit = relMatch[2];
    const n =
      rawNum === "a" || rawNum === "an" ? 1 : parseInt(rawNum, 10) || WORD_NUMS[rawNum] || 0;
    if (n > 0) {
      const d = new Date();
      if (unit.startsWith("day")) d.setDate(d.getDate() + n);
      else if (unit.startsWith("week")) d.setDate(d.getDate() + n * 7);
      else if (unit.startsWith("month")) d.setMonth(d.getMonth() + n);
      return { kind: "date", date: iso(d) };
    }
  }

  // ---- "next friday" ----------------------------------------------------
  const nextDayMatch = t.match(/next\s+(sun(?:day)?|mon(?:day)?|tue(?:s|sday)?|wed(?:nesday)?|thu(?:rs|rsday)?|fri(?:day)?|sat(?:urday)?)\b/);
  if (nextDayMatch) {
    const target = DAYS[nextDayMatch[1]];
    if (target !== undefined) {
      const now = new Date();
      const delta = ((target - now.getDay() + 7) % 7) || 7;
      const d = new Date();
      d.setDate(d.getDate() + delta);
      return { kind: "date", date: iso(d) };
    }
  }

  // ---- "aug 15" / "august 15" / "august 15 2026" -------------------------
  const monthDayMatch = t.match(
    /\b(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?\b/
  );
  if (monthDayMatch) {
    const month = MONTHS[monthDayMatch[1]];
    const day = parseInt(monthDayMatch[2], 10);
    const year = monthDayMatch[3] ? parseInt(monthDayMatch[3], 10) : undefined;
    const parsed = assumeYearFuture(month, day, year);
    if (parsed) return { kind: "date", date: parsed };
  }

  // ---- ISO "2026-08-15" (check BEFORE slash regex — otherwise the slash
  //      regex steals "08-15" from "2027-08-15" and drops the year) --------
  const isoMatch = t.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (isoMatch) {
    const d = new Date(isoMatch[0]);
    if (!isNaN(d.getTime()) && d > new Date()) {
      return { kind: "date", date: iso(d) };
    }
  }

  // ---- "8/15", "8/15/26", "8-15" ----------------------------------------
  const slashMatch = t.match(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/);
  if (slashMatch) {
    const month = parseInt(slashMatch[1], 10) - 1;
    const day = parseInt(slashMatch[2], 10);
    let year = slashMatch[3] ? parseInt(slashMatch[3], 10) : undefined;
    if (year !== undefined && year < 100) year += 2000;
    const parsed = assumeYearFuture(month, day, year);
    if (parsed) return { kind: "date", date: parsed };
  }

  return { kind: "unparseable" };
}
