import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/i/$hash")({
  head: () => ({
    meta: [
      { title: "You've been invited — Sphere" },
      { name: "description", content: "Someone wants to be mutual on Sphere. Sign up to see who." },
      { property: "og:title", content: "You've been invited — Sphere" },
      { property: "og:description", content: "Someone wants to be mutual on Sphere." },
    ],
  }),
  component: InviteRoute,
});

const PENDING_KEY = "mutual.pendingInviteHash";

function InviteRoute() {
  const { hash } = Route.useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Stash the inviter's hash; AppContext consumes it after sign-in.
    if (typeof window !== "undefined" && /^[a-f0-9]{64}$/i.test(hash)) {
      try { sessionStorage.setItem(PENDING_KEY, hash.toLowerCase()); } catch {}
    }
    navigate({ to: "/welcome", replace: true });
  }, [hash, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink text-white">
      <div className="text-sm text-fg-60">Opening Sphere…</div>
    </div>
  );
}
