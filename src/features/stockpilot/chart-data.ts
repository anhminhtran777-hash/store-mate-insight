import type { Product } from "./model";

export type DailyChartPoint = { date: string; stock: number; received: number; sold: number; value: number };
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
      Math.floor(total * day / days) - Math.floor(total * (day - 1) / days);
    return Array.from({ length: days }, (_, index) => {
      const day = index + 1;
      const progress = day / days;
      const stock = Math.max(0, Math.round(start + (end - start) * progress + Math.sin(progress * Math.PI * 4) * Math.min(start, end, 6)));
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
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}