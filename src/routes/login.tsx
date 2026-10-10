import { createFileRoute } from "@tanstack/react-router";
import { Login } from "@/features/stockpilot/workspace";
export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — StockPilot" },
      {
        name: "description",
        content: "Sign in to StockPilot or explore a realistic convenience store demo.",
      },
      { property: "og:title", content: "Sign in — StockPilot" },
      {
        property: "og:description",
        content: "Sign in to StockPilot or explore a realistic convenience store demo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Login />,
});
