import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  PrimaryButton, GhostButton, Chip, PhoneField,
  IntentCard, ComplimentBubble, Sheet, Eyebrow,
} from "@/sphere/ui";

export const Route = createFileRoute("/sphere-preview")({
  component: PreviewPage,
});

function PreviewPage() {
  const [phone, setPhone] = useState("");
  const [chip, setChip] = useState("a");
  const [intent, setIntent] = useState<"r" | "c" | "b">("b");
  const [sheet, setSheet] = useState(false);

  return (
    <div className="min-h-screen bg-paper text-ink font-sans">
      <div className="mx-auto max-w-[420px] px-6 py-10 space-y-10">
        <header>
          <div className="font-serif italic text-[28px]">sphere</div>
          <Eyebrow className="mt-2">Phase 1 · Foundation Preview</Eyebrow>
        </header>

        <section className="space-y-3">
          <Eyebrow>Headline · Instrument Serif</Eyebrow>
          <h1 className="font-serif italic text-[44px] leading-[1.02] tracking-tight">
            There's someone you can't stop thinking about.
          </h1>
          <p className="text-[14px] text-mute">
            Body in Geist. Eyebrows in Geist Mono with 0.22em tracking.
          </p>
        </section>

        <section className="space-y-3">
          <Eyebrow>Buttons</Eyebrow>
          <PrimaryButton>Verify your number to start</PrimaryButton>
          <GhostButton>Maybe later</GhostButton>
        </section>

        <section className="space-y-3">
          <Eyebrow>Chips</Eyebrow>
          <div className="flex flex-wrap gap-2">
            {["A classmate", "A co-worker", "A family friend", "Your gym crush"].map((t, i) => {
              const id = String(i);
              return (
                <Chip key={id} on={chip === id} onClick={() => setChip(id)}>{t}</Chip>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <Eyebrow>Phone field</Eyebrow>
          <PhoneField value={phone} onChange={setPhone} />
        </section>

        <section className="space-y-3">
          <Eyebrow>Intent cards</Eyebrow>
          <IntentCard
            label="OPTION 01"
            title="Romantic only."
            body="Sealed unless they pick you back."
            selected={intent === "r"}
            onClick={() => setIntent("r")}
          />
          <IntentCard
            label="OPTION 02"
            title="Compliment only."
            body="Send a kind, anonymous note."
            selected={intent === "c"}
            onClick={() => setIntent("c")}
          />
          <IntentCard
            label="OPTION 03"
            title="Both."
            body="Romantic pick plus a compliment."
            badge="MOST POPULAR"
            inverted
            onClick={() => setIntent("b")}
          />
        </section>

        <section className="space-y-3">
          <Eyebrow>Compliment bubble</Eyebrow>
          <ComplimentBubble
            body={<>I want you to know that I think you are <em className="not-italic font-medium underline decoration-paper/40 underline-offset-4">incredibly radiant</em>.</>}
            caption="Anonymous · Today"
          />
        </section>

        <section className="space-y-3">
          <Eyebrow>Bottom sheet</Eyebrow>
          <GhostButton onClick={() => setSheet(true)}>Open sheet</GhostButton>
        </section>

        <div className="h-10" />
      </div>

      {/* Sheet rendered relative to a positioned wrapper for the preview */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="relative mx-auto h-full max-w-[420px]">
          <Sheet open={sheet} onClose={() => setSheet(false)}>
            <Eyebrow>SLOT 1 OF 3</Eyebrow>
            <h2 className="mt-2 font-serif italic text-[28px] leading-tight">
              Add someone to your sphere.
            </h2>
            <div className="mt-6 space-y-3">
              <PrimaryButton arrow={false}>Pick from Contacts</PrimaryButton>
              <GhostButton>Type a phone number</GhostButton>
              <GhostButton>Add their @handle</GhostButton>
            </div>
            <div className="mt-3 text-center">
              <button onClick={() => setSheet(false)} className="font-sans text-[14px] text-mute py-3">
                Cancel
              </button>
            </div>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
