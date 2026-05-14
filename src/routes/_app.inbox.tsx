import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SphereScreen } from "@/sphere/components/SphereScreen";
import { TabBar } from "@/sphere/components/TabBar";
import { Eyebrow, ComplimentBubble } from "@/sphere/ui";
import {
  callLoadInboxCompliments,
  type InboxCompliment,
} from "@/mutual/compliments.rpc";

export const Route = createFileRoute("/_app/inbox")({
  head: () => ({
    meta: [
      { title: "Inbox — sphere" },
      { name: "description", content: "Anonymous compliments sent to you." },
    ],
  }),
  component: InboxRoute,
});

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function InboxRoute() {
  const [items, setItems] = useState<InboxCompliment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await callLoadInboxCompliments();
        if (!cancelled) setItems(rows);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Could not load inbox.");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <SphereScreen>
      <div className="flex items-center justify-between px-6 pt-12 pb-2">
        <Link
          to={"/home" as any}
          className="text-ink/80 text-[18px] -ml-1 px-2"
          aria-label="Back"
        >
          ←
        </Link>
        <div className="font-serif italic text-[18px]">sphere</div>
        <div className="w-6" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-8" data-scroll>
        <Eyebrow>Inbox</Eyebrow>
        <h1 className="mt-2 font-serif italic text-[36px] leading-[1.04] tracking-tight">
          Things people thought.
        </h1>
        <p className="mt-3 text-[14px] text-mute">
          Anonymous. No names. No replies.
        </p>

        <div className="mt-7 space-y-3">
          {error && (
            <div className="rounded-2xl border border-[#D8D5D0] p-5 text-[14px] text-mute">
              {error}
            </div>
          )}
          {items === null && !error && (
            <div className="rounded-2xl border border-[#D8D5D0] p-5 text-[14px] text-mute font-serif italic">
              Loading…
            </div>
          )}
          {items && items.length === 0 && (
            <div className="rounded-2xl border border-[#D8D5D0] p-6 text-center">
              <div className="font-serif italic text-[20px] text-ink/80">
                Nothing yet.
              </div>
              <div
                className="mt-3 font-mono text-[10px] uppercase text-mute"
                style={{ letterSpacing: "0.22em" }}
              >
                Patience is part of it
              </div>
            </div>
          )}
          {items?.map((c) => (
            <ComplimentBubble
              key={c.id}
              body={c.body}
              caption={`Anonymous · ${timeAgo(c.created_at)}`}
            />
          ))}
        </div>
      </div>

      <TabBar />
    </SphereScreen>
  );
}
