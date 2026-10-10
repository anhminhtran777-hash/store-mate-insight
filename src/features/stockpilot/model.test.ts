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
  checkout,
  confirmSupplier,
  createPurchaseRequest,
} from "./model";
const time = "2026-10-10T09:30:00Z";
describe("Bulgarian Coca-Cola supplier catalogue", () => {
  it("includes researched variants and distinct pack sizes under Coca-Cola Distribution", () => {
    const products = initialState.products.filter((p) => p.supplier === "Coca-Cola Distribution");
    expect(products.some((p) => p.name === "Coca-Cola Zero Sugar" && p.size === "330 ml can")).toBe(true);
    expect(products.some((p) => p.name === "Coca-Cola Zero Sugar" && p.size === "1.5 L bottle")).toBe(true);
    for (const brand of ["Fanta", "Sprite", "Schweppes", "Cappy", "Fuzetea", "Bankya", "Rosa", "Monster", "Powerade"]) expect(products.some((p) => p.name.startsWith(brand))).toBe(true);
    expect(new Set(initialState.products.map((p) => p.id)).size).toBe(initialState.products.length);
    expect(new Set(initialState.products.map((p) => p.barcode)).size).toBe(initialState.products.length);
    for (const p of products.filter((p) => p.id.startsWith("cch-bg-"))) {
      expect(p.stock).toBe(0);
      expect(p.history).toEqual([0, 0, 0, 0, 0, 0]);
      expect(p.received).toEqual([0, 0, 0, 0, 0, 0]);
      expect(p.sold).toEqual([0, 0, 0, 0, 0, 0]);
    }
  });
  it("keeps separate pack quantities on linked supplier invoices", () => {
    const small = initialState.products.find((p) => p.name === "Coca-Cola Zero Sugar" && p.size === "330 ml can");
    const large = initialState.products.find((p) => p.name === "Coca-Cola Zero Sugar" && p.size === "1.5 L bottle");
    if (!small || !large) throw new Error("Missing Bulgarian packs");
    const draft = createPurchaseRequest(initialState, "Coca-Cola Distribution", [{ productId: small.id, quantity: 24 }, { productId: large.id, quantity: 6 }], "Alex", time);
    const confirmed = confirmSupplier(approveOrder(draft, "PO-1043", "Alex", time), "PO-1043", "Both", "Alex", time);
    expect(confirmed.documents.find((d) => d.kind === "Invoice")?.lines).toEqual([
      { name: `${small.name} (${small.size})`, quantity: 24, unit: small.cost },
      { name: `${large.name} (${large.size})`, quantity: 6, unit: large.cost },
    ]);
  });
});
describe("manual purchase requests", () => {
  it("creates the chosen supplier and quantities as a uniquely numbered draft without stock or documents", () => {
    const s = createPurchaseRequest(initialState, "PepsiCo Wholesale", [{ productId: "p2", quantity: 12 }, { productId: "p4", quantity: 6 }], "Alex", time);
    expect(s.orders[0]).toEqual({ id: "PO-1043", supplier: "PepsiCo Wholesale", status: "Draft", date: "2026-10-10", lines: [{ productId: "p2", quantity: 12 }, { productId: "p4", quantity: 6 }] });
    expect(s.products).toBe(initialState.products);
    expect(s.documents).toBe(initialState.documents);
    expect(s.activities[0]?.amount).toBeUndefined();
    expect(createPurchaseRequest(s, "PepsiCo Wholesale", [{ productId: "p2", quantity: 1 }], "Alex", time).orders[0]?.id).toBe("PO-1044");
  });
  it("rejects empty requests, invalid quantities, duplicate lines, archived items and mismatched suppliers", () => {
    for (const lines of [[], [{ productId: "p2", quantity: 0 }], [{ productId: "p2", quantity: 1.5 }], [{ productId: "p1", quantity: 2 }], [{ productId: "missing", quantity: 2 }], [{ productId: "p2", quantity: 2 }, { productId: "p2", quantity: 3 }]]) {
      expect(createPurchaseRequest(initialState, "PepsiCo Wholesale", lines, "Alex", time)).toBe(initialState);
    }
    const archived = { ...initialState, products: initialState.products.map((p) => p.id === "p2" ? { ...p, archived: true } : p) };
    expect(createPurchaseRequest(archived, "PepsiCo Wholesale", [{ productId: "p2", quantity: 2 }], "Alex", time)).toBe(archived);
  });
  it("uses manual quantities in the invoice, delivery note and goods receipt after approval", () => {
    const draft = createPurchaseRequest(initialState, "PepsiCo Wholesale", [{ productId: "p2", quantity: 12 }, { productId: "p4", quantity: 6 }], "Alex", time);
    const approved = approveOrder(draft, "PO-1043", "Alex", time);
    const confirmed = confirmSupplier(approved, "PO-1043", "Both", "Alex", time);
    expect(confirmed.documents.find((d) => d.kind === "Invoice")?.total).toBeCloseTo(16.38);
    const received = receiveOrder(confirmed, "PO-1043", "Alex", time);
    expect(received.products.find((p) => p.id === "p2")?.stock).toBe(30);
    expect(received.products.find((p) => p.id === "p4")?.stock).toBe(42);
    for (const doc of received.documents.filter((d) => d.reference === "PO-1043")) expect(doc.lines.map((l) => l.quantity)).toEqual([12, 6]);
  });
});
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
    const s = receiveOrder(confirmSupplier(approved, "PO-1042", "Both", "Alex Morgan", time), "PO-1042", "Alex Morgan", time);
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
    const s = receiveOrder(confirmSupplier(approved, "PO-1042", "Both", "Alex Morgan", time), "PO-1042", "Alex Morgan", time);
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

describe("cashier checkout and supplier documents", () => {
  it("sells a cart, lowers stock and issues a receipt with change", () => {
    const r = checkout(initialState, [{ productId: "p1", quantity: 2 }], "Cash", 5, "Alex", time, "R-1");
    expect(r.state.products[0]?.stock).toBe(46);
    expect(r.receipt?.total).toBeCloseTo(3.58);
    expect(r.state.documents[0]?.kind).toBe("Receipt");
  });
  it("rejects cash that does not cover the total or more than in stock", () => {
    expect(checkout(initialState, [{ productId: "p1", quantity: 2 }], "Cash", 1, "A", time, "R").receipt).toBeUndefined();
    expect(checkout(initialState, [{ productId: "p1", quantity: 99 }], "Card", undefined, "A", time, "R").receipt).toBeUndefined();
  });
  it("approval creates only a purchase request, not an invoice", () => {
    const a = approveOrder(initialState, "PO-1042", "A", time);
    expect(a.documents.map((d) => d.kind)).toEqual(["Purchase order"]);
  });
  it("invoice-only confirmation cannot receive goods without a mandatory delivery note", () => {
    const a = confirmSupplier(approveOrder(initialState, "PO-1042", "A", time), "PO-1042", "Invoice", "A", time);
    expect(a.documents.filter((d) => d.kind === "Invoice")).toHaveLength(1);
    expect(receiveOrder(a, "PO-1042", "A", time)).toBe(a);
  });
  it("delivery-note confirmation cannot receive goods without the original invoice", () => {
    const a = confirmSupplier(approveOrder(initialState, "PO-1042", "A", time), "PO-1042", "Delivery note", "A", time);
    expect(a.documents.filter((d) => d.kind === "Delivery note")).toHaveLength(1);
    expect(receiveOrder(a, "PO-1042", "A", time)).toBe(a);
  });
  it("supplier confirmation does not change stock or charge the budget", () => {
    const a = approveOrder(initialState, "PO-1042", "A", time);
    const b = confirmSupplier(a, "PO-1042", "Both", "A", time);
    expect(b.products).toBe(a.products);
    expect(b.activities[0]?.amount).toBeUndefined();
    expect(confirmSupplier(b, "PO-1042", "Both", "A", time)).toBe(b);
  });
  it("receiving keeps the original invoice and delivery note and links a goods receipt", () => {
    const a = approveOrder(initialState, "PO-1042", "A", time);
    const confirmed = confirmSupplier(a, "PO-1042", "Both", "A", time);
    const b = receiveOrder(confirmed, "PO-1042", "A", time);
    expect(b.documents.map((d) => d.kind)).toEqual(["Goods receipt", "Invoice", "Delivery note", "Purchase order"]);
    expect(b.documents[0]?.relatedIds).toEqual(expect.arrayContaining([confirmed.documents[0]?.id, confirmed.documents[1]?.id]));
    expect(b.documents[0]?.lines.map((l) => l.quantity)).toEqual([48, 24]);
  });
});
