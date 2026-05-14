// Mad-lib compliment composer — locked to spec.
// Sentence: "I want you to know that I think you are __ __."
// 4 adverb chips (last is "skip"), 8 adjective chips. Constraint is the charm.

export const SENTENCE_PREFIX = "I want you to know that I think you are";

export const ADVERBS = [
  { value: "Incredibly", label: "Incredibly" },
  { value: "So", label: "So" },
  { value: "Kinda", label: "Kinda" },
  { value: "", label: "— skip —" },
] as const;

export const ADJECTIVES = [
  "Beautiful",
  "Handsome",
  "Talented",
  "Stunning",
  "Radiant",
  "Brilliant",
  "Hilarious",
  "Captivating",
] as const;

export type AdverbValue = typeof ADVERBS[number]["value"];
export type AdjectiveValue = typeof ADJECTIVES[number];

export interface ComplimentDraft {
  adverb: AdverbValue;
  adjective: AdjectiveValue;
}

export function renderCompliment(draft: ComplimentDraft): string {
  const adv = draft.adverb ? `${draft.adverb} ` : "";
  return `${SENTENCE_PREFIX} ${adv}${draft.adjective}.`;
}

export const DRAFT_KEY = "sphere.addDraft";
export const COMPLIMENT_KEY = "sphere.complimentDraft";
