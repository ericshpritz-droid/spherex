import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SphereScreen } from "@/sphere/components/SphereScreen";
import { AvatarMono, initialsFromHash } from "@/sphere/components/AvatarMono";
import { Eyebrow } from "@/sphere/ui";
import { useApp } from "@/mutual/AppContext";
import { toast } from "@/mutual/toast";

export const Route = createFileRoute("/_app/contacts")({
  head: () => ({
    meta: [
      { title: "Contacts — sphere" },
      { name: "description", content: "View, label, and remove your sphere contacts." },
      { property: "og:title", content: "Contacts — sphere" },
      { property: "og:description", content: "View, label, and remove your sphere contacts." },
    ],
  }),
  component: ContactsManageRoute,
});

type Labels = Record<string, string>;

function labelKey(userId: string | undefined): string {
  return `mutual.contactLabels.${userId ?? "anon"}`;
}

function loadLabels(userId: string | undefined): Labels {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(labelKey(userId)) || "{}") as Labels;
  } catch {
    return {};
  }
}

function saveLabels(userId: string | undefined, labels: Labels) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(labelKey(userId), JSON.stringify(labels));
  } catch {}
}

function ContactsManageRoute() {
  const { matches, pending, removePending, user, dataLoading } = useApp();
  const navigate = useNavigate();

  const [labels, setLabels] = useState<Labels>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    setLabels(loadLabels(user?.id));
  }, [user?.id]);

  const persist = useCallback(
    (next: Labels) => {
      setLabels(next);
      saveLabels(user?.id, next);
    },
    [user?.id],
  );

  const all = useMemo(
    () => [
      ...matches.map((p) => ({ ...p, _section: "matched" as const })),
      ...pending.map((p) => ({ ...p, _section: "pending" as const })),
    ],
    [matches, pending],
  );

  const startEdit = (id: string, current: string) => {
    setEditingId(id);
    setDraft(current);
  };

  const saveEdit = (id: string) => {
    const value = draft.trim().slice(0, 60);
    const next = { ...labels };
    if (value) next[id] = value;
    else delete next[id];
    persist(next);
    setEditingId(null);
    setDraft("");
    toast.success(value ? "Label saved" : "Label cleared");
  };

  const handleDelete = async (id: string, section: "matched" | "pending") => {
    if (typeof window !== "undefined") {
      const ok = window.confirm(
        section === "matched"
          ? "Remove this match? This unmatches you from this person."
          : "Remove this pending pick?",
      );
      if (!ok) return;
    }
    setBusyId(id);
    try {
      await removePending(id);
      // Also clear any custom label
      if (labels[id]) {
        const next = { ...labels };
        delete next[id];
        persist(next);
      }
      toast.success("Removed");
    } catch (e: any) {
      toast.error(e?.message || "Could not remove");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SphereScreen>
      <div className="flex items-center justify-between px-6 pt-12 pb-2">
        <button
          onClick={() => navigate({ to: "/profile" })}
          className="font-mono text-[11px] uppercase text-mute bg-transparent border-0 cursor-pointer"
          style={{ letterSpacing: "0.22em" }}
        >
          ← Back
        </button>
        <div className="font-serif italic text-[22px]">sphere</div>
        <div className="w-12" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-8" data-scroll>
        <Eyebrow>Contacts</Eyebrow>
        <h1 className="mt-2 font-serif italic text-[34px] leading-[1.05] tracking-tight">
          People in your sphere.
        </h1>
        <p className="mt-3 text-[14px] text-mute">
          Add a private label, or remove anyone. Labels are stored on this
          device only — never uploaded.
        </p>

        {all.length === 0 ? (
          dataLoading ? (
            <div className="mt-8 rounded-2xl border border-[#D8D5D0] p-6 text-center">
              <div className="font-serif italic text-[20px] text-ink/80">
                Loading…
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-[#D8D5D0] p-8 text-center">
              <div
                className="font-mono text-[10px] uppercase text-mute"
                style={{ letterSpacing: "0.22em" }}
              >
                Your sphere
              </div>
              <h2 className="mt-3 font-serif italic text-[26px] leading-[1.1] text-ink">
                No one in here yet.
              </h2>
              <p className="mt-3 text-[14px] text-mute leading-snug">
                You haven't added anyone, and no one's matched you back.
                Add a person by number, contact, or Instagram — they'll never
                know unless they pick you too.
              </p>
              <div className="mt-6 flex flex-col items-center gap-3">
                <button
                  onClick={() => navigate({ to: "/add" })}
                  className="rounded-full text-[12px] font-semibold cursor-pointer bg-ink text-paper border-0"
                  style={{ padding: "10px 20px" }}
                >
                  Add someone →
                </button>
                <button
                  onClick={() => navigate({ to: "/home" })}
                  className="font-mono text-[10px] uppercase text-mute bg-transparent border-0 cursor-pointer underline-offset-4 hover:underline"
                  style={{ letterSpacing: "0.22em" }}
                >
                  Back to home
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="mt-7 space-y-3">
            {all.map((p) => {
              const id = String(p.id);
              const initials = initialsFromHash(id);
              const label = labels[id] || "";
              const displayName = label || p.name;
              const isEditing = editingId === id;
              const isBusy = busyId === id;

              return (
                <div
                  key={`${p._section}-${id}`}
                  className="rounded-2xl bg-surface border border-line p-4"
                >
                  <div className="flex items-center gap-4">
                    <AvatarMono initials={initials} />
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <input
                          autoFocus
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(id);
                            if (e.key === "Escape") {
                              setEditingId(null);
                              setDraft("");
                            }
                          }}
                          maxLength={60}
                          placeholder="Add a label"
                          className="w-full bg-paper border border-line rounded-md px-2 py-1 text-[15px] text-ink outline-none focus:border-ink/60"
                        />
                      ) : (
                        <div className="text-[15px] font-medium text-ink truncate">
                          {displayName}
                        </div>
                      )}
                      <div
                        className="mt-1 font-mono text-[10px] uppercase text-mute"
                        style={{ letterSpacing: "0.22em" }}
                      >
                        {p._section === "matched" ? "Matched" : "Pending"}
                        {label && !isEditing ? " · labeled" : ""}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setDraft("");
                          }}
                          className="rounded-full text-[12px] font-semibold cursor-pointer bg-transparent text-ink border border-line"
                          style={{ padding: "6px 14px" }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveEdit(id)}
                          className="rounded-full text-[12px] font-semibold cursor-pointer bg-ink text-paper border-0"
                          style={{ padding: "6px 14px" }}
                        >
                          Save
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(id, label)}
                          className="rounded-full text-[12px] font-semibold cursor-pointer bg-transparent text-ink border border-line"
                          style={{ padding: "6px 14px" }}
                        >
                          {label ? "Edit label" : "Add label"}
                        </button>
                        <button
                          onClick={() => handleDelete(id, p._section)}
                          disabled={isBusy}
                          className="rounded-full text-[12px] font-semibold cursor-pointer bg-danger text-paper border-0 disabled:opacity-50"
                          style={{ padding: "6px 14px" }}
                        >
                          {isBusy ? "Removing…" : "Remove"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SphereScreen>
  );
}
