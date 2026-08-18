// Nudge is a subscription reminder bot, not a support service — but it
// accepts free-text SMS, so someone in distress can and eventually will text
// it. Answering that with `didnt catch that. text "help"` is the wrong thing
// to put in front of a person having the worst night of their life.
//
// This is a deliberately narrow keyword screen, checked before anything is
// sent to an LLM. It aims to catch clear cases; it is not a classifier and
// does not try to be. False positives just surface a resource line, which is
// a cheap and harmless outcome.
const CRISIS_PATTERNS: RegExp[] = [
  /\bkill(ing)?\s+my ?self\b/i,
  /\bkms\b/i,
  /\bsuicid(e|al)\b/i,
  /\bend(ing)?\s+(my|it)\s+(life|all)\b/i,
  /\bwant\s+to\s+die\b/i,
  /\bdon'?t\s+want\s+to\s+(live|be here)\b/i,
  /\bhurt(ing)?\s+my ?self\b/i,
  /\bself[-\s]?harm\b/i,
  /\bno\s+reason\s+to\s+live\b/i,
];

export function isCrisisMessage(text: string): boolean {
  return CRISIS_PATTERNS.some((p) => p.test(text));
}

export function crisisResponse(): string {
  return [
    "hey, i'm just a bot that tracks free trials, so i'm not the right place for this. but i don't want to leave you hanging.",
    "",
    "if you're in the US you can call or text 988 (suicide & crisis lifeline) any time, or text HOME to 741741 for the crisis text line. if you're in immediate danger please call 911.",
    "",
    "please talk to someone. you deserve that.",
  ].join("\n");
}
