import { describe, expect, it } from "vitest";
import { removeStock as _rm, ean13 as _ean } from "./model";
import {
  initialState,
  changeStock,
  approveOrder,
  receiveOrder,
  trendColor,
  isLowStock,
  restockQuantity,
  orderCost,
} from "./model";
const time = "2026-10-10T09:30:00Z";
describe("StockPilot inventory demo", () => {
  it("receiving stock updates quantity, October history, receipts and who changed it", () => {
    const s = changeStock(initialState, "p1", 24, "receive", "Alex Morgan", time);
    expect(s.products[0]?.stock).toBe(72);
    expect(s.products[0]?.history[5]).toBe(72);
    expect(s.products[0]?.received[5]).toBe(156);
    expect(s.activities[0]).toMatchObject({ actor: "Alex Morgan", before: 48, after: 72, time });
  });
  it("selling stock updates quantity and sales without permitting negative stock", () => {
    const s = changeStock(initialState, "p1", 12, "sell", "Jamie Lee", time);
    expect(s.products[0]?.stock).toBe(36);
    expect(s.products[0]?.sold[5]).toBe(164);
    expect(changeStock(s, "p1", 37, "sell", "Jamie Lee", time)).toBe(s);
  });
  it("selling stock logs the revenue earned at product price", () => {
    const s = changeStock(initialState, "p1", 12, "sell", "Jamie Lee", time);
    expect(s.activities[0]?.amount).toBeCloseTo(12 * 1.79);
    expect(s.activities[0]?.flow).toBe("in");
  });
  it("draft approval changes order status but not stock", () => {
    const s = approveOrder(initialState, "PO-1042", "Alex Morgan", time);
    expect(s.orders[0]?.status).toBe("Approved");
    expect(s.products[1]?.stock).toBe(18);
    expect(s.activities[0]?.action).toBe("Purchase order approved");
  });
  it("receiving approved order adds each line once", () => {
    const approved = approveOrder(initialState, "PO-1042", "Alex Morgan", time);
    const s = receiveOrder(approved, "PO-1042", "Alex Morgan", time);
    expect(s.products[1]?.stock).toBe(66);
    expect(s.products[3]?.stock).toBe(60);
    expect(s.orders[0]?.status).toBe("Received");
    expect(receiveOrder(s, "PO-1042", "Alex Morgan", time)).toBe(s);
  });
  it("draft orders cannot be received before approval", () => {
    expect(receiveOrder(initialState, "PO-1042", "Alex Morgan", time)).toBe(initialState);
  });
  it("downward chart segments use the strong red chart-down token", () => {
    expect(trendColor(82, 68)).toBe("var(--chart-down)");
    expect(trendColor(36, 62)).toBe("var(--primary)");
  });
  it("low stock excludes archived products and follows product reorder point", () => {
    expect(
      isLowStock(
        initialState.products[1] ??
          initialState.products[0] ??
          (() => {
            throw new Error("No products");
          })(),
      ),
    ).toBe(true);
    expect(
      isLowStock(
        initialState.products[0] ??
          (() => {
            throw new Error("No products");
          })(),
      ),
    ).toBe(false);
    const product = initialState.products[1];
    if (!product) throw new Error("Missing demo product");
    expect(isLowStock({ ...product, archived: true })).toBe(false);
  });
  it("manual restock tops up to twice the reorder point, at least one reorder point", () => {
    const low = initialState.products[1];
    const healthy = initialState.products[0];
    if (!low || !healthy) throw new Error("Missing demo products");
    expect(restockQuantity(low)).toBe(30);
    expect(restockQuantity(healthy)).toBe(24);
    const s = changeStock(initialState, low.id, restockQuantity(low), "receive", "Alex Morgan", time);
    expect(s.products[1]?.stock).toBe(low.stock + 30);
  });
  it("restocking logs the money spent at product cost", () => {
    const s = changeStock(initialState, "p2", 30, "receive", "Alex Morgan", time);
    expect(s.activities[0]?.amount).toBeCloseTo(30 * 0.79);
  });
  it("approving a purchase order logs its cost as spent", () => {
    const s = approveOrder(initialState, "PO-1042", "Alex Morgan", time);
    expect(s.activities[0]?.action).toBe("Purchase order approved");
    expect(s.activities[0]?.amount).toBeCloseTo(48 * 0.79 + 24 * 1.15);
  });
  it("received orders still count against the budget", () => {
    const approved = approveOrder(initialState, "PO-1042", "Alex Morgan", time);
    const s = receiveOrder(approved, "PO-1042", "Alex Morgan", time);
    const committed = s.orders.reduce((n, o) => n + orderCost(s, o), 0);
    expect(committed).toBeCloseTo(
      initialState.orders.reduce((n, o) => n + orderCost(initialState, o), 0),
    );
    expect(s.activities[0]?.action).toBe("Purchase order received");
    expect(s.activities[0]?.amount).toBeCloseTo(48 * 0.79 + 24 * 1.15);
  });
});

const _init = () => initialState;
describe("stock removal and supplier returns", () => {
  it("removes stock with a reason and logs the loss at cost", () => {
    const s = _rm(_init(), "p1", 4, "remove", "Damaged", "Alex", "t");
    expect(s.products.find((p) => p.id === "p1")?.stock).toBe(44);
    expect(s.activities[0]).toMatchObject({ reason: "Damaged", flow: "out" });
    expect(s.activities[0]?.amount).toBeCloseTo(3.4);
  });
  it("returns to supplier as a refund and refuses blank reasons or excess", () => {
    const s = _rm(_init(), "p1", 2, "return", "Defective", "Alex", "t");
    expect(s.activities[0]).toMatchObject({ flow: "refund" });
    expect(s.activities[0]?.amount).toBeCloseTo(1.7);
    expect(_rm(_init(), "p1", 2, "return", "", "A", "t").activities.length).toBe(_init().activities.length);
    expect(_rm(_init(), "p1", 999, "remove", "x", "A", "t").products[0]?.stock).toBe(48);
  });
  it("builds valid EAN-13 barcodes", () => {
    expect(_ean("400638133393")).toBe("4006381333931");
  });
});
