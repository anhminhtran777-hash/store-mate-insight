import { useId, useState, type ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesCombined,
  Package,
  Layers,
} from "lucide-react";
import { money, trendColor, type Product } from "./model";
import { chartDate, dailyChartData, type DailyChartPoint } from "./chart-data";

const months = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"];
type Metric = "stock" | "value" | "received";
function TrendChart({
  points,
  metric,
  active,
  onActive,
}: {
  points: DailyChartPoint[];
  metric: Metric;
  active: number | null;
  onActive: (index: number | null) => void;
}) {
  const id = useId().replace(/:/g, "");
  const bars = metric === "received";
  const max =
    Math.max(
      1,
      ...points.map((point) => point[metric]),
      ...(bars ? points.map((point) => point.sold) : []),
    ) * 1.18;
  const x = (index: number) => 36 + (index / Math.max(1, points.length - 1)) * 272;
  const y = (value: number) => 158 - (value / max) * 132;
  const selected = active === null ? undefined : points[active];
  const format = (value: number) => (metric === "value" ? money(value) : `${value} units`);
  return (
    <div className="chart-plot">
      <svg
        viewBox="0 0 324 190"
        className="trend-chart"
        role="img"
        tabIndex={0}
        aria-label={`${bars ? "Daily received and sold" : metric === "stock" ? "Daily stock levels" : "Daily inventory value"}; May 1 to October 10, 2026. Illustrative demo values. Use arrow keys to inspect dates.`}
        onPointerMove={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          const position = ((event.clientX - bounds.left) / bounds.width) * 324;
          onActive(
            Math.max(
              0,
              Math.min(
                points.length - 1,
                Math.round(((position - 36) / 272) * (points.length - 1)),
              ),
            ),
          );
        }}
        onPointerLeave={() => onActive(null)}
        onFocus={() => onActive(points.length - 1)}
        onBlur={() => onActive(null)}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            onActive(
              Math.max(
                0,
                Math.min(
                  points.length - 1,
                  (active ?? points.length - 1) + (event.key === "ArrowLeft" ? -1 : 1),
                ),
              ),
            );
          }
          if (event.key === "Escape") onActive(null);
        }}
      >
        <defs>
          <linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-area-top)" />
            <stop offset="100%" stopColor="var(--chart-area-bottom)" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((index) => (
          <g key={index}>
            <line
              x1="36"
              y1={26 + index * 44}
              x2="308"
              y2={26 + index * 44}
              className="chart-grid"
            />
            <text x="29" y={30 + index * 44} textAnchor="end" className="chart-label">
              {metric === "value"
                ? `$${Math.round(max * (1 - index / 3))}`
                : Math.round(max * (1 - index / 3))}
            </text>
          </g>
        ))}
        {!bars && (
          <path
            d={`M36,158 ${points.map((point, index) => `L${x(index)},${y(point[metric])}`).join(" ")} L308,158 Z`}
            fill={`url(#${id}-area)`}
          />
        )}
        {points.map((point, index) => {
          const previous = points[index - 1];
          return (
            <g key={point.date}>
              {bars ? (
                <>
                  <rect
                    x={x(index) - 0.65}
                    y={y(point.received)}
                    width=".85"
                    height={158 - y(point.received)}
                    rx=".4"
                    fill={
                      previous ? trendColor(previous.received, point.received) : "var(--primary)"
                    }
                  />
                  <rect
                    x={x(index) + 0.3}
                    y={y(point.sold)}
                    width=".85"
                    height={158 - y(point.sold)}
                    rx=".4"
                    fill={
                      previous && point.sold < previous.sold
                        ? "var(--destructive)"
                        : "var(--chart-sold)"
                    }
                  />
                </>
              ) : (
                previous && (
                  <line
                    x1={x(index - 1)}
                    y1={y(previous[metric])}
                    x2={x(index)}
                    y2={y(point[metric])}
                    stroke={trendColor(previous[metric], point[metric])}
                    strokeWidth="2.3"
                    strokeLinecap="round"
                  />
                )
              )}
              {point.date.endsWith("-01") && (
                <text x={x(index)} y="181" textAnchor="middle" className="chart-label">
                  {months[Number(point.date.slice(5, 7)) - 5]}
                </text>
              )}
            </g>
          );
        })}
        {selected && active !== null && (
          <g className="chart-active-marker">
            <line x1={x(active)} x2={x(active)} y1="18" y2="158" className="chart-crosshair" />
            <circle cx={x(active)} cy={y(selected[metric])} r="5" className="chart-focus-point" />
            {bars && (
              <circle cx={x(active)} cy={y(selected.sold)} r="4" className="chart-focus-sold" />
            )}
          </g>
        )}
      </svg>
      {selected && (
        <div
          className="chart-tooltip"
          role="tooltip"
          style={{
            left: `${Math.max(26, Math.min(74, ((active ?? 0) / (points.length - 1)) * 100))}%`,
          }}
        >
          <div className="chart-tooltip-date">
            <CalendarDays size={12} />
            {chartDate(selected.date)}
          </div>
          {bars ? (
            <>
              <div>
                <span>
                  <i className="received-key" />
                  Received
                </span>
                <strong>{selected.received} units</strong>
              </div>
              <div>
                <span>
                  <i className="sold-key" />
                  Sold
                </span>
                <strong>{selected.sold} units</strong>
              </div>
            </>
          ) : (
            <div>
              <span>{metric === "stock" ? "On hand" : "At cost"}</span>
              <strong>{format(selected[metric])}</strong>
            </div>
          )}
          <small>Illustrative daily demo</small>
        </div>
      )}
    </div>
  );
}
export function ProductCharts({ product }: { product: Product }) {
  const [active, setActive] = useState<number | null>(null);
  const points = dailyChartData(product);
  const diff = (product.history[5] ?? product.stock) - (product.history[4] ?? product.stock);
  return (
    <div className="charts-grid">
      <ChartBlock
        title="Stock levels"
        value={`${product.stock}`}
        suffix="units on hand"
        diff={diff}
        icon={<Package size={14} />}
      >
        <TrendChart points={points} metric="stock" active={active} onActive={setActive} />
      </ChartBlock>
      <ChartBlock
        title="Received vs. sold"
        value={`${product.received[5] ?? 0}`}
        suffix="received this month"
        icon={<Layers size={14} />}
      >
        <TrendChart points={points} metric="received" active={active} onActive={setActive} />
      </ChartBlock>
      <ChartBlock
        title="Inventory value"
        value={money(product.stock * product.cost)}
        suffix="at cost"
        diff={diff * product.cost}
        currency
        icon={<ChartNoAxesCombined size={14} />}
      >
        <TrendChart points={points} metric="value" active={active} onActive={setActive} />
      </ChartBlock>
    </div>
  );
}
function ChartBlock({
  title,
  value,
  suffix,
  diff,
  currency,
  children,
  icon,
}: {
  title: string;
  value: string;
  suffix: string;
  diff?: number;
  currency?: boolean;
  children: ReactNode;
  icon: ReactNode;
}) {
  return (
    <section className="chart-block">
      <div className="chart-block-heading">
        <h3>
          <span className="chart-icon">{icon}</span>
          {title}
        </h3>
        <span className="chart-period">6 months</span>
      </div>
      <div className="chart-number">
        {value}
        <span>{suffix}</span>
      </div>
      {diff !== undefined ? (
        <div className={`chart-change ${diff < 0 ? "negative" : "positive"}`}>
          {diff < 0 ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}
          {currency ? money(Math.abs(diff)) : `${Math.abs(diff)} units`} vs. last month
        </div>
      ) : (
        <div className="chart-legend">
          <span>
            <i className="received-key" />
            Received
          </span>
          <span>
            <i className="sold-key" />
            Sold
          </span>
        </div>
      )}
      {children}
      <div className="chart-footer">
        <span>May 1 – Oct 10, 2026</span>
        <span>Daily · Demo</span>
      </div>
    </section>
  );
}
