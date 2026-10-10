import { createFileRoute } from '@tanstack/react-router';
import { Workspace } from '@/features/stockpilot/workspace';
export const Route = createFileRoute('/assistant')({
 head: () => ({ meta: [
  { title: 'AI Assistant — StockPilot' },
  { name: 'description', content: 'Review inventory trends and prepare smart reorder drafts with the simulated StockPilot assistant.' },
  { property: 'og:title', content: 'AI Assistant — StockPilot' },
  { property: 'og:description', content: 'Review inventory trends and prepare smart reorder drafts with the simulated StockPilot assistant.' },
  { property: 'og:type', content: 'website' },
  { name: 'twitter:card', content: 'summary_large_image' },
 ] }),
 component: () => <Workspace page="AI Assistant" />,
});
