import { useEffect, useMemo, useRef, useState } from "react";
import { SphereScreen } from "@/sphere/components/SphereScreen";
import { AvatarMono, initialsFromHash } from "@/sphere/components/AvatarMono";
import { PrimaryButton, GhostButton, Eyebrow, Sheet } from "@/sphere/ui";
// @ts-expect-error - JS module without types
import { CONTACTS } from "@/mutual/data";
type Contact = { name: string; phone: string; avatar?: string };
const ALL_CONTACTS = CONTACTS as Contact[];
import { formatPhone } from "@/mutual/brand.js";
import { contactsCapability, pickContacts, openAppSettings } from "@/mutual/native/contacts";
import { haptics } from "@/mutual/native/haptics";

type Item = { name: string; phone: string };

function extractPhones(text: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const re = /(\+?\d[\d\s().-]{8,}\d)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text || ""))) {
    let d = m[1].replace(/\D/g, "");
    if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
    if (d.length !== 10 || !/^[2-9]/.test(d)) continue;
    if (seen.has(d)) continue;
    seen.add(d);
    out.push(`(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`);
  }
  return out;
}

function normalizeManual(raw: string) {
  let d = String(raw).replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  return d.slice(0, 10);
}

export function SphereContacts({
  onBack,
  onPick,
}: {
  onBack: () => void;
  onPick: (phones: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [pickerSupported, setPickerSupported] = useState(false);
  const [pickerNative, setPickerNative] = useState(false);
  const [pickerBusy, setPickerBusy] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const [openSheet, setOpenSheet] = useState<null | "manual" | "paste">(null);
  const [manualPhone, setManualPhone] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [confirmList, setConfirmList] = useState<Item[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const cap = contactsCapability();
    setPickerSupported(cap.available);
    setPickerNative(cap.native);
  }, []);

  const filtered = useMemo(
    () =>
      CONTACTS.filter(
        (c) =>
          c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q),
      ),
    [q],
  );
  const groups = useMemo(() => {
    const g: Record<string, typeof CONTACTS> = {};
    for (const c of filtered) {
      const k = c.name[0]?.toUpperCase() || "#";
      (g[k] = g[k] || []).push(c);
    }
    return g;
  }, [filtered]);
  const letters = Object.keys(groups).sort();

  const toggle = (phone: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      next.has(phone) ? next.delete(phone) : next.add(phone);
      return next;
    });
  };

  const openDevicePicker = async () => {
    if (!pickerSupported || pickerBusy) return;
    setPickerBusy(true);
    setPermissionDenied(false);
    try {
      const items = await pickContacts();
      if (items.length > 0) setConfirmList(items);
    } catch (e: any) {
      if (e?.code === "permission-denied") setPermissionDenied(true);
    } finally {
      setPickerBusy(false);
    }
  };

  const manualValid = manualPhone.length === 10 && /^[2-9]/.test(manualPhone);
  const submitManual = () => {
    if (!manualValid) return;
    haptics.light();
    onPick([manualPhone]);
  };

  return (
    <SphereScreen>
      <div className="flex items-center justify-between px-6 pt-12 pb-2">
        <button
          onClick={onBack}
          className="text-ink/80 text-[18px] -ml-1 px-2"
          aria-label="Back"
        >
          ←
        </button>
        <div className="font-serif italic text-[18px]">sphere</div>
        <div className="w-6" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-32" data-scroll>
        <Eyebrow>Add from contacts</Eyebrow>
        <h1 className="mt-2 font-serif italic text-[34px] leading-[1.05] tracking-tight">
          Your contacts.
        </h1>
        <p className="mt-3 text-[14px] text-mute">
          {CONTACTS.length} people · pick as many as you want. Anonymous unless mutual.
        </p>

        {permissionDenied && (
          <div className="mt-5 rounded-2xl bg-surface border border-line p-4">
            <div className="font-serif italic text-[18px]">Contacts access is off.</div>
            <p className="mt-1 text-[13px] text-mute">
              Sphere only reads contacts you tap. Turn on access in Settings, or
              type a number by hand.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={openAppSettings}
                className="rounded-full bg-ink text-paper text-[13px] font-semibold px-3 py-2"
              >
                Open Settings
              </button>
              <button
                onClick={() => setPermissionDenied(false)}
                className="rounded-full border border-line bg-transparent text-ink text-[13px] px-3 py-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-2">
          {pickerSupported ? (
            <button
              onClick={openDevicePicker}
              disabled={pickerBusy}
              className="col-span-2 rounded-2xl bg-surface border border-line p-3 text-[14px] font-medium hover:border-ink/40 disabled:opacity-50"
            >
              {pickerBusy
                ? "Opening…"
                : pickerNative
                  ? "Pick from Contacts"
                  : "Pick from device"}
            </button>
          ) : (
            <>
              <button
                onClick={() => setOpenSheet("paste")}
                className="rounded-2xl bg-surface border border-line p-3 text-[14px] font-medium hover:border-ink/40"
              >
                Paste a list
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-2xl bg-surface border border-line p-3 text-[14px] font-medium hover:border-ink/40"
              >
                Upload .vcf
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".vcf,text/vcard,text/x-vcard"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  try {
                    const text = await file.text();
                    const phones = extractPhones(text);
                    if (phones.length === 0) return;
                    setConfirmList(phones.map((p) => ({ name: "", phone: p })));
                  } catch {}
                }}
              />
            </>
          )}
          <button
            onClick={() => setOpenSheet("manual")}
            className={`rounded-2xl bg-surface border border-line p-3 text-[14px] font-medium hover:border-ink/40 ${
              pickerSupported ? "col-span-2" : "col-span-2"
            }`}
          >
            Enter manually
          </button>
        </div>

        <div className="mt-4 rounded-2xl bg-surface border border-line flex items-center gap-2 px-4 py-3">
          <span className="text-mute text-[14px]">⌕</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or number"
            className="flex-1 bg-transparent border-0 outline-none text-ink text-[15px] placeholder:text-mute"
          />
        </div>

        <div className="mt-6">
          {letters.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line p-6 text-center">
              <div className="font-serif italic text-[20px] text-ink/80">
                No matches for “{q}”.
              </div>
              <div
                className="mt-2 font-mono text-[10px] uppercase text-mute"
                style={{ letterSpacing: "0.22em" }}
              >
                Try a different name — or type a number
              </div>
            </div>
          ) : (
            letters.map((L) => (
              <div key={L} className="mt-2">
                <div
                  className="px-1 pt-3 pb-1 font-mono text-[10px] uppercase text-mute"
                  style={{ letterSpacing: "0.22em" }}
                >
                  {L}
                </div>
                {groups[L].map((c) => {
                  const on = picked.has(c.phone);
                  return (
                    <button
                      key={c.phone}
                      onClick={() => toggle(c.phone)}
                      className={`w-full text-left mt-1 rounded-2xl border p-3 flex items-center gap-3 transition-colors ${
                        on
                          ? "bg-ink/[0.04] border-ink/40"
                          : "bg-transparent border-transparent hover:border-line"
                      }`}
                    >
                      <AvatarMono initials={initialsFromHash(c.phone)} size={40} />
                      <div className="flex-1 min-w-0">
                        <div className="font-serif text-[18px] leading-tight truncate">
                          {c.name}
                        </div>
                        <div className="text-[13px] text-mute truncate">{c.phone}</div>
                      </div>
                      <div
                        className={`flex items-center justify-center text-[12px] ${
                          on
                            ? "bg-ink text-paper border-ink"
                            : "bg-transparent text-transparent border-line"
                        }`}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          borderWidth: 1.5,
                          borderStyle: "solid",
                        }}
                      >
                        ✓
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {picked.size > 0 && (
        <div
          className="absolute left-0 right-0 px-6"
          style={{ bottom: `calc(env(safe-area-inset-bottom, 0px) + 16px)` }}
        >
          <PrimaryButton onClick={() => onPick([...picked])}>
            Add {picked.size} {picked.size === 1 ? "person" : "people"}
          </PrimaryButton>
        </div>
      )}

      {/* Manual entry sheet */}
      <Sheet open={openSheet === "manual"} onClose={() => setOpenSheet(null)}>
        <Eyebrow>Type a number</Eyebrow>
        <h2 className="mt-2 font-serif italic text-[26px]">Enter manually.</h2>
        <div className="mt-5 rounded-2xl bg-surface border border-line flex items-center gap-3 px-4 py-3">
          <span className="text-[15px] font-semibold text-mute select-none">+1</span>
          <span className="w-px h-5 bg-line" />
          <input
            autoFocus
            value={formatPhone(manualPhone)}
            onChange={(e) => setManualPhone(normalizeManual(e.target.value))}
            placeholder="(555) 123-4567"
            inputMode="tel"
            autoComplete="tel-national"
            className="flex-1 bg-transparent border-0 outline-none text-ink text-[16px] placeholder:text-mute"
          />
        </div>
        <div className="mt-5">
          <PrimaryButton onClick={submitManual}>
            {manualValid ? "Add them" : "Enter a 10-digit US number"}
          </PrimaryButton>
        </div>
        <div className="mt-2">
          <GhostButton onClick={() => setOpenSheet(null)}>Cancel</GhostButton>
        </div>
      </Sheet>

      {/* Paste sheet */}
      <Sheet open={openSheet === "paste"} onClose={() => setOpenSheet(null)}>
        <Eyebrow>Paste a list</Eyebrow>
        <h2 className="mt-2 font-serif italic text-[26px]">Paste names + numbers.</h2>
        <p className="mt-2 text-[13px] text-mute">
          We’ll grab the US phone numbers.
        </p>
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value.slice(0, 20000))}
          placeholder={"Alex Kim 555-123-4567\nSam Lee (415) 555 9876"}
          rows={6}
          className="mt-4 w-full rounded-2xl bg-surface border border-line p-3 outline-none text-ink text-[14px] resize-y placeholder:text-mute"
          style={{ lineHeight: 1.4, fontFamily: "inherit" }}
        />
        {(() => {
          const found = extractPhones(pasteText);
          return (
            <>
              <div className="mt-2 text-[12px] text-mute">
                {found.length === 0
                  ? "No phone numbers found yet."
                  : `Found ${found.length} number${found.length === 1 ? "" : "s"}.`}
              </div>
              <div className="mt-4">
                <PrimaryButton
                  onClick={() => {
                    if (found.length === 0) return;
                    setConfirmList(found.map((p) => ({ name: "", phone: p })));
                    setPasteText("");
                    setOpenSheet(null);
                  }}
                >
                  {found.length === 0 ? "Paste at least one number" : `Review ${found.length}`}
                </PrimaryButton>
              </div>
              <div className="mt-2">
                <GhostButton onClick={() => setOpenSheet(null)}>Cancel</GhostButton>
              </div>
            </>
          );
        })()}
      </Sheet>

      {/* Confirm list sheet (from device picker / paste / vcf) */}
      <Sheet open={!!confirmList} onClose={() => setConfirmList(null)}>
        {confirmList && (
          <>
            <Eyebrow>Review</Eyebrow>
            <h2 className="mt-2 font-serif italic text-[26px]">
              Add {confirmList.length} {confirmList.length === 1 ? "person" : "people"}?
            </h2>
            <p className="mt-2 text-[13px] text-mute">
              They won’t be notified unless they add you back.
            </p>
            <div className="mt-4 max-h-[40vh] overflow-y-auto space-y-2">
              {confirmList.map((c) => (
                <div
                  key={c.phone}
                  className="rounded-2xl bg-surface border border-line p-3 flex items-center gap-3"
                >
                  <AvatarMono initials={initialsFromHash(c.phone)} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="font-serif text-[16px] leading-tight truncate">
                      {c.name || c.phone}
                    </div>
                    {c.name && (
                      <div className="text-[12px] text-mute truncate">{c.phone}</div>
                    )}
                  </div>
                  <button
                    aria-label="Remove"
                    onClick={() =>
                      setConfirmList((list) => {
                        if (!list) return list;
                        const next = list.filter((i) => i.phone !== c.phone);
                        return next.length === 0 ? null : next;
                      })
                    }
                    className="w-7 h-7 rounded-full border border-line bg-transparent text-ink text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-5">
              <PrimaryButton
                onClick={() => {
                  if (!confirmList || confirmList.length === 0) return;
                  const phones = confirmList.map((i) => i.phone);
                  setConfirmList(null);
                  onPick(phones);
                }}
              >
                Add {confirmList.length} {confirmList.length === 1 ? "person" : "people"}
              </PrimaryButton>
            </div>
            <div className="mt-2">
              <GhostButton onClick={() => setConfirmList(null)}>Cancel</GhostButton>
            </div>
          </>
        )}
      </Sheet>
    </SphereScreen>
  );
}
