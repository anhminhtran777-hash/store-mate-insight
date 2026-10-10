import { describe, expect, it } from "vitest";
import { dailyChartData } from "./chart-data";
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
});
