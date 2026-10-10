import type { Product } from "./model";

export type DailyChartPoint = {
  date: string;
  stock: number;
  received: number;
  sold: number;
  value: number;
};
const monthDays = [31, 30, 31, 31, 30, 10];

// Daily values are illustrative subdivisions of the session's monthly demo data.
// Keep month totals and the latest stock exact when the demo inventory changes.
export function dailyChartData(product: Product): DailyChartPoint[] {
  return monthDays.flatMap((days, month) => {
    const end = product.history[month] ?? product.stock;
    const start = product.history[Math.max(0, month - 1)] ?? end;
    const receipts = product.received[month] ?? 0;
    const sales = product.sold[month] ?? 0;
    const distribute = (total: number, day: number) =>
      Math.floor((total * day) / days) - Math.floor((total * (day - 1)) / days);
    return Array.from({ length: days }, (_, index) => {
      const day = index + 1;
      const progress = day / days;
      const stock = Math.max(
        0,
        Math.round(
          start +
            (end - start) * progress +
            Math.sin(progress * Math.PI * 4) * Math.min(start, end, 6),
        ),
      );
      return {
        date: `2026-${String(month + 5).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        stock,
        received: distribute(receipts, day),
        sold: distribute(sales, day),
        value: stock * product.cost,
      };
    });
  });
}

export function chartDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

export const chartPeriods = ["Daily", "Weekly", "Monthly", "Yearly"] as const;
export type ChartPeriod = (typeof chartPeriods)[number];
export type PeriodChartPoint = DailyChartPoint & { startDate: string; label: string };

export function periodChartData(product: Product, period: ChartPeriod): PeriodChartPoint[] {
  const daily = dailyChartData(product);
  const groups = new Map<string, DailyChartPoint[]>();
  for (const point of daily) {
    const date = new Date(`${point.date}T12:00:00Z`);
    if (period === "Weekly") date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    const key =
      period === "Weekly"
        ? date.toISOString().slice(0, 10)
        : period === "Monthly"
          ? point.date.slice(0, 7)
          : period === "Yearly"
            ? point.date.slice(0, 4)
            : point.date;
    const group = groups.get(key) ?? [];
    group.push(point);
    groups.set(key, group);
  }
  const points = Array.from(groups.values()).flatMap((group) => {
    const first = group[0];
    const last = group.at(-1);
    if (!first || !last) return [];
    return [
      {
        ...last,
        startDate: first.date,
        label:
          period === "Monthly"
            ? new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(
                new Date(`${last.date}T12:00:00Z`),
              )
            : period === "Yearly"
              ? `${last.date.slice(0, 4)} YTD`
              : chartDate(first.date).replace(", 2026", ""),
        received: group.reduce((sum, point) => sum + point.received, 0),
        sold: group.reduce((sum, point) => sum + point.sold, 0),
      },
    ];
  });
  return period === "Daily" ? points.slice(-30) : points;
}

export function chartPeriodLabel(point: PeriodChartPoint, period: ChartPeriod) {
  if (period === "Daily") return chartDate(point.date);
  if (period === "Monthly")
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${point.date}T12:00:00Z`));
  if (period === "Yearly") return `${point.date.slice(0, 4)} · May 1 – Oct 10`;
  return `${chartDate(point.startDate).replace(", 2026", "")} – ${chartDate(point.date)}`;
}
