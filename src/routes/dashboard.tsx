import { createFileRoute } from '@tanstack/react-router';
import { Workspace } from '@/features/stockpilot/workspace';
export const Route = createFileRoute('/dashboard')({
 head: () => ({ meta: [
  { title: 'Dashboard — StockPilot' },
  { name: 'description', content: 'Your store at a glance: stock alerts, inventory value, and category performance.' },
  { property: 'og:title', content: 'Dashboard — StockPilot' },
  { property: 'og:description', content: 'Your store at a glance: stock alerts, inventory value, and category performance.' },
  { property: 'og:type', content: 'website' },
  { name: 'twitter:card', content: 'summary_large_image' },
 ] }),
 component: () => <Workspace page="Dashboard" />,
});
