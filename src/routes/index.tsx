import { createFileRoute } from "@tanstack/react-router";
import App from "../mutual/App.jsx";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mutual — Only if they pick you back." },
      { name: "description", content: "Add a number. If they add yours, it's mutual. No DMs. No maybe." },
      { property: "og:title", content: "Mutual — Only if they pick you back." },
      { property: "og:description", content: "Phone-number-based double-opt-in matching." },
    ],
  }),
  component: App,
});
