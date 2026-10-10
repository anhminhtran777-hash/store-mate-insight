import { createFileRoute } from "@tanstack/react-router";
import { Workspace } from "@/features/stockpilot/workspace";
export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Purchase Orders — StockPilot" },
      {
        name: "description",
        content: "Review, approve, and receive your convenience store purchase orders.",
      },
      { property: "og:title", content: "Purchase Orders — StockPilot" },
      {
        property: "og:description",
        content: "Review, approve, and receive your convenience store purchase orders.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Workspace page="Purchase Orders" />,
});
