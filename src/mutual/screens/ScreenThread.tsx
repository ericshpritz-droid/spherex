// Emoji-only thread between the current user and one matched contact.
// Folder-friendly: this file only depends on AppContext + design tokens.
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { ACCENT_PRESETS, gradient } from "../brand.js";
import { Aura } from "../components/index.jsx";
import { PhoneAvatar } from "../components/PhoneAvatar.jsx";
import { Spinner } from "../components/Spinner.jsx";
import { sendMessageServer, loadThreadServer, unsendMessageServer } from "../messages.functions";
import { toast } from "../toast";

const QUICK_EMOJIS = ["🔥", "💀", "👀", "❤️", "🤝", "😂", "🫡", "🥹", "🤔", "🙌", "✨", "💯"];

const EMOJI_ONLY_RE =
  /^(?:[\p{Extended_Pictographic}\p{Emoji_Component}\p{Regional_Indicator}\u200D\uFE0F\u20E3])+$/u;

type Msg = {
  id: string;
  sender_phone_hash: string;
  recipient_phone_hash: string;
  body: string;
  created_at: string;
};

type Props = {
  accent: "pink" | "lavender" | "blue";
  match: {
    id: string;          // their phone hash
    name: string;
    phone: string;
    avatar: "pink" | "lavender" | "blue";
  };
  onBack: () => void;
};

export function ScreenThread({ accent, match, onBack }: Props) {
  const send = useServerFn(sendMessageServer);
  const load = useServerFn(loadThreadServer);
  const unsend = useServerFn(unsendMessageServer);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [myHash, setMyHash] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  // Re-render every second so the "X seconds left" hint stays accurate.
  const [now, setNow] = useState(() => Date.now());
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load({ data: { otherPhoneHash: match.id } })
      .then(({ messages, myHash }) => {
        if (cancelled) return;
        setMessages(messages as Msg[]);
        setMyHash(myHash);
      })
      .catch((e: any) => {
        if (!cancelled) toast.error(e?.message || "Couldn't load messages");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [match.id, load]);

  // Realtime: append new messages, drop unsent ones
  useEffect(() => {
    if (!myHash) return;
    const channel = supabase
      .channel(`thread:${myHash}:${match.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new as Msg;
          const involvesUs =
            (m.sender_phone_hash === myHash && m.recipient_phone_hash === match.id) ||
            (m.sender_phone_hash === match.id && m.recipient_phone_hash === myHash);
          if (!involvesUs) return;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages" },
        (payload) => {
          const old = payload.old as Partial<Msg>;
          if (!old?.id) return;
          setMessages((prev) => prev.filter((x) => x.id !== old.id));
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [myHash, match.id]);

  // Tick every second so the unsend countdown stays fresh.
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  // Auto-scroll to newest
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const draftValid = useMemo(() => {
    if (!draft) return false;
    if ([...draft].length > 8) return false;
    return EMOJI_ONLY_RE.test(draft);
  }, [draft]);

  const doSend = async (body: string) => {
    if (sending) return;
    if (!body || ![...body].every((_) => true)) return;
    if ([...body].length > 8 || !EMOJI_ONLY_RE.test(body)) {
      toast.error("Emoji only, max 8");
      return;
    }
    setSending(true);
    try {
      const { message } = await send({ data: { otherPhoneHash: match.id, body } });
      // Optimistic dedupe with realtime
      setMessages((prev) => (prev.some((x) => x.id === (message as Msg).id) ? prev : [...prev, message as Msg]));
      setDraft("");
    } catch (e: any) {
      toast.error(e?.message || "Couldn't send");
    } finally {
      setSending(false);
    }
  };

  const UNSEND_WINDOW_MS = 60_000;
  const canUnsend = (m: Msg) =>
    m.sender_phone_hash === myHash &&
    now - new Date(m.created_at).getTime() < UNSEND_WINDOW_MS;

  const doUnsend = async (id: string) => {
    setConfirmId(null);
    // Optimistic remove
    const prev = messages;
    setMessages((cur) => cur.filter((x) => x.id !== id));
    try {
      await unsend({ data: { id } });
    } catch (e: any) {
      setMessages(prev);
      toast.error(e?.message || "Couldn't unsend");
    }
  };

  const startLongPress = (id: string) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => setConfirmId(id), 450);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const confirmMsg = confirmId ? messages.find((x) => x.id === confirmId) : null;
  const confirmSecsLeft = confirmMsg
    ? Math.max(0, Math.ceil((UNSEND_WINDOW_MS - (now - new Date(confirmMsg.created_at).getTime())) / 1000))
    : 0;

  const p = ACCENT_PRESETS[accent];

  return (
    <div className="relative h-full overflow-hidden bg-ink text-white flex flex-col">
      <Aura accent={accent} intensity={0.4} />

      {/* Header */}
      <div
        className="relative z-[2] flex items-center gap-3 border-b border-hairline-08"
        style={{ padding: "60px 18px 14px" }}
      >
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full border-0 bg-glass-08 text-white text-lg cursor-pointer"
        >←</button>
        <PhoneAvatar phone={match.phone} size={40} accent={match.avatar} />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[16px] truncate">{match.name}</div>
          <div className="text-[12px] text-fg-55">Mutual · emoji only</div>
        </div>
      </div>

      {/* Message list */}
      <div
        ref={scrollerRef}
        className="relative z-[1] flex-1 overflow-y-auto"
        style={{ padding: "16px 18px 12px" }}
      >
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Spinner accent={accent} size={28} />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-2 text-fg-55 text-[13px]">
            <div className="text-4xl mb-2">👋</div>
            <div>Say hi with an emoji.</div>
            <div className="text-[12px] text-fg-40">No words. Just vibes.</div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((m) => {
              const mine = m.sender_phone_hash === myHash;
              const unsendable = mine && canUnsend(m);
              return (
                <div
                  key={m.id}
                  className="flex"
                  style={{ justifyContent: mine ? "flex-end" : "flex-start" }}
                >
                  <div
                    onContextMenu={(e) => {
                      if (!unsendable) return;
                      e.preventDefault();
                      setConfirmId(m.id);
                    }}
                    onPointerDown={() => unsendable && startLongPress(m.id)}
                    onPointerUp={cancelLongPress}
                    onPointerLeave={cancelLongPress}
                    onPointerCancel={cancelLongPress}
                    className="rounded-[20px] select-none"
                    style={{
                      padding: "10px 14px",
                      fontSize: 28,
                      lineHeight: 1.1,
                      maxWidth: "75%",
                      cursor: unsendable ? "pointer" : "default",
                      WebkitTouchCallout: "none",
                      background: mine
                        ? gradient(accent, "135deg")
                        : "rgba(255,255,255,0.08)",
                      border: mine ? "none" : "1px solid rgba(255,255,255,0.10)",
                      boxShadow: mine ? `0 6px 16px ${p.a}33` : "none",
                    }}
                    title={unsendable ? "Long-press to unsend" : undefined}
                  >
                    {m.body}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick emoji rail */}
      <div
        className="relative z-[2] flex gap-2 overflow-x-auto"
        style={{ padding: "8px 14px 0" }}
      >
        {QUICK_EMOJIS.map((e) => (
          <button
            key={e}
            onClick={() => doSend(e)}
            disabled={sending}
            className="rounded-full border-0 bg-glass-06 cursor-pointer shrink-0"
            style={{ width: 44, height: 44, fontSize: 22 }}
            aria-label={`Send ${e}`}
          >
            {e}
          </button>
        ))}
      </div>

      {/* Composer */}
      <div
        className="relative z-[2] flex items-center gap-2 border-t border-hairline-08"
        style={{ padding: "12px 14px 22px" }}
      >
        <input
          inputMode="text"
          value={draft}
          onChange={(e) => {
            // Cap at 8 codepoints; let the user type emoji freely.
            const next = [...e.target.value].slice(0, 8).join("");
            setDraft(next);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draftValid) {
              e.preventDefault();
              doSend(draft);
            }
          }}
          placeholder="🙂"
          className="flex-1 rounded-full bg-glass-06 border border-hairline-12 text-white"
          style={{ padding: "12px 16px", fontSize: 22, letterSpacing: 2 }}
        />
        <button
          onClick={() => doSend(draft)}
          disabled={!draftValid || sending}
          className="rounded-full text-white font-semibold cursor-pointer disabled:opacity-40"
          style={{
            padding: "12px 18px",
            border: 0,
            background: gradient(accent, "135deg"),
            boxShadow: `0 8px 20px ${p.a}40`,
          }}
        >
          Send
        </button>
      </div>

      {/* Unsend confirm sheet */}
      {confirmMsg && (
        <div
          className="absolute inset-0 z-[10] flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={() => setConfirmId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-ink rounded-t-3xl border-t border-hairline-12"
            style={{ padding: "20px 22px 28px" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="rounded-2xl flex items-center justify-center"
                style={{
                  width: 56, height: 56, fontSize: 28,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                {confirmMsg.body}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-[16px]">Unsend this?</div>
                <div className="text-[12px] text-fg-55">
                  {confirmSecsLeft > 0
                    ? `${confirmSecsLeft}s left to take it back`
                    : "Too late — this message is permanent now"}
                </div>
              </div>
            </div>
            <button
              onClick={() => doUnsend(confirmMsg.id)}
              disabled={confirmSecsLeft === 0}
              className="w-full rounded-full text-white font-semibold cursor-pointer disabled:opacity-40 mb-2"
              style={{
                padding: "14px 18px",
                border: 0,
                background: "rgba(241,63,94,0.85)",
              }}
            >
              Unsend
            </button>
            <button
              onClick={() => setConfirmId(null)}
              className="w-full rounded-full bg-glass-06 text-white font-semibold cursor-pointer border border-hairline-12"
              style={{ padding: "14px 18px" }}
            >
              Keep it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
