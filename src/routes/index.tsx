import { createFileRoute } from '@tanstack/react-router';
import { Workspace } from '@/features/stockpilot/workspace';
export const Route = createFileRoute('/')({
 head: () => ({ meta: [
  { title: 'Inventory — StockPilot' },
  { name: 'description', content: 'Manage your convenience store inventory, stock levels, and product performance in StockPilot.' },
  { property: 'og:title', content: 'Inventory — StockPilot' },
  { property: 'og:description', content: 'A clear view of your products, stock, and six-month inventory trends.' },
  { property: 'og:type', content: 'website' },
  { name: 'twitter:card', content: 'summary_large_image' },
 ] }),
 component: () => <Workspace />,
});
