// Admin-only sitemap. Lists every route as a live iframe thumbnail.
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useApp } from "../mutual/AppContext";
import { useIsAdmin } from "../mutual/testmode/useTestMode";

export const Route = createFileRoute("/_app/sitemap")({
  head: () => ({ meta: [{ title: "Sitemap — Sphere" }] }),
  component: SitemapRoute,
});

type Entry = { path: string; label: string; note?: string; auth: "public" | "auth" };

const ROUTES: Entry[] = [
  { path: "/", label: "Index (redirect)", auth: "public" },
  { path: "/welcome", label: "Welcome", auth: "public" },
  { path: "/phone", label: "Phone entry", auth: "public" },
  { path: "/code", label: "OTP code", auth: "public", note: "Needs phone state" },
  { path: "/privacy", label: "Privacy", auth: "public" },
  { path: "/terms", label: "Terms", auth: "public" },
  { path: "/home", label: "Home", auth: "auth" },
  { path: "/contacts", label: "Contacts", auth: "auth" },
  { path: "/add", label: "Add", auth: "auth" },
  { path: "/match", label: "Match", auth: "auth" },
  { path: "/sent", label: "Sent", auth: "auth" },
  { path: "/profile", label: "Profile", auth: "auth" },
  { path: "/admin", label: "Admin", auth: "auth", note: "Admins only" },
  { path: "/onboarding-import", label: "Onboarding import", auth: "auth" },
  { path: "/thread/example", label: "Thread (sample hash)", auth: "auth" },
  { path: "/i/example", label: "Invite landing (sample hash)", auth: "public" },
];

function SitemapRoute() {
  const { user } = useApp();
  const isAdmin = useIsAdmin(user?.id);
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center bg-ink text-white">
        <div className="text-fg-60">Sign in first.</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-ink text-white gap-3" style={{ padding: 24 }}>
        <div className="text-2xl font-bold">Not authorized</div>
        <div className="text-fg-60 text-center text-sm">This page is for admins only.</div>
        <button
          onClick={() => navigate({ to: "/home" })}
          className="mt-4 rounded-[14px] bg-white text-black font-semibold"
          style={{ padding: "12px 18px", border: 0, cursor: "pointer" }}
        >Go home</button>
      </div>
    );
  }

  return (
    <div className="h-full bg-ink text-white overflow-y-auto" style={{ padding: "72px 20px 40px" }}>
      <button
        onClick={() => navigate({ to: "/profile" })}
        className="w-11 h-11 rounded-full border-0 bg-glass-08 text-white text-xl cursor-pointer mb-4"
      >←</button>
      <div className="font-bold tracking-sora-display" style={{ fontSize: 28 }}>Sitemap</div>
      <div className="mt-1 text-[13px] text-fg-60 mb-6">
        Live thumbnails of every route. Click a card to open it.
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 14,
        }}
      >
        {ROUTES.map((r) => (
          <ThumbCard key={r.path} entry={r} />
        ))}
      </div>
    </div>
  );
}

function ThumbCard({ entry }: { entry: Entry }) {
  // Render iframe at full size then scale down for a true preview.
  const FRAME_W = 402;
  const FRAME_H = 874;
  const TILE_W = 160;
  const TILE_H = 280;
  const scale = Math.min(TILE_W / FRAME_W, TILE_H / FRAME_H);

  return (
    <Link
      to={entry.path as never}
      className="block rounded-[14px] overflow-hidden border border-hairline-12 bg-glass-06 hover:bg-glass-08 transition-colors"
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div
        style={{
          width: "100%",
          height: TILE_H,
          position: "relative",
          background: "#000",
          overflow: "hidden",
        }}
      >
        <iframe
          src={entry.path}
          title={entry.label}
          loading="lazy"
          sandbox="allow-same-origin allow-scripts"
          style={{
            width: FRAME_W,
            height: FRAME_H,
            border: 0,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            pointerEvents: "none",
          }}
        />
      </div>
      <div style={{ padding: "10px 12px" }}>
        <div className="text-[13px] font-semibold truncate">{entry.label}</div>
        <div className="text-[11px] text-fg-60 truncate">{entry.path}</div>
        {entry.note && <div className="text-[10px] text-fg-45 mt-1">{entry.note}</div>}
      </div>
    </Link>
  );
}
