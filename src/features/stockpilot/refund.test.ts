import { describe, expect, it } from "vitest";
import { checkout, initialState, refundSale } from "./model";

const t = "2026-10-10T10:00:00.000Z";
const sold = () => checkout(initialState, [{ productId: "p1", quantity: 3 }], "Card", undefined, "Alex", t, "R-1001").state;
const base = { receiptId: "R-1001", reason: "Defective item", note: "leaking", actor: "Alex", time: t, refundNo: "RF-1" };

describe("customer refunds", () => {
  it("restocks resellable items and reduces revenue", () => {
    const s = sold();
    const before = s.products.find((p) => p.id === "p1")!.stock;
    const r = refundSale(s, { ...base, lines: [{ productId: "p1", quantity: 1 }], condition: "Resellable" });
    expect(r.state.products.find((p) => p.id === "p1")!.stock).toBe(before + 1);
    expect(r.refund?.total).toBeCloseTo(1.79);
    expect(r.state.activities[0]?.flow).toBe("customer-refund");
  });
  it("does not restock damaged items", () => {
    const s = sold();
    const before = s.products.find((p) => p.id === "p1")!.stock;
    const r = refundSale(s, { ...base, lines: [{ productId: "p1", quantity: 1 }], condition: "Damaged" });
    expect(r.state.products.find((p) => p.id === "p1")!.stock).toBe(before);
  });
  it("cannot refund more than was sold, across refunds", () => {
    const first = refundSale(sold(), { ...base, lines: [{ productId: "p1", quantity: 2 }], condition: "Resellable" }).state;
    const r = refundSale(first, { ...base, refundNo: "RF-2", lines: [{ productId: "p1", quantity: 2 }], condition: "Resellable" });
    expect(r.refund).toBeUndefined();
  });
  it("rejects refunds after 30 days", () => {
    const r = refundSale(sold(), { ...base, time: "2026-11-15T10:00:00.000Z", lines: [{ productId: "p1", quantity: 1 }], condition: "Resellable" });
    expect(r.refund).toBeUndefined();
  });
  it("needs manager approval above $20", () => {
    const s = checkout(initialState, [{ productId: "p1", quantity: 12 }], "Card", undefined, "Alex", t, "R-1001").state;
    const args = { ...base, lines: [{ productId: "p1", quantity: 12 }], condition: "Resellable" as const };
    expect(refundSale(s, args).refund).toBeUndefined();
    expect(refundSale(s, { ...args, approvedBy: "Sam" }).refund).toBeDefined();
  });
});
