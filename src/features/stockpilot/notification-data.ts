import { isLowStock, type StoreState } from "./model";

export type StoreAlert = {
  id: string;
  category: "Stock" | "Orders";
  title: string;
  detail: string;
  nextStep: string;
  action: string;
  productIds: string[];
  to: "/" | "/orders";
  urgent: boolean;
};

// Group catalogue-only products separately from stock that has been traded.
export function storeAlerts(state: StoreState): StoreAlert[] {
  const groups = new Map<string, typeof state.products>();
  for (const product of state.products.filter(isLowStock)) {
    const catalogue = !product.history.some(Boolean) && !product.received.some(Boolean) && !product.sold.some(Boolean) && product.stock === 0;
    const key = `${product.supplier}|${catalogue ? "catalogue" : "stock"}`;
    groups.set(key, [...(groups.get(key) ?? []), product]);
  }
  const alerts: StoreAlert[] = [...groups.entries()].map(([key, products]) => {
    const catalogue = key.endsWith("|catalogue");
    const first = products[0];
    const empty = products.filter((p) => p.stock === 0).length;
    return {
      id: `stock:${key}:${products.map((p) => `${p.id}:${p.stock}:${p.threshold}`).join(",")}`,
      category: "Stock",
      title: catalogue ? `${products.length} unstocked catalogue items` : `${products.length} items need restocking`,
      detail: `${first?.supplier ?? "Supplier"}${!catalogue && empty ? ` · ${empty} out of stock` : ""}`,
      nextStep: catalogue ? "Review the available packs and request only the ones you want to carry." : "Review quantities and create a purchase request for this supplier.",
      action: "Review stock",
      productIds: products.map((p) => p.id),
      to: "/",
      urgent: !catalogue,
    };
  });
  for (const order of state.orders.filter((o) => o.status !== "Received")) {
    const invoice = state.documents?.some((d) => d.reference === order.id && d.kind === "Invoice");
    const delivery = state.documents?.some((d) => d.reference === order.id && d.kind === "Delivery note");
    alerts.push({
      id: `order:${order.id}:${order.status}:${invoice}:${delivery}`,
      category: "Orders",
      title: `${order.id} · ${order.status === "Draft" ? "Request awaiting approval" : invoice && delivery ? "Ready to receive" : "Supplier paperwork needed"}`,
      detail: `${order.supplier} · ${order.lines.length} item lines`,
      nextStep: order.status === "Draft" ? "Check the requested quantities and approve the purchase request." : invoice && delivery ? "Check the delivered quantities, then record receipt of the stock." : "Record the original invoice and delivery note before receiving stock.",
      action: "Review order",
      productIds: [],
      to: "/orders",
      urgent: true,
    });
  }
  return alerts.sort((a, b) => Number(b.urgent) - Number(a.urgent));
}