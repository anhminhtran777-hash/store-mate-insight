import { cocaColaCatalogue } from "./coca-cola-catalogue";

export const categories = [
  "Beverages",
  "Snacks",
  "Dairy",
  "Bakery",
  "Produce",
  "Household",
] as const;
export type Category = (typeof categories)[number];
export type Product = {
  id: string;
  name: string;
  size: string;
  category: Category;
  stock: number;
  threshold: number;
  price: number;
  cost: number;
  supplier: string;
  sku: string;
  barcode: string;
  /** Extra scan codes that also belong to this product (a product is not limited to one barcode). */
  barcodes?: string[] | undefined;
  /** Units in one wholesale stack/case; undefined means the item is only ordered by unit. */
  caseSize?: number | undefined;
  emoji: string;
  archived?: boolean;
  history: number[];
  received: number[];
  sold: number[];
};
export type Activity = {
  id: string;
  product: string;
  actor: string;
  action: string;
  before?: number | undefined;
  after?: number | undefined;
  amount?: number | undefined;
  flow?: "in" | "out" | "refund" | "customer-refund" | undefined;
  reason?: string | undefined;
  time: string;
};
export type Order = {
  id: string;
  supplier: string;
  status: "Draft" | "Approved" | "Received";
  date: string;
  lines: { productId: string; quantity: number }[];
};
export type DocLine = { name: string; quantity: number; unit: number; productId?: string };
export type StoreDocument = {
  id: string;
  kind: "Receipt" | "Refund receipt" | "Purchase order" | "Delivery note" | "Invoice" | "Goods receipt" | "Accounting invoice" | "Credit memo";
  reference: string;
  party: string;
  actor: string;
  time: string;
  lines: DocLine[];
  total: number;
  paid?: number | undefined;
  method?: "Cash" | "Card" | undefined;
  sentTo?: string | undefined;
  number?: string;
  relatedIds?: string[];
  demo?: boolean;
  reason?: string;
  note?: string;
  approvedBy?: string;
};
export type StoreState = {
  products: Product[];
  activities: Activity[];
  orders: Order[];
  documents: StoreDocument[];
  reports?: DocumentReport[] | undefined;
};
const rows: [string, string, Category, number, number, number, number, string, string][] = [
  [
    "Coca-Cola Original",
    "330 ml can",
    "Beverages",
    48,
    24,
    1.79,
    0.85,
    "Coca-Cola Distribution",
    "🥤",
  ],
  ["Pepsi Max", "330 ml can", "Beverages", 18, 24, 1.69, 0.79, "PepsiCo Wholesale", "🥤"],
  [
    "Evian Mineral Water",
    "500 ml bottle",
    "Beverages",
    72,
    30,
    1.49,
    0.55,
    "Metro Wholesale",
    "💧",
  ],
  ["Lay’s Classic", "150 g bag", "Snacks", 36, 20, 2.49, 1.15, "PepsiCo Wholesale", "🍟"],
  ["Snickers", "50 g bar", "Snacks", 12, 24, 1.29, 0.62, "Metro Wholesale", "🍫"],
  ["Oreo Original", "154 g pack", "Snacks", 28, 15, 2.19, 1.02, "Metro Wholesale", "🍪"],
  ["Whole Milk", "1 L carton", "Dairy", 8, 15, 1.89, 1.1, "Green Valley Dairy", "🥛"],
  ["Greek Yogurt", "150 g pot", "Dairy", 24, 12, 1.59, 0.78, "Green Valley Dairy", "🥣"],
  ["Sourdough Bread", "500 g loaf", "Bakery", 14, 10, 3.49, 1.65, "Sunrise Bakery", "🍞"],
  ["Butter Croissant", "Single pastry", "Bakery", 6, 12, 1.99, 0.8, "Sunrise Bakery", "🥐"],
  ["Bananas", "Per kg", "Produce", 22, 10, 1.79, 0.9, "Fresh Fields", "🍌"],
  ["Gala Apples", "Per kg", "Produce", 18, 10, 2.49, 1.2, "Fresh Fields", "🍎"],
  ["Kitchen Paper", "2-roll pack", "Household", 16, 8, 3.29, 1.6, "Metro Wholesale", "🧻"],
  ["Dishwashing Liquid", "500 ml bottle", "Household", 5, 10, 2.79, 1.3, "Metro Wholesale", "🧴"],
];
const existingDemoProducts: Product[] = rows.map((r, i) => ({
  id: `p${i + 1}`,
  name: r[0],
  size: r[1],
  category: r[2],
  stock: r[3],
  threshold: r[4],
  price: r[5],
  cost: r[6],
  supplier: r[7],
  emoji: r[8],
  sku: `SP-${String(1001 + i)}`,
  barcode: ean13(`500123${String(100000 + i * 7919).slice(-6)}`),
  // Coca-Cola Original also scans under its manufacturer barcode.
  barcodes: i === 0 ? ["5449000000996"] : undefined,
  // Demo items can be wholesaled by the stack; beverages ship in bigger cases.
  caseSize: r[2] === "Beverages" ? 24 : 12,
  history:
    i === 0
      ? [36, 62, 54, 82, 68, 48]
      : [r[3] + 12, r[3] + 28, r[3] + 18, r[3] + 40, r[3] + 14, r[3]],
  received: [120, 156, 144, 180, 168, 132].map((n) => Math.round(n / (1 + i * 0.3))),
  sold: [108, 130, 152, 152, 182, 152].map((n) => Math.round(n / (1 + i * 0.3))),
}));
/** Units per wholesale stack for a catalogue pack, estimated from its pack size. */
export function catalogueCaseSize(size: string): number {
  const s = size.toLowerCase();
  if (s.includes("glass bottle")) return 20;
  if (s.includes("can")) return 24;
  const ml = /(\d+(?:\.\d+)?)\s*(ml|l)\b/.exec(s);
  const liters = ml ? (ml[2] === "l" ? Number(ml[1]) : Number(ml[1]) / 1000) : 0;
  if (liters >= 1.5) return 6;
  if (liters >= 0.75) return 12;
  if (liters > 0) return 24;
  return 6; // coffee bags, spirits and other non-liter packs
}
/** Total units when ordering whole stacks of a product. */
export function stackUnits(product: Product, stacks: number): number {
  return Math.max(0, Math.round(stacks)) * (product.caseSize ?? 1);
}
// Catalogue-only packs start empty: requesting goods does not imply they are on the shelf.
export const demoProducts: Product[] = [...existingDemoProducts, ...cocaColaCatalogue.map((entry, i): Product => ({
  id: `cch-bg-${entry.key}`,
  name: entry.name,
  size: entry.size,
  category: "Beverages",
  supplier: "Coca-Cola Distribution",
  stock: 0,
  threshold: 12,
  cost: entry.cost,
  price: Math.round(entry.cost * 1.8 * 100) / 100,
  sku: `CCBG-${entry.key.toUpperCase()}`,
  barcode: ean13(`299${String(i + 1).padStart(9, "0")}`),
  caseSize: catalogueCaseSize(entry.size),
  emoji: entry.name.startsWith("Bankya") || entry.name.startsWith("Rosa") ? "💧" : "🥤",
  history: [0, 0, 0, 0, 0, 0],
  received: [0, 0, 0, 0, 0, 0],
  sold: [0, 0, 0, 0, 0, 0],
}))];
export const initialState: StoreState = {
  documents: [],
  products: demoProducts,
  activities: [
    {
      id: "a1",
      product: "Coca-Cola Original",
      actor: "Alex Morgan",
      action: "Stock sold",
      before: 60,
      after: 48,
      amount: 12 * 1.79,
      flow: "in",
      time: "2026-10-10T09:12:00Z",
    },
    {
      id: "a2",
      product: "Whole Milk",
      actor: "Jamie Lee",
      action: "Stock sold",
      before: 18,
      after: 8,
      amount: 10 * 1.89,
      flow: "in",
      time: "2026-10-10T08:45:00Z",
    },
    {
      id: "a3",
      product: "Evian Mineral Water",
      actor: "Alex Morgan",
      action: "Stock received",
      before: 24,
      after: 72,
      amount: 48 * 0.55,
      flow: "out",
      time: "2026-10-10T08:30:00Z",
    },
    {
      id: "a4",
      product: "Snickers",
      actor: "Jamie Lee",
      action: "Stock sold",
      before: 20,
      after: 12,
      amount: 8 * 1.29,
      flow: "in",
      time: "2026-10-09T17:20:00Z",
    },
  ],
  orders: [
    {
      id: "PO-1042",
      supplier: "PepsiCo Wholesale",
      status: "Draft",
      date: "Oct 10, 2026",
      lines: [
        { productId: "p2", quantity: 48 },
        { productId: "p4", quantity: 24 },
      ],
    },
    {
      id: "PO-1041",
      supplier: "Green Valley Dairy",
      status: "Draft",
      date: "Oct 10, 2026",
      lines: [{ productId: "p7", quantity: 24 }],
    },
    {
      id: "PO-1040",
      supplier: "Metro Wholesale",
      status: "Approved",
      date: "Oct 9, 2026",
      lines: [
        { productId: "p5", quantity: 48 },
        { productId: "p14", quantity: 12 },
      ],
    },
  ],
};
export const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
export const isLowStock = (p: Product) => !p.archived && p.stock <= p.threshold;
export const restockQuantity = (p: Product) =>
  Math.max(p.threshold * 2 - p.stock, p.threshold);
/** Builds a valid EAN-13 from 12 digits by appending the check digit. */
export function ean13(twelve: string): string {
  const d = twelve.replace(/\D/g, "").padStart(12, "0").slice(0, 12);
  const sum = [...d].reduce((n, c, i) => n + Number(c) * (i % 2 ? 3 : 1), 0);
  return d + String((10 - (sum % 10)) % 10);
}
export const removalReasons = ["Damaged", "Expired", "Theft or loss", "Count correction", "Own use"] as const;
export const returnReasons = ["Defective", "Damaged on arrival", "Wrong item", "Recalled", "Expired on arrival"] as const;
/** Takes units out of stock: a write-off (loss at cost) or a supplier return (refund at cost). */
export function removeStock(
  state: StoreState,
  id: string,
  quantity: number,
  kind: "remove" | "return",
  reason: string,
  actor: string,
  time: string,
): StoreState {
  const p = state.products.find((p) => p.id === id);
  if (!p || p.archived || !Number.isInteger(quantity) || quantity <= 0 || quantity > p.stock || !reason.trim())
    return state;
  const stock = p.stock - quantity;
  return {
    ...state,
    products: state.products.map((item) =>
      item.id === id ? { ...item, stock, history: [...item.history.slice(0, -1), stock] } : item,
    ),
    activities: [
      {
        id: `${time}-${id}-${kind}`,
        product: p.name,
        actor,
        action: kind === "return" ? `Returned to ${p.supplier}` : "Stock removed",
        reason,
        before: p.stock,
        after: stock,
        amount: quantity * p.cost,
        flow: kind === "return" ? "refund" : "out",
        time,
      },
      ...state.activities,
    ],
  };
}
export const trendColor = (before: number, after: number) =>
  after < before ? "var(--chart-down)" : "var(--primary)";
export function changeStock(
  state: StoreState,
  id: string,
  quantity: number,
  mode: "receive" | "sell",
  actor: string,
  time: string,
): StoreState {
  const p = state.products.find((p) => p.id === id);
  if (
    !p ||
    p.archived ||
    !Number.isInteger(quantity) ||
    quantity <= 0 ||
    (mode === "sell" && quantity > p.stock)
  )
    return state;
  const stock = p.stock + (mode === "receive" ? quantity : -quantity);
  return {
    ...state,
    products: state.products.map((item) =>
      item.id === id
        ? {
            ...item,
            stock,
            history: [...item.history.slice(0, -1), stock],
            received: item.received.map((n, i) =>
              i === 5 && mode === "receive" ? n + quantity : n,
            ),
            sold: item.sold.map((n, i) => (i === 5 && mode === "sell" ? n + quantity : n)),
          }
        : item,
    ),
    activities: [
      {
        id: `${time}-${id}`,
        product: p.name,
        actor,
        action: mode === "receive" ? "Stock received" : "Stock sold",
        before: p.stock,
        after: stock,
        amount: mode === "receive" ? quantity * p.cost : quantity * p.price,
        flow: mode === "receive" ? "out" : "in",
        time,
      },
      ...state.activities,
    ],
  };
}
/** Creates a validated supplier draft; approval and supplier paperwork remain separate. */
export function createPurchaseRequest(
  state: StoreState,
  supplier: string,
  lines: Order["lines"],
  actor: string,
  time: string,
): StoreState {
  if (!supplier.trim() || !lines.length || !Number.isFinite(Date.parse(time))) return state;
  const seen = new Set<string>();
  for (const line of lines) {
    const product = state.products.find((p) => p.id === line.productId);
    if (!product || product.archived || product.supplier !== supplier || seen.has(line.productId) ||
      !Number.isSafeInteger(line.quantity) || line.quantity <= 0) return state;
    seen.add(line.productId);
  }
  const next = state.orders.reduce((max, order) => {
    const match = /^PO-(\d+)$/.exec(order.id);
    return Math.max(max, Number(match?.[1] ?? 0));
  }, 1042) + 1;
  const id = `PO-${next}`;
  const order: Order = { id, supplier, status: "Draft", date: time.slice(0, 10), lines: lines.map((line) => ({ ...line })) };
  return {
    ...state,
    orders: [order, ...state.orders],
    activities: [{ id: `${time}-${id}-created`, product: id, actor, action: "Purchase request created", time }, ...state.activities],
  };
}
export function orderCost(state: StoreState, order: Order): number {
  return order.lines.reduce(
    (n, l) => n + l.quantity * (state.products.find((p) => p.id === l.productId)?.cost || 0),
    0,
  );
}
function orderDocument(
  state: StoreState,
  order: Order,
  kind: "Purchase order" | "Delivery note" | "Invoice" | "Goods receipt",
  actor: string,
  time: string,
): StoreDocument {
  const lines = order.lines.map((l) => {
    const p = state.products.find((p) => p.id === l.productId);
    return { name: p ? `${p.name} (${p.size})` : l.productId, quantity: l.quantity, unit: p?.cost ?? 0 };
  });
  return {
    id: `${kind}-${order.id}-${time}`,
    number: `${({ "Purchase order": "PO", "Delivery note": "DN", Invoice: "INV", "Goods receipt": "GR" })[kind]}-${order.id.replace(/^PO-/, "")}`,
    demo: kind !== "Purchase order",
    kind,
    reference: order.id,
    party: order.supplier,
    actor,
    time,
    lines,
    total: lines.reduce((n, l) => n + l.quantity * l.unit, 0),
  };
}
export function supplierDocuments(state: StoreState, orderId: string) {
  const docs = (state.documents ?? []).filter((d) => d.reference === orderId);
  return { invoice: docs.find((d) => d.kind === "Invoice"), delivery: docs.find((d) => d.kind === "Delivery note") };
}
/** Simulates supplier paperwork without changing stock or charging the budget again. */
export function confirmSupplier(state: StoreState, id: string, kind: "Invoice" | "Delivery note" | "Both", actor: string, time: string): StoreState {
  const order = state.orders.find((o) => o.id === id);
  if (!order || order.status !== "Approved") return state;
  const existing = supplierDocuments(state, id);
  const docs: StoreDocument[] = [];
  if ((kind === "Invoice" || kind === "Both") && !existing.invoice) docs.push(orderDocument(state, order, "Invoice", order.supplier, time));
  if ((kind === "Delivery note" || kind === "Both") && !existing.delivery) docs.push(orderDocument(state, order, "Delivery note", order.supplier, time));
  if (!docs.length) return state;
  return { ...state, documents: [...docs, ...(state.documents ?? [])], activities: [{ id: `${time}-${id}-confirmation`, product: id, actor, action: "Supplier confirmation recorded", time }, ...state.activities] };
}
export type CartLine = { productId: string; quantity: number };
/** Every scan code that belongs to a product: its main barcode plus any extras. */
export function productBarcodes(p: Product): string[] {
  return [p.barcode, ...(p.barcodes ?? [])];
}
export type BarcodeGroup = {
  barcode: string;
  items: Product[];
  stock: number;
  price: number;
  name: string;
  size: string;
  emoji: string;
  category: Category;
};
/**
 * Groups products by barcode: every ordered stack keeps one barcode, and
 * products sharing a barcode are displayed together with their quantities
 * summed. A product with several barcodes is filed under its main one; the
 * extras still find it when scanned.
 */
export function groupByBarcode(products: Product[]): BarcodeGroup[] {
  const groups = new Map<string, Product[]>();
  for (const p of products) {
    const list = groups.get(p.barcode) ?? [];
    list.push(p);
    groups.set(p.barcode, list);
  }
  return [...groups.entries()].map(([barcode, items]) => {
    const first = items[0]!;
    return {
      barcode,
      items,
      stock: items.reduce((n, p) => n + p.stock, 0),
      price: first.price,
      name: items.map((i) => i.name).join(" / "),
      size: [...new Set(items.map((i) => i.size))].join(" / "),
      emoji: first.emoji,
      category: first.category,
    };
  });
}
/**
 * Finds one sellable product from whatever the cashier typed: item code
 * (1–3 digits), full barcode (main or extra), SKU, exact name, or a unique
 * name/SKU/barcode substring. Returns "many" when the text matches several
 * products.
 */
export function findCashierItem(products: Product[], raw: string): Product | "many" | undefined {
  const query = raw.trim();
  if (!query) return undefined;
  const lower = query.toLowerCase();
  if (/^\d{1,3}$/.test(query)) {
    const byCode = products[Number(query) - 1];
    if (byCode) return byCode;
  }
  const exact = products.find(
    (p) =>
      productBarcodes(p).includes(query) ||
      p.sku.toLowerCase() === lower ||
      p.name.toLowerCase() === lower ||
      `${p.name} ${p.size}`.toLowerCase() === lower,
  );
  if (exact) return exact;
  const fuzzy = products.filter(
    (p) =>
      p.name.toLowerCase().includes(lower) ||
      `${p.name} ${p.size}`.toLowerCase().includes(lower) ||
      p.sku.toLowerCase().includes(lower) ||
      productBarcodes(p).some((b) => b.includes(query)),
  );
  if (fuzzy.length === 1) return fuzzy[0];
  return fuzzy.length > 1 ? "many" : undefined;
}
/** Sells a whole cart: lowers stock, logs each sale and issues one receipt. Rejects carts exceeding stock. */
export function checkout(
  state: StoreState,
  cart: CartLine[],
  method: "Cash" | "Card",
  paid: number | undefined,
  actor: string,
  time: string,
  receiptNo: string,
): { state: StoreState; receipt?: StoreDocument } {
  const lines: DocLine[] = [];
  for (const c of cart) {
    const p = state.products.find((p) => p.id === c.productId);
    if (!p || p.archived || !Number.isInteger(c.quantity) || c.quantity <= 0 || c.quantity > p.stock)
      return { state };
    lines.push({ name: p.name, quantity: c.quantity, unit: p.price, productId: p.id });
  }
  const total = lines.reduce((n, l) => n + l.quantity * l.unit, 0);
  if (!lines.length || (method === "Cash" && (paid ?? 0) < total - 0.001)) return { state };
  const sold = cart.reduce((s, c) => changeStock(s, c.productId, c.quantity, "sell", actor, time), state);
  const receipt: StoreDocument = {
    id: receiptNo,
    kind: "Receipt",
    reference: receiptNo,
    party: "Walk-in customer",
    actor,
    time,
    lines,
    total,
    paid: method === "Cash" ? paid : total,
    method,
  };
  return { state: { ...sold, documents: [receipt, ...(sold.documents ?? [])] }, receipt };
}
export function approveOrder(
  state: StoreState,
  id: string,
  actor: string,
  time: string,
): StoreState {
  const order = state.orders.find((o) => o.id === id);
  if (!order || order.status !== "Draft") return state;
  const amount = orderCost(state, order);
  return {
    ...state,
    orders: state.orders.map((o) => (o.id === id ? { ...o, status: "Approved" } : o)),
    documents: [orderDocument(state, order, "Purchase order", actor, time), ...(state.documents ?? [])],
    activities: [
      {
        id: `${time}-${id}`,
        product: id,
        actor,
        action: "Purchase order approved",
        amount,
        flow: "out",
        time,
      },
      ...state.activities,
    ],
  };
}
export function receiveOrder(
  state: StoreState,
  id: string,
  actor: string,
  time: string,
): StoreState {
  const order = state.orders.find((o) => o.id === id);
  if (!order || order.status !== "Approved") return state;
  const { invoice, delivery } = supplierDocuments(state, id);
  if (!invoice || !delivery) return state;
  const updated = order.lines.reduce(
    (s, line) => changeStock(s, line.productId, line.quantity, "receive", actor, time),
    state,
  );
  const amount = orderCost(state, order);
  return {
    ...updated,
    orders: updated.orders.map((o) => (o.id === id ? { ...o, status: "Received" } : o)),
    documents: [{ ...orderDocument(state, order, "Goods receipt", actor, time), relatedIds: [delivery.id, invoice.id] }, ...(updated.documents ?? [])].map((d) => d.reference === id ? { ...d, relatedIds: [...new Set([...(d.relatedIds ?? []), invoice.id, delivery.id, `${"Goods receipt"}-${id}-${time}`])].filter((related) => related !== d.id) } : d),
    activities: [
      {
        id: `${time}-${id}-received`,
        product: id,
        actor,
        action: "Purchase order received",
        amount,
        flow: "out",
        time,
      },
      ...updated.activities,
    ],
  };
}

export const customerRefundReasons = ["Defective item", "Changed mind", "Wrong item sold", "Expired product", "Overcharged", "Damaged packaging"] as const;
export const refundConditions = ["Resellable", "Damaged"] as const;
/** Refunds above this amount need a manager's name (common store policy). */
export const refundApprovalLimit = 20;
export const refundWindowDays = 30;
export type RefundLine = { productId: string; quantity: number };

/** Units of a product already refunded against a receipt. */
export function refundedQuantity(state: StoreState, receiptId: string, productId: string): number {
  return (state.documents ?? [])
    .filter((d) => d.kind === "Refund receipt" && d.reference === receiptId)
    .flatMap((d) => d.lines)
    .filter((l) => l.productId === productId)
    .reduce((n, l) => n + l.quantity, 0);
}

/**
 * Refunds items from a sales receipt to the original payment method. Resellable units return to stock;
 * damaged ones are logged as written off. Rejects over-refunds, expired receipts, missing reason, or
 * missing manager approval above the limit.
 */
export function refundSale(
  state: StoreState,
  input: {
    receiptId: string;
    lines: RefundLine[];
    reason: string;
    note: string;
    condition: (typeof refundConditions)[number];
    approvedBy?: string;
    actor: string;
    time: string;
    refundNo: string;
  },
): { state: StoreState; refund?: StoreDocument; error?: string } {
  const receipt = (state.documents ?? []).find((d) => d.id === input.receiptId && d.kind === "Receipt");
  if (!receipt) return { state, error: "Receipt not found." };
  if (Date.parse(input.time) - Date.parse(receipt.time) > refundWindowDays * 86400000)
    return { state, error: `Refunds are only accepted within ${refundWindowDays} days.` };
  if (!input.reason.trim()) return { state, error: "Choose a reason for the refund." };
  const lines: DocLine[] = [];
  for (const r of input.lines) {
    const sold = receipt.lines.find((l) => l.productId === r.productId);
    if (!sold || !Number.isInteger(r.quantity) || r.quantity <= 0) return { state, error: "Invalid refund item." };
    if (r.quantity > sold.quantity - refundedQuantity(state, receipt.id, r.productId))
      return { state, error: `Only ${sold.quantity - refundedQuantity(state, receipt.id, r.productId)} × ${sold.name} can still be refunded.` };
    lines.push({ name: sold.name, quantity: r.quantity, unit: sold.unit, productId: r.productId });
  }
  if (!lines.length) return { state, error: "Select at least one item to refund." };
  const total = lines.reduce((n, l) => n + l.quantity * l.unit, 0);
  if (total > refundApprovalLimit && !input.approvedBy?.trim())
    return { state, error: `Refunds over ${money(refundApprovalLimit)} need manager approval.` };
  const restock = input.condition === "Resellable";
  const reasonText = [input.reason, input.condition === "Damaged" ? "written off" : "returned to shelf", input.note.trim()]
    .filter(Boolean)
    .join(" · ");
  const products = state.products.map((p) => {
    const l = lines.find((x) => x.productId === p.id);
    return l && restock ? { ...p, stock: p.stock + l.quantity, history: p.history.map((h, i) => (i === 5 ? h + l.quantity : h)) } : p;
  });
  const activities: Activity[] = lines.map((l, i) => {
    const p = state.products.find((x) => x.id === l.productId);
    return {
      id: `${input.refundNo}-${i}`,
      product: l.name,
      actor: input.actor,
      action: `Customer refund (${receipt.id})`,
      before: p?.stock,
      after: p ? p.stock + (restock ? l.quantity : 0) : undefined,
      amount: l.quantity * l.unit,
      flow: "customer-refund",
      reason: reasonText,
      time: input.time,
    };
  });
  const refund: StoreDocument = {
    id: input.refundNo,
    kind: "Refund receipt",
    reference: receipt.id,
    party: receipt.party,
    actor: input.actor,
    time: input.time,
    lines,
    total,
    paid: total,
    method: receipt.method,
    reason: input.reason,
    note: input.note.trim() || undefined,
    approvedBy: input.approvedBy?.trim() || undefined,
  } as StoreDocument;
  return {
    state: { ...state, products, activities: [...activities, ...state.activities], documents: [refund, ...(state.documents ?? [])] },
    refund,
  };
}

/** Demo profiles: staff run the shop floor, managers get everything. */
export type Role = "Manager" | "Staff";
export const demoProfiles: Record<Role, string> = { Manager: "Demo Manager", Staff: "Demo Staff" };
export const staffPages = ["Inventory", "Cashier", "Purchase Orders", "Documents", "Settings"] as const;
export type Permission = "manageProducts" | "adjustStock" | "approveOrders" | "storeSettings" | "viewFinance";
export function canAccessPage(role: Role, page: string) {
  return role === "Manager" || (staffPages as readonly string[]).includes(page);
}
export function can(role: Role, _permission: Permission) {
  return role === "Manager";
}

/** Staff-raised problems with supplier paperwork; managers resolve them with supplier refunds. */
export const reportIssues = ["Missing items", "Damaged items", "Wrong item", "Price mismatch", "Other"] as const;
export type ReportLine = { name: string; quantity: number; unit: number; productId?: string | undefined };
export type DocumentReport = {
  id: string;
  documentId: string;
  documentLabel: string;
  supplier: string;
  reference: string;
  issue: (typeof reportIssues)[number];
  lines: ReportLine[];
  note: string;
  reporter: string;
  time: string;
  status: "Open" | "Refunded" | "Closed";
  resolvedBy?: string | undefined;
  resolution?: string | undefined;
  refund?: number | undefined;
};
export const reportableKinds: StoreDocument["kind"][] = ["Invoice", "Delivery note", "Goods receipt", "Purchase order"];
export const reportValue = (r: Pick<DocumentReport, "lines">) =>
  Math.round(r.lines.reduce((n, l) => n + l.quantity * l.unit, 0) * 100) / 100;
export function reportDocumentIssue(
  state: StoreState,
  doc: StoreDocument,
  issue: DocumentReport["issue"],
  lines: ReportLine[],
  note: string,
  reporter: string,
  time: string,
): StoreState {
  if (!reportableKinds.includes(doc.kind)) return state;
  const clean = lines.filter((l) => l.quantity > 0 && Number.isInteger(l.quantity));
  const original = new Map(doc.lines.map((l) => [l.name, l.quantity]));
  if (clean.some((l) => l.quantity > (original.get(l.name) ?? 0))) return state;
  if (!clean.length && !note.trim()) return state;
  const reports = state.reports ?? [];
  const report: DocumentReport = {
    id: `RPT-${String(reports.length + 1).padStart(3, "0")}`,
    documentId: doc.id,
    documentLabel: `${doc.kind} ${doc.number ?? doc.reference}`,
    supplier: doc.party,
    reference: doc.reference,
    issue,
    lines: clean,
    note: note.trim(),
    reporter,
    time,
    status: "Open",
  };
  return {
    ...state,
    reports: [report, ...reports],
    activities: [
      { id: `${time}-${report.id}`, product: doc.reference, actor: reporter, action: `Reported ${issue.toLowerCase()} (${report.id})`, reason: report.note || undefined, time },
      ...state.activities,
    ],
  };
}
/** Supplier refund for a report: money comes back into the purchase budget; stock is unchanged. */
export function refundReport(state: StoreState, id: string, amount: number, memo: string, actor: string, time: string): StoreState {
  const r = (state.reports ?? []).find((x) => x.id === id);
  if (!r || r.status !== "Open" || !(amount > 0)) return state;
  const refund = Math.round(amount * 100) / 100;
  const resolution = memo.trim() ? `Credit memo ${memo.trim()}` : "No credit memo";
  return {
    ...state,
    reports: (state.reports ?? []).map((x) => (x.id === id ? { ...x, status: "Refunded", refund, resolvedBy: actor, resolution } : x)),
    activities: [
      { id: `${time}-${id}-refund`, product: r.reference, actor, action: `Supplier refund for ${id}`, amount: refund, flow: "refund", reason: `${r.issue} — ${r.supplier} — ${resolution}`, time },
      ...state.activities,
    ],
  };
}
export function closeReport(state: StoreState, id: string, note: string, actor: string, time: string): StoreState {
  const r = (state.reports ?? []).find((x) => x.id === id);
  if (!r || r.status !== "Open") return state;
  return {
    ...state,
    reports: (state.reports ?? []).map((x) => (x.id === id ? { ...x, status: "Closed", resolvedBy: actor, resolution: note.trim() || "Closed without refund" } : x)),
    activities: [{ id: `${time}-${id}-close`, product: r.reference, actor, action: `Closed report ${id}`, reason: note.trim() || undefined, time }, ...state.activities],
  };
}
