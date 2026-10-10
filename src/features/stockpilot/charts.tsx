import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { money, trendColor, type Product } from './model';
const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
function TrendChart({ values, bars, secondary }: { values: number[]; bars?: boolean; secondary?: number[] }) {
 const max = Math.max(...values, ...(secondary || [])) * 1.2;
 const y = (v: number) => 112 - (v / max) * 90;
 const x = (i: number) => 35 + i * 43;
 return <svg viewBox="0 0 280 145" className="trend-chart" role="img" aria-label={bars ? 'Monthly stock received and sold chart' : 'Six-month trend; decreases shown in red'}>
 {[0, 1, 2].map(i => <g key={i}><line x1="29" y1={22 + i * 45} x2="267" y2={22 + i * 45} className="chart-grid" /><text x="0" y={26 + i * 45} className="chart-label">{Math.round(max * (1 - i / 2))}</text></g>)}
 {!bars && <path d={`M${x(0)},112 ${values.map((v, i) => `L${x(i)},${y(v)}`).join(' ')} L${x(5)},112 Z`} className="chart-area" />}
 {values.map((v, i) => <g key={i}>{bars ? <><rect x={x(i) - 9} y={y(v)} width="8" height={112 - y(v)} rx="2" className="bar-received" /><rect x={x(i) + 2} y={y(secondary?.[i] || 0)} width="8" height={112 - y(secondary?.[i] || 0)} rx="2" className="bar-sold" /></> : <>{i > 0 && <line x1={x(i - 1)} y1={y(values[i - 1])} x2={x(i)} y2={y(v)} stroke={trendColor(values[i - 1], v)} strokeWidth="2.5" strokeLinecap="round" />}<circle cx={x(i)} cy={y(v)} r="3" fill={i > 0 ? trendColor(values[i - 1], v) : 'var(--primary)'} /></>}<text x={x(i)} y="137" textAnchor="middle" className="chart-label">{months[i]}</text><title>{months[i]}: {v}{bars ? ` received, ${secondary?.[i]} sold` : ''}</title></g>)}
 </svg>;
}
export function ProductCharts({ product }: { product: Product }) {
 const values = product.history.map(v => Math.round(v * product.cost));
 const diff = product.history[5] - product.history[4];
 return <div className="charts-grid">
 <ChartBlock title="Stock levels" value={`${product.stock}`} suffix="units on hand" diff={diff}><TrendChart values={product.history} /></ChartBlock>
 <ChartBlock title="Received vs. sold" value={`${product.received[5]}`} suffix="received this month" legend><TrendChart values={product.received} secondary={product.sold} bars /></ChartBlock>
 <ChartBlock title="Inventory value" value={money(product.stock * product.cost)} suffix="at cost" diff={diff}><TrendChart values={values} /></ChartBlock>
 </div>;
}
import type { ReactNode } from 'react';
function ChartBlock({ title, value, suffix, diff, children, legend }: { title: string; value: string; suffix: string; diff?: number; children: ReactNode; legend?: boolean }) {
 return <section className="chart-block"><div className="flex items-center justify-between"><h3>{title}</h3><span className="chart-period">6 months</span></div><div className="chart-number">{value} <span>{suffix}</span></div>{diff !== undefined ? <div className={`chart-change ${diff < 0 ? 'negative' : 'positive'}`}>{diff < 0 ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}{Math.abs(diff)} units vs. last month</div> : <div className="chart-legend"><span><i className="received-key" />Received</span><span><i className="sold-key" />Sold</span></div>}{children}</section>;
}
