import { describe, expect, it } from "vitest";
import { dailyChartData, periodChartData } from "./chart-data";
import { changeStock, initialState } from "./model";

describe("daily demo chart values", () => {
  const product = initialState.products[0];
  if (!product) throw new Error("Missing demo product");
  it("provides one dated point per day through the demo's October 10", () => {
    const points = dailyChartData(product);
    expect(points).toHaveLength(163);
    expect(points[0]?.date).toBe("2026-05-01");
    expect(points.at(-1)).toMatchObject({ date: "2026-10-10", stock: 48, value: 40.8 });
    expect(new Set(points.map((point) => point.date)).size).toBe(163);
  });
  it("preserves monthly received and sold totals", () => {
    const october = dailyChartData(product).filter((point) => point.date.startsWith("2026-10"));
    expect(october.reduce((sum, point) => sum + point.received, 0)).toBe(132);
    expect(october.reduce((sum, point) => sum + point.sold, 0)).toBe(152);
  });
  it("reflects a receipt in the latest daily stock and inventory value", () => {
    const updated = changeStock(initialState, "p1", 24, "receive", "Alex", "2026-10-10T10:00:00Z")
      .products[0];
    if (!updated) throw new Error("Missing updated product");
    expect(dailyChartData(updated).at(-1)).toMatchObject({ stock: 72, value: 61.199999999999996 });
  });
  it("daily shows the latest 30 days and monthly shows all six months", () => {
    expect(periodChartData(product, "Daily")).toHaveLength(30);
    const monthly = periodChartData(product, "Monthly");
    expect(monthly).toHaveLength(6);
    expect(monthly.map(point => point.received)).toEqual([120, 156, 144, 180, 168, 132]);
    expect(monthly.map(point => point.stock)).toEqual([36, 62, 54, 82, 68, 48]);
  });
  it("weekly sums flows but uses closing stock rather than summing inventory", () => {
    const weekly = periodChartData(product, "Weekly");
    expect(weekly).toHaveLength(24);
    expect(weekly.reduce((sum, point) => sum + point.received, 0)).toBe(900);
    expect(weekly.reduce((sum, point) => sum + point.sold, 0)).toBe(976);
    expect(weekly.at(-1)?.stock).toBe(48);
  });
  it("yearly only aggregates available demo history without inventing other years", () => {
    const yearly = periodChartData(product, "Yearly");
    expect(yearly).toHaveLength(1);
    expect(yearly[0]).toMatchObject({ label: "2026 YTD", received: 900, sold: 976, stock: 48, value: 40.8 });
  });
});
