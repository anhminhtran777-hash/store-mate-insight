import { createFileRoute } from "@tanstack/react-router";
import { Workspace } from "@/features/stockpilot/workspace";
export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "Documents — Stock Genie" },
      {
        name: "description",
        content: "View linked purchase requests, supplier invoices, delivery notes and goods-received receipts.",
      },
      { property: "og:title", content: "Documents — Stock Genie" },
      {
        property: "og:description",
        content: "View linked purchase requests, supplier invoices, delivery notes and goods-received receipts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Workspace page="Documents" />,
});
