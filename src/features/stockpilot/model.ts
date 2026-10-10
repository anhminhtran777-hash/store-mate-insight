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
  time: string;
};
export type Order = {
  id: string;
  supplier: string;
  status: "Draft" | "Approved" | "Received";
  date: string;
  lines: { productId: string; quantity: number }[];
};
export type StoreState = { products: Product[]; activities: Activity[]; orders: Order[] };
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
export const demoProducts: Product[] = rows.map((r, i) => ({
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
  history:
    i === 0
      ? [36, 62, 54, 82, 68, 48]
      : [r[3] + 12, r[3] + 28, r[3] + 18, r[3] + 40, r[3] + 14, r[3]],
  received: [120, 156, 144, 180, 168, 132].map((n) => Math.round(n / (1 + i * 0.3))),
  sold: [108, 130, 152, 152, 182, 152].map((n) => Math.round(n / (1 + i * 0.3))),
}));
export const initialState: StoreState = {
  products: demoProducts,
  activities: [
    {
      id: "a1",
      product: "Coca-Cola Original",
      actor: "Alex Morgan",
      action: "Stock sold",
      before: 60,
      after: 48,
      time: "2026-10-10T09:12:00Z",
    },
    {
      id: "a2",
      product: "Whole Milk",
      actor: "Jamie Lee",
      action: "Stock sold",
      before: 18,
      after: 8,
      time: "2026-10-10T08:45:00Z",
    },
    {
      id: "a3",
      product: "Evian Mineral Water",
      actor: "Alex Morgan",
      action: "Stock received",
      before: 24,
      after: 72,
      time: "2026-10-10T08:30:00Z",
    },
    {
      id: "a4",
      product: "Snickers",
      actor: "Jamie Lee",
      action: "Stock sold",
      before: 20,
      after: 12,
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
export const trendColor = (before: number, after: number) =>
  after < before ? "var(--destructive)" : "var(--primary)";
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
        time,
      },
      ...state.activities,
    ],
  };
}
export function approveOrder(
  state: StoreState,
  id: string,
  actor: string,
  time: string,
): StoreState {
  const order = state.orders.find((o) => o.id === id);
  if (!order || order.status !== "Draft") return state;
  return {
    ...state,
    orders: state.orders.map((o) => (o.id === id ? { ...o, status: "Approved" } : o)),
    activities: [
      { id: `${time}-${id}`, product: id, actor, action: "Purchase order approved", time },
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
  const updated = order.lines.reduce(
    (s, line) => changeStock(s, line.productId, line.quantity, "receive", actor, time),
    state,
  );
  return {
    ...updated,
    orders: updated.orders.map((o) => (o.id === id ? { ...o, status: "Received" } : o)),
  };
}
