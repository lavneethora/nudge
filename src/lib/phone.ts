export type NormalizeResult =
  | { ok: true; e164: string }
  | { ok: false; error: string };

// The Telnyx messaging profile is scoped to whitelisted_destinations: ["US"],
// and Telnyx resolves destinations by ISO country code. Puerto Rico (PR),
// US Virgin Islands (VI), Guam (GU), American Samoa (AS), N. Mariana (MP) and
// Canada (CA) are all separate ISO codes, so messages to them are rejected by
// Telnyx even though they share the +1 country code. Rather than accept a
// signup we can't actually deliver to, validate against the 50 states + DC up
// front and give the user a clear answer.
//
// NANP assigns a handful of new area codes each year — when one is added for a
// US state it needs adding here, otherwise those users get turned away. Source
// of truth: https://nationalnanpa.com/enas/geoAreaCodeNumberReport.do
const US_AREA_CODES = new Set([
  // AL, AK, AZ, AR
  "205","251","256","334","659","938","907","480","520","602","623","928",
  "327","479","501","870",
  // CA
  "209","213","279","310","323","341","350","369","408","415","424","442",
  "510","530","559","562","619","626","628","650","657","661","669","707",
  "714","747","760","805","818","820","831","837","840","858","909","916",
  "925","949","951",
  // CO, CT, DE, DC
  "303","719","720","970","983","203","475","860","959","302","202",
  // FL
  "239","305","321","324","352","386","407","448","561","645","656","689",
  "727","728","754","772","786","813","850","863","904","941","954",
  // GA, HI, ID
  "229","404","470","478","678","706","762","770","912","943","808","208","986",
  // IL
  "217","224","309","312","331","447","464","618","630","708","730","773",
  "779","815","847","861","872",
  // IN, IA, KS, KY
  "219","260","317","463","574","765","812","930","319","515","563","641",
  "712","316","620","785","913","270","364","502","606","859",
  // LA, ME, MD, MA
  "225","318","337","504","985","207","227","240","301","410","443","667",
  "339","351","413","508","617","774","781","857","978",
  // MI, MN, MS, MO
  "231","248","269","313","517","586","616","679","734","810","906","947",
  "989","218","320","507","612","651","763","924","952","228","601","662",
  "769","235","314","417","557","573","636","660","816","975",
  // MT, NE, NV, NH, NJ, NM
  "406","308","402","531","702","725","775","603","201","551","609","640",
  "732","848","856","862","908","973","505","575",
  // NY
  "212","315","329","332","347","363","516","518","585","607","631","646",
  "680","716","718","838","845","914","917","929","934",
  // NC, ND
  "252","336","472","704","743","828","910","919","980","984","701",
  // OH, OK, OR
  "216","220","234","283","326","330","380","419","436","440","513","567",
  "614","740","937","405","539","572","580","918","458","503","541","971",
  // PA, RI, SC, SD
  "215","223","267","272","412","445","484","570","582","610","717","724",
  "814","835","878","401","803","839","843","854","864","605",
  // TN
  "423","615","629","731","865","901","931",
  // TX
  "210","214","254","281","325","346","361","409","430","432","469","512",
  "682","713","726","737","806","817","830","832","903","915","936","940",
  "945","956","972","979",
  // UT, VT, VA
  "385","435","801","802","276","434","540","571","686","703","757","804",
  "826","948",
  // WA, WV, WI, WY
  "206","253","360","425","509","564","304","681","262","274","353","414",
  "534","608","715","920","307",
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

  // Area code and exchange both must start 2-9 per the NANP
  if (!/^[2-9]\d\d$/.test(areaCode) || !/^[2-9]\d\d$/.test(exchange)) {
    return { ok: false, error: "Invalid phone number" };
  }

  if (!US_AREA_CODES.has(areaCode)) {
    return {
      ok: false,
      error: "Nudge only supports US numbers right now",
    };
  }

  return { ok: true, e164: `+1${national}` };
}
