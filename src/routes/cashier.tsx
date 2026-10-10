import { createFileRoute } from "@tanstack/react-router";
import { Workspace } from "@/features/stockpilot/workspace";
export const Route = createFileRoute("/cashier")({
  head: () => ({
    meta: [
      { title: "Cashier — StockPilot" },
      {
        name: "description",
        content: "Ring up sales with numpad shortcuts and print or email receipts.",
      },
      { property: "og:title", content: "Cashier — StockPilot" },
      {
        property: "og:description",
        content: "Ring up sales with numpad shortcuts and print or email receipts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Workspace page="Cashier" />,
});
