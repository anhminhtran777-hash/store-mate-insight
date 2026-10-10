import { createFileRoute } from "@tanstack/react-router";
import { Workspace } from "@/features/stockpilot/workspace";
export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Supplier Reports — Stock Genie" },
      {
        name: "description",
        content: "Review staff reports about missing or damaged supplier deliveries and claim supplier refunds in Stock Genie.",
      },
      { property: "og:title", content: "Supplier Reports — Stock Genie" },
      {
        property: "og:description",
        content: "Review staff reports about missing or damaged supplier deliveries and claim supplier refunds in Stock Genie.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Workspace page="Reports" />,
});
