import { createFileRoute } from "@tanstack/react-router";
import { Workspace } from "@/features/stockpilot/workspace";
export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Purchase Orders — Stock Genie" },
      {
        name: "description",
        content: "Create manual purchase requests, record supplier invoices and delivery notes, and receive stock in Stock Genie.",
      },
      { property: "og:title", content: "Purchase Orders — Stock Genie" },
      {
        property: "og:description",
        content: "Create manual purchase requests, record supplier invoices and delivery notes, and receive stock in Stock Genie.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Workspace page="Purchase Orders" />,
});
