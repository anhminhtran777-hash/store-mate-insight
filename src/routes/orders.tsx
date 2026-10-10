import { createFileRoute } from "@tanstack/react-router";
import { Workspace } from "@/features/stockpilot/workspace";
export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Purchase Orders — StockPilot" },
      {
        name: "description",
        content: "Create manual purchase requests, record supplier invoices and delivery notes, and receive stock in StockPilot.",
      },
      { property: "og:title", content: "Purchase Orders — StockPilot" },
      {
        property: "og:description",
        content: "Create manual purchase requests, record supplier invoices and delivery notes, and receive stock in StockPilot.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Workspace page="Purchase Orders" />,
});
