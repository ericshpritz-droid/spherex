// Word banks for the mad-lib compliment composer.
// Kept small and curated — the constraint is the charm.

export const FRAMES = [
  { id: "smile", template: "Your smile is {adv} {adj}.", label: "Their smile" },
  { id: "energy", template: "You carry yourself {adv} {adj}.", label: "How they carry themselves" },
  { id: "mind", template: "The way you think is {adv} {adj}.", label: "How they think" },
  { id: "laugh", template: "Your laugh is {adv} {adj}.", label: "Their laugh" },
  { id: "presence", template: "Being near you feels {adv} {adj}.", label: "Their presence" },
] as const;

export const ADVERBS = [
  "quietly",
  "unreasonably",
  "genuinely",
  "dangerously",
  "softly",
  "completely",
  "annoyingly",
  "honestly",
] as const;

export const ADJECTIVES = [
  "magnetic",
  "disarming",
  "lovely",
  "rare",
  "steady",
  "kind",
  "electric",
  "warm",
  "sharp",
] as const;

export type FrameId = typeof FRAMES[number]["id"];

export interface ComplimentDraft {
  frameId: FrameId;
  adverb: string;
  adjective: string;
}

export function renderCompliment(draft: ComplimentDraft): string {
  const frame = FRAMES.find((f) => f.id === draft.frameId) ?? FRAMES[0];
  return frame.template
    .replace("{adv}", draft.adverb)
    .replace("{adj}", draft.adjective);
}

export const DRAFT_KEY = "sphere.addDraft";
export const COMPLIMENT_KEY = "sphere.complimentDraft";
