import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { SphereScreen } from "@/sphere/components/SphereScreen";
import { PrimaryButton, PhoneField, Eyebrow } from "@/sphere/ui";
import { cn } from "@/lib/utils";
import { validateNanp } from "@/mutual/phone/nanp";

interface ManualSearch {
  ig?: number;
  focus?: string;
  prefilled?: number;
}

export const Route = createFileRoute("/_app/add/manual")({
  validateSearch: (search): ManualSearch => ({
    ig: search.ig ? 1 : undefined,
    focus: typeof search.focus === "string" ? search.focus : undefined,
    prefilled: search.prefilled ? 1 : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Add by number — sphere" },
      { name: "description", content: "Type a phone number. Optionally add their Instagram." },
    ],
  }),
  component: ManualAdd,
});

const DRAFT_KEY = "sphere.addDraft";

function readDraft() {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return { phone: "", ig: "" };
    return JSON.parse(raw) as { phone: string; ig: string };
  } catch { return { phone: "", ig: "" }; }
}

function writeDraft(d: { phone: string; ig: string }) {
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch {}
}

function ManualAdd() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/_app/add/manual" });
  const draft = readDraft();
  const [phone, setPhone] = useState(draft.phone);
  const [ig, setIg] = useState(draft.ig);

  const cleanedIg = ig.replace(/^@/, "").trim().toLowerCase();
  const phoneCheck = validateNanp(phone);
  const validIg = cleanedIg ? /^[a-z0-9._]{1,30}$/.test(cleanedIg) : true;
  const canContinue = phoneCheck.ok && validIg;
  const phoneError = phone.length > 0 && !phoneCheck.ok ? phoneCheck.message : "";

  function next() {
    if (!canContinue) return;
    writeDraft({ phone, ig: cleanedIg });
    navigate({ to: "/add/confirm" as any });
  }

  return (
    <SphereScreen>
      <div className="flex items-center justify-between px-6 pt-12 pb-2">
        <button
          onClick={() => navigate({ to: "/add" })}
          className="text-ink/80 text-[18px] -ml-1 px-2"
          aria-label="Back"
        >
          ←
        </button>
        <div className="font-serif italic text-[18px]">sphere</div>
        <button
          onClick={() => navigate({ to: "/home" })}
          className="text-mute text-[14px]"
        >
          Cancel
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-4" data-scroll>
        <Eyebrow>Add to your sphere</Eyebrow>
        <h1 className="mt-2 font-serif italic text-[36px] leading-[1.04] tracking-tight">
          Who is it?
        </h1>
        <p className="mt-3 text-[14px] text-mute">
          Hashed on device. We never store the raw values.
        </p>

        <div className="mt-7 space-y-4">
          <div>
            <Eyebrow className="mb-2">Phone</Eyebrow>
            <PhoneField
              value={phone}
              onChange={setPhone}
              autoFocus={search.focus !== "ig"}
            />
            {search.prefilled && (
              <div className="mt-1 text-[12px] text-mute">From your contacts.</div>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Eyebrow>Instagram (optional)</Eyebrow>
              <span
                className="rounded-full bg-ink text-paper px-2 h-5 text-[10px] font-mono uppercase inline-flex items-center"
                style={{ letterSpacing: "0.16em" }}
              >
                + 2× odds
              </span>
            </div>
            <div
              className={cn(
                "flex items-center gap-2 rounded-2xl bg-white border border-line",
                "h-16 px-4",
              )}
            >
              <span className="font-sans text-[17px] text-mute">@</span>
              <input
                value={ig}
                onChange={(e) => setIg(e.target.value)}
                placeholder="theirhandle"
                autoFocus={search.focus === "ig" || search.ig === 1}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="flex-1 bg-transparent font-sans text-[17px] text-ink placeholder:text-mute outline-none border-0"
              />
            </div>
            {ig && !validIg && (
              <div className="mt-2 text-[12px] text-danger">
                Letters, numbers, dots and underscores only.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 pb-8 pt-4">
        <PrimaryButton onClick={next} disabled={!canContinue}>
          Continue
        </PrimaryButton>
      </div>
    </SphereScreen>
  );
}
