import { describe, expect, it } from "vitest";
import { initialState } from "./model";
import { storeAlerts } from "./notification-data";

describe("grouped store notifications", () => {
  it("groups unstocked catalogue packs instead of issuing one alert per pack", () => {
    const alerts = storeAlerts(initialState);
    const catalogue = alerts.find((a) => a.title.includes("catalogue"));
    expect(catalogue?.productIds.length).toBeGreaterThan(0);
    expect(catalogue?.productIds.length).toBeLessThanOrEqual(12);
    expect(alerts.length).toBeLessThan(15);
    expect(catalogue?.urgent).toBe(false);
  });
  it("excludes archived stock and completed orders", () => {
    const state = { ...initialState, products: initialState.products.map((p) => ({ ...p, archived: true })), orders: initialState.orders.map((o) => ({ ...o, status: "Received" as const })) };
    expect(storeAlerts(state)).toEqual([]);
  });
  it("changes alert identity when a stock quantity changes", () => {
    const before = storeAlerts(initialState).find((a) => a.productIds.includes("p2"));
    const state = { ...initialState, products: initialState.products.map((p) => p.id === "p2" ? { ...p, stock: p.stock - 1 } : p) };
    const after = storeAlerts(state).find((a) => a.productIds.includes("p2"));
    expect(before).toBeDefined();
    expect(after?.id).not.toBe(before?.id);
  });
});