import { createFileRoute } from "@tanstack/react-router";
import { Workspace } from "@/features/stockpilot/workspace";
export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Stock Genie" },
      {
        name: "description",
        content: "Manage your Stock Genie store profile and workspace preferences.",
      },
      { property: "og:title", content: "Settings — Stock Genie" },
      {
        property: "og:description",
        content: "Manage your Stock Genie store profile and workspace preferences.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Workspace page="Settings" />,
});
