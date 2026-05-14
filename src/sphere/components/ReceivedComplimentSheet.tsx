import { useState } from "react";
import { ComplimentBubble, PrimaryButton, GhostButton, Eyebrow } from "@/sphere/ui";
import { cn } from "@/lib/utils";

type Person = { id: string; name?: string; unknown?: boolean };

export function ReceivedComplimentSheet({
  body,
  candidates,
  onGuess,
  onKeep,
  onClose,
}: {
  body: string;
  candidates: Person[];
  onGuess: (id: string | null) => void;
  onKeep: () => void;
  onClose: () => void;
}) {
  const [guessing, setGuessing] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full sm:max-w-md bg-paper rounded-t-3xl sm:rounded-3xl border border-line shadow-xl px-6 pt-7 pb-8">
        <div className="mx-auto h-1 w-10 rounded-full bg-[#D8D5D0]" />

        {!guessing ? (
          <>
            <div className="mt-5">
              <Eyebrow>Someone thought of you</Eyebrow>
            </div>
            <h2 className="mt-2 font-serif italic text-[28px] leading-[1.06] tracking-tight">
              An anonymous note.
            </h2>
            <div className="mt-5">
              <ComplimentBubble body={body} caption="From someone · anonymous" />
            </div>
            <p className="mt-5 text-[13px] text-mute leading-relaxed">
              You can take a guess at who it is — but you only get one. Or just
              keep it as a small bright thing.
            </p>
            <div className="mt-6 space-y-3">
              <PrimaryButton onClick={() => setGuessing(true)}>
                See who it might be
              </PrimaryButton>
              <GhostButton onClick={onKeep}>Just keep it</GhostButton>
            </div>
          </>
        ) : (
          <>
            <div className="mt-5">
              <Eyebrow>One guess</Eyebrow>
            </div>
            <h2 className="mt-2 font-serif italic text-[28px] leading-[1.06] tracking-tight">
              Pick the person.
            </h2>
            <p className="mt-3 text-[13px] text-mute">
              If you guess right and they picked you back, it goes mutual.
            </p>

            <div className="mt-5 space-y-2 max-h-[40vh] overflow-y-auto">
              {candidates.length === 0 ? (
                <div className="rounded-2xl border border-[#D8D5D0] p-4 text-[13px] text-mute font-serif italic">
                  No one in your sphere yet to guess from.
                </div>
              ) : (
                candidates.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setPicked(c.id)}
                    className={cn(
                      "w-full text-left rounded-2xl border px-4 py-3 transition-colors",
                      picked === c.id
                        ? "border-ink bg-ink text-paper"
                        : "border-[#D8D5D0] hover:border-ink/50",
                    )}
                  >
                    <div className="font-serif text-[18px] leading-tight">
                      {c.unknown ? "Sealed pick" : c.name || "Unnamed"}
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="mt-6 space-y-3">
              <PrimaryButton
                onClick={() => onGuess(picked)}
                disabled={!picked}
              >
                Lock my guess
              </PrimaryButton>
              <GhostButton onClick={() => setGuessing(false)}>Back</GhostButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
