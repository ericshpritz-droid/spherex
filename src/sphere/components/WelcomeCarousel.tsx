import { useEffect, useState } from "react";
import avatar1 from "@/assets/avatar-mutual-1.png";
import avatar2 from "@/assets/avatar-mutual-2.png";

type Slide = {
  eyebrow: string;
  body: React.ReactNode;
  footer: string;
};

const SLIDES: Slide[] = [
  {
    eyebrow: "04 · Mutual",
    body: (
      <div className="flex flex-col items-center">
        <div className="flex -space-x-3">
          <img
            src={avatar1}
            alt=""
            width={56}
            height={56}
            loading="lazy"
            className="w-14 h-14 rounded-full object-cover bg-paper border-2 border-ink"
          />
          <img
            src={avatar2}
            alt=""
            width={56}
            height={56}
            loading="lazy"
            className="w-14 h-14 rounded-full object-cover bg-paper border-2 border-ink"
          />
        </div>
        <div className="mt-4 font-serif italic text-paper text-[20px] leading-[1.15] text-center">
          You both<br />picked each other.
        </div>
        <div className="mt-4 rounded-full bg-paper text-ink text-[11px] font-medium px-4 py-1.5">
          See details
        </div>
      </div>
    ),
    footer: "Both find out",
  },
  {
    eyebrow: "02 · Compliment",
    body: (
      <div className="flex flex-col items-center">
        <div
          className="font-mono text-[9px] uppercase text-paper/60"
          style={{ letterSpacing: "0.22em" }}
        >
          From · anonymous
        </div>
        <div className="mt-3 font-serif italic text-paper text-[17px] leading-[1.25] text-center max-w-[200px]">
          I think you are <span className="not-italic font-medium">incredibly radiant</span>.
        </div>
        <div className="mt-4 h-px w-12 bg-paper/20" />
        <div className="mt-3 font-mono text-[9px] uppercase text-paper/50" style={{ letterSpacing: "0.22em" }}>
          No reply possible
        </div>
      </div>
    ),
    footer: "Quiet brightness",
  },
  {
    eyebrow: "01 · Your sphere",
    body: (
      <div className="w-full flex flex-col gap-2">
        {[
          { i: "AP", l: "Alex P.", t: "Wait" },
          { i: "JL", l: "Jamie L.", t: "Wait" },
          { i: "KB", l: "Kai B.", t: "Wait" },
        ].map((row) => (
          <div
            key={row.i}
            className="flex items-center gap-3 rounded-xl bg-paper/8 border border-paper/15 px-3 py-2"
          >
            <div className="w-8 h-8 rounded-full bg-paper/15 grid place-items-center font-mono text-[10px] text-paper">
              {row.i}
            </div>
            <div className="flex-1 font-serif text-paper text-[14px]">{row.l}</div>
            <div
              className="font-mono text-[9px] uppercase text-paper/50"
              style={{ letterSpacing: "0.22em" }}
            >
              {row.t}
            </div>
          </div>
        ))}
      </div>
    ),
    footer: "Waiting for magic",
  },
];

export function WelcomeCarousel() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % SLIDES.length), 3200);
    return () => clearInterval(id);
  }, []);

  const slide = SLIDES[i];

  return (
    <div className="mt-6 select-none">
      <div className="mx-auto w-full max-w-[260px] aspect-[9/14] rounded-[28px] bg-ink p-5 flex flex-col overflow-hidden shadow-[0_18px_40px_-20px_rgba(0,0,0,0.45)]">
        <div
          className="font-mono text-[9px] uppercase text-paper/55"
          style={{ letterSpacing: "0.24em" }}
        >
          {slide.eyebrow}
        </div>
        <div
          key={i}
          className="flex-1 flex items-center justify-center animate-[wcFade_0.5s_ease-out]"
        >
          {slide.body}
        </div>
        <div
          className="text-center font-mono text-[9px] uppercase text-paper/45"
          style={{ letterSpacing: "0.24em" }}
        >
          {slide.footer}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5">
        {SLIDES.map((_, n) => (
          <button
            key={n}
            type="button"
            onClick={() => setI(n)}
            aria-label={`Show preview ${n + 1}`}
            className="block rounded-full transition-all"
            style={{
              width: n === i ? 18 : 6,
              height: 6,
              background: n === i ? "var(--color-ink, #0A0A0A)" : "rgba(10,10,10,0.22)",
              border: 0,
              padding: 0,
              cursor: "pointer",
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes wcFade {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
