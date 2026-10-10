import { createFileRoute } from "@tanstack/react-router";
import { Workspace } from "@/features/stockpilot/workspace";
export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [
      { title: "Activity Log — StockPilot" },
      {
        name: "description",
        content: "Track every inventory change, stock receipt, and purchase order approval.",
      },
      { property: "og:title", content: "Activity Log — StockPilot" },
      {
        property: "og:description",
        content: "Track every inventory change, stock receipt, and purchase order approval.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Workspace page="Activity Log" />,
});
