// A tiny, fully static stand-in for the live ADK agent when VITE_CHAT_ENABLED
// is "false" (see backend.ts) — no network call, no LLM, just a few keyword
// rules against the real 2026 results. Deterministic: the same question
// (or follow-up) always gets the same answer, since it's a pure function of
// the latest message alone.

const FINAL =
  "Spain won the 2026 World Cup, beating Argentina 1–0 after extra time in the final.";
const THIRD_PLACE = "England beat France 6–4 to take third place.";
const SEMIFINALS =
  "In the semifinals, Spain beat France 2–0 and Argentina beat England 2–1.";
const FALLBACK =
  "Live chat's off since the 2026 World Cup is over — I can only answer a few basics here, like the final, third place, or the semifinals.";

const RULES: { test: RegExp; reply: string }[] = [
  { test: /semi[- ]?final/i, reply: SEMIFINALS },
  { test: /third[- ]place|3rd place|bronze/i, reply: THIRD_PLACE },
  { test: /\bfinal\b|champion|who won|winner/i, reply: FINAL },
];

export function answerOffline(message: string): string {
  return RULES.find((rule) => rule.test.test(message))?.reply ?? FALLBACK;
}
