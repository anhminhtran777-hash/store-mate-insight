import { createFileRoute } from "@tanstack/react-router";
import { Login } from "@/features/stockpilot/workspace";
export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Stock Genie" },
      {
        name: "description",
        content: "Sign in to Stock Genie or explore a realistic convenience store demo.",
      },
      { property: "og:title", content: "Sign in — Stock Genie" },
      {
        property: "og:description",
        content: "Sign in to Stock Genie or explore a realistic convenience store demo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Login />,
});
