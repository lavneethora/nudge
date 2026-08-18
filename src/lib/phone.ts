export type NormalizeResult =
  | { ok: true; e164: string }
  | { ok: false; error: string };

// Foreign Caribbean/Atlantic area codes that share the +1 country code but
// bill at premium international rates. These are the classic SMS-pumping
// targets: an attacker points signups at a number they revenue-share on and
// we pay the bill.
//
// Deliberately EXCLUDES US territories — Puerto Rico (787/939), US Virgin
// Islands (340), Guam (671), American Samoa (684), N. Mariana (670). Those
// are US citizens on US-rated numbers and are legitimate signups.
const BLOCKED_AREA_CODES = new Set([
  "242", // Bahamas
  "246", // Barbados
  "264", // Anguilla
  "268", // Antigua & Barbuda
  "284", // British Virgin Islands
  "345", // Cayman Islands
  "441", // Bermuda
  "473", // Grenada
  "649", // Turks & Caicos
  "664", // Montserrat
  "721", // Sint Maarten
  "758", // Saint Lucia
  "767", // Dominica
  "784", // Saint Vincent & the Grenadines
  "809", // Dominican Republic
  "829", // Dominican Republic
  "849", // Dominican Republic
  "868", // Trinidad & Tobago
  "869", // Saint Kitts & Nevis
  "876", // Jamaica
]);

export function normalizeToE164(phoneNumber: string): NormalizeResult {
  const digits = phoneNumber.replace(/\D/g, "");

  // NANP is exactly 10 digits, or 11 with the leading country code
  let national: string;
  if (digits.length === 10) {
    national = digits;
  } else if (digits.length === 11 && digits.startsWith("1")) {
    national = digits.slice(1);
  } else {
    return { ok: false, error: "Invalid phone number" };
  }

  const areaCode = national.slice(0, 3);
  const exchange = national.slice(3, 6);

  // Area code and exchange both must start 2-9 per the NANP; N11 codes
  // (411, 911, …) are service codes, not subscriber numbers.
  if (!/^[2-9]\d\d$/.test(areaCode) || !/^[2-9]\d\d$/.test(exchange)) {
    return { ok: false, error: "Invalid phone number" };
  }
  if (areaCode[1] === "1" && areaCode[2] === "1") {
    return { ok: false, error: "Invalid phone number" };
  }

  if (BLOCKED_AREA_CODES.has(areaCode)) {
    return { ok: false, error: "That area code isn't supported yet" };
  }

  return { ok: true, e164: `+1${national}` };
}
