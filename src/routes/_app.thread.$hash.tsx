import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ScreenThread } from "../mutual/screens/ScreenThread";
import { useApp } from "../mutual/AppContext";

export const Route = createFileRoute("/_app/thread/$hash")({
  head: () => ({
    meta: [
      { title: "Mutual thread — Sphere" },
      { name: "description", content: "Send emoji to your mutual." },
    ],
  }),
  component: ThreadRoute,
});

function ThreadRoute() {
  const { hash } = Route.useParams();
  const { accent, matches } = useApp();
  const navigate = useNavigate();

  const match = matches.find((m) => m.id === hash);
  if (!match) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-ink text-white gap-3 px-6 text-center">
        <div className="text-2xl">🤷</div>
        <div className="font-semibold">No match found</div>
        <div className="text-[13px] text-fg-55">
          You can only message people you've matched with.
        </div>
        <button
          onClick={() => navigate({ to: "/home" })}
          className="mt-2 rounded-full bg-white text-black font-semibold cursor-pointer"
          style={{ padding: "10px 18px", border: 0 }}
        >
          Back to mutuals
        </button>
      </div>
    );
  }

  return (
    <ScreenThread
      accent={accent}
      match={match}
      onBack={() => navigate({ to: "/home" })}
    />
  );
}
