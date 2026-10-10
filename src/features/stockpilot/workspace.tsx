import { ExtraSettings, extraTabs, type ExtraTab } from "./settings-extra";
import { useState, type FormEvent } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Calculator,
  FileText,
  Package,
  Bot,
  ShoppingCart,
  History,
  Settings,
  ChevronsUpDown,
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  ArrowDownToLine,
  Pencil,
  Archive,
  ArrowUpRight,
  TriangleAlert,
  SlidersHorizontal,
  Leaf,
  LogOut,
  Store,
  Check,
  PackageCheck,
  Milk,
  Cookie,
  Coffee,
  Wheat,
  Apple,
  SprayCan,
  PackagePlus,
  Wallet,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { findAccount, setCurrentAccount, usePref } from "./accounts";
import { useStockPilot } from "./store";
import {
  categories,
  isLowStock,
  money,
  restockQuantity,
  changeStock,
  removeStock,
  removalReasons,
  returnReasons,
  ean13,
  approveOrder,
  receiveOrder,
  confirmSupplier,
  supplierDocuments,
  orderCost,
  createPurchaseRequest,
  requestAllLowStock,
  stackUnits,
  type Product,
  canAccessPage,
  demoProfiles,
} from "./model";
import { ProductCharts } from "./charts";
import { Assistant } from "./assistant";
import { Cashier, Documents } from "./cashier";
import { AppearanceSettings } from "./appearance";
import { NotificationCenter } from "./notifications";
import { ReportsPanel } from "./reports";
import { Flag } from "lucide-react";
import logoAsset from "@/assets/stock-genie-logo.png.asset.json";
const navItems = [
  { name: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { name: "Inventory", to: "/", icon: Package },
  { name: "Cashier", to: "/cashier", icon: Calculator },
  { name: "AI Assistant", to: "/assistant", icon: Bot },
  { name: "Purchase Orders", to: "/orders", icon: ShoppingCart },
  { name: "Documents", to: "/documents", icon: FileText },
  { name: "Reports", to: "/reports", icon: Flag },
  { name: "Activity Log", to: "/activity", icon: History },
  { name: "Settings", to: "/settings", icon: Settings },
] as const;
const categoryIcons = {
  Beverages: Coffee,
  Snacks: Cookie,
  Dairy: Milk,
  Bakery: Wheat,
  Produce: Apple,
  Household: SprayCan,
};
export function Logo() {
  return (
    <div className="logo">
      <img src={logoAsset.url} alt="Stock Genie logo" className="logo-image" width={40} height={40} />
      <span>
        Stock Genie<span className="logo-dot">.</span>
      </span>
    </div>
  );
}
export function Workspace({ page = "Inventory", settingsTab }: { page?: string; settingsTab?: "profile" | "appearance" }) {
  const { state, user, role, storeName, pinned, setPinned, budget } = useStockPilot();
  const manager = role === "Manager";
  const allowed = canAccessPage(role, page);
  const committed = state.orders.reduce((n, o) => n + orderCost(state, o), 0);
  const refunds = state.activities
    .filter((a) => a.flow === "refund")
    .reduce((n, a) => n + (a.amount ?? 0), 0);
  const budgetLeft = budget - committed + refunds;
  const revenue = state.activities
    .reduce((n, a) => n + (a.flow === "in" ? (a.amount ?? 0) : a.flow === "customer-refund" ? -(a.amount ?? 0) : 0), 0);
  const [hover, setHover] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const [filter, setFilter] = useState<"all" | "low" | "archived">("all");
  const [modal, setModal] = useState<ModalMode>(
    null,
  );
  const path = useRouterState({ select: (s) => s.location.pathname });
  const active = state.products.filter((p) => !p.archived);
  const low = active.filter(isLowStock);
  return (
    <div className={`app-shell ${pinned ? "sidebar-pinned" : ""}`}>
      <div className="edge-target" onMouseEnter={() => setHover(true)} />
      <aside
        className={`sidebar ${pinned || hover ? "sidebar-open" : ""}`}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div className="sidebar-top">
          <Logo />
        </div>
        <div className="store-switch">
          <span className="store-icon">
            <Store size={18} />
          </span>
          <div>
            <strong>{storeName}</strong>
            <span>Main store</span>
          </div>
          <ChevronsUpDown size={14} />
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav className="main-nav">
          {navItems.filter((n) => canAccessPage(role, n.name)).map((n) => (
            <Button key={n.name} asChild variant={path === n.to ? "nav-active" : "nav"}>
              <Link to={n.to}>
                <n.icon size={18} />
                <span>{n.name}</span>
                {n.name === "Inventory" && <small>{active.length}</small>}
                {n.name === "Purchase Orders" && <i className="nav-order-dot" />}
                {n.name === "Reports" && (state.reports ?? []).some((r) => r.status === "Open") && <small>{(state.reports ?? []).filter((r) => r.status === "Open").length}</small>}
              </Link>
            </Button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="store-status">
            <span />
            Store systems healthy
            <ArrowUpRight size={13} />
          </div>
          <div className="sidebar-user">
            <div className="avatar">
              {user
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              <strong>{user}</strong>
              <span>{role === "Manager" ? "Store manager" : "Store staff"}</span>
            </div>
            <Button asChild variant="nav-icon" size="icon" title="Sign out">
              <Link to="/login" onClick={() => setCurrentAccount(null)}>
                <LogOut />
              </Link>
            </Button>
          </div>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace
            <ChevronRight size={14} />
            <strong>{page}</strong>
          </div>
          <div className="topbar-right">
            <span className="demo-pill">
              <span />
              Demo workspace
            </span>
            <div className="notification-anchor">
              <NotificationCenter />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="avatar small avatar-trigger" title={`${user} · ${role}`} aria-label="Account menu">{role === "Manager" ? "DM" : "DS"}</button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="profile-menu">
                <DropdownMenuLabel>
                  <div className="profile-menu-user">
                    <div className="avatar">{user.split(" ").map((n) => n[0]).join("").slice(0, 2)}</div>
                    <div>
                      <strong>{user}</strong>
                      <span>{role === "Manager" ? "Store manager" : "Store staff"}</span>
                    </div>
                  </div>
                  <div className="profile-menu-store"><Store size={13} /> {storeName} · Main store</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/settings" search={{ tab: "profile" }}><Settings size={15} /> Store profile & settings</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/settings" search={{ tab: "appearance" }}><SlidersHorizontal size={15} /> Appearance & themes</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/login" onClick={() => setCurrentAccount(null)}><LogOut size={15} /> Sign out</Link></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">YOUR STORE, IN FOCUS</div>
              <h1>{page === "Inventory" ? "Inventory overview" : page}</h1>
              <p>
                {page === "Inventory"
                  ? "Keep your shelves stocked. Keep your business moving."
                  : page === "Dashboard"
                    ? "A clear picture of what’s happening in your store."
                    : page === "Cashier"
                      ? "Ring up sales fast — the numpad does it all."
                      : page === "Documents"
                        ? "Receipts and supplier paperwork, all in one place."
                        : page === "Purchase Orders"
                      ? "From a smarter reorder to a well-stocked shelf."
                      : page === "Reports"
                      ? "Issues staff found on supplier paperwork, ready to resolve."
                    : page === "Activity Log"
                        ? "Every change, with a clear trail."
                        : page === "Settings"
                          ? "Make Stock Genie feel like your store."
                          : "Good decisions start with the right insights."}
              </p>
            </div>
            {page === "Inventory" && manager && (
              <Button onClick={() => setModal("create")}>
                <Plus />
                Add product
              </Button>
            )}
            {allowed && page === "Dashboard" && (
              <Button asChild>
                <Link to="/">
                  View inventory
                  <ArrowUpRight />
                </Link>
              </Button>
            )}
          </div>
          {allowed && ["Inventory", "Dashboard"].includes(page) && (
            <div className="metrics">
              <Metric
                title="Total products"
                value={String(active.length)}
                icon={<Package />}
                note="Across 6 categories"
                trend="All active products"
              />
              <Metric
                title="Inventory value"
                value={money(active.reduce((n, p) => n + p.stock * p.cost, 0))}
                icon={<ShoppingCart />}
                note="Total stock at cost"
                trend="Live inventory value"
              />
              {manager && <Metric
                title="Purchase budget"
                value={money(budgetLeft)}
                icon={<Wallet />}
                note={`${money(committed)} committed of ${money(budget)}`}
                trend={budgetLeft < 0 ? "Over budget" : "Left to spend this month"}
                warning={budgetLeft < 0}
              />}
              {manager && <Metric
                title="Revenue"
                value={money(revenue)}
                icon={<TrendingUp />}
                note="From sold stock"
                trend="Sales this session"
              />}
              <Metric
                title="Low-stock items"
                value={String(low.length)}
                icon={<TriangleAlert />}
                warning
                note="Below reorder point"
                trend="Need your attention"
              />
              <Metric
                title="Pending orders"
                value={String(state.orders.filter((o) => o.status === "Draft").length)}
                icon={<ArrowDownToLine />}
                note="Awaiting approval"
                trend="Ready for review"
              />
            </div>
          )}
          {!allowed && (
            <section className="settings-section">
              <h2>Manager access only</h2>
              <p>Your Demo Staff profile can use Inventory, Cashier, Purchase Orders, Documents and Settings. Ask a manager for this page.</p>
              <Button asChild><Link to="/">Back to inventory</Link></Button>
            </section>
          )}
          {allowed && page === "Inventory" && (
            <div className="inventory-split">
              <section className="product-list">
                <div className="section-heading">
                  <h2>
                    All products <span>{active.length}</span>
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Toggle low stock filter"
                    title="Show low stock"
                    onClick={() => setFilter(filter === "low" ? "all" : "low")}
                  >
                    <SlidersHorizontal size={16} />
                  </Button>
                </div>
                <div className="search-input">
                  <Search size={16} />
                  <input
                    placeholder="Search products..."
                    aria-label="Search products"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <span>⌕</span>
                </div>
                <div className="list-filters">
                  <select
                    aria-label="Filter category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option>All categories</option>
                    {categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Stock status"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as "all" | "low" | "archived")}
                  >
                    <option value="all">All stock</option>
                    <option value="low">Low stock</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="list-column-head">
                  <span>PRODUCT</span>
                  <span>STOCK</span>
                </div>
                <div className="product-scroll">
                  {state.products
                    .filter(
                      (p) =>
                        (filter === "archived" ? p.archived : !p.archived) &&
                        (filter !== "low" || isLowStock(p)) &&
                        (category === "All categories" || p.category === category) &&
                        `${p.name} ${p.size} ${p.supplier} ${p.category} ${p.sku}`
                          .toLowerCase()
                          .includes(query.toLowerCase()),
                    )
                    .map((p) => (
                      <ProductRow key={p.id} product={p} />
                    ))}
                  {!state.products.some(
                    (p) =>
                      (filter === "archived" ? p.archived : !p.archived) &&
                      (filter !== "low" || isLowStock(p)) &&
                      (category === "All categories" || p.category === category) &&
                      `${p.name} ${p.size} ${p.supplier} ${p.category} ${p.sku}`
                        .toLowerCase()
                        .includes(query.toLowerCase()),
                  ) && <div className="empty-state">No matching products.</div>}
                </div>
                <div className="list-footer">
                  <span>{active.length} products in your store</span>
                  <span className="live-dot" />
                  Live
                </div>
              </section>
              <ProductDetail open={setModal} />
            </div>
          )}
          {allowed && page === "Dashboard" && <Dashboard />}
          {allowed && page === "AI Assistant" && <Assistant />}
          {page === "Purchase Orders" && <Orders />}
          {page === "Cashier" && <Cashier />}
          {allowed && page === "Documents" && <Documents />}
          {allowed && page === "Reports" && <ReportsPanel />}
          {allowed && page === "Activity Log" && <ActivityTable />}
          {page === "Settings" && <StoreSettings initialTab={settingsTab ?? "profile"} />}
          <footer className="page-footer">
            <span>
              <Leaf size={12} /> A little more control. A lot less guesswork.
            </span>
            <span>
              Stock Genie <span className="footer-separator">/</span> Demo environment
            </span>
          </footer>
        </main>
      </div>
      <ProductModal mode={modal} close={() => setModal(null)} />
    </div>
  );
}
import type { ReactNode } from "react";
function Metric({
  title,
  value,
  icon,
  note,
  trend,
  warning,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  note: string;
  trend: string;
  warning?: boolean;
}) {
  return (
    <section className={`metric ${warning ? "warning-metric" : ""}`}>
      <div className="metric-top">
        <span>{title}</span>
        <span className="metric-icon">{icon}</span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-bottom">
        <span className={warning ? "negative" : "positive"}>
          {warning ? <TriangleAlert size={12} /> : <ArrowUpRight size={12} />}
          {trend}
        </span>
        <span>{note}</span>
      </div>
    </section>
  );
}
function ProductRow({ product: p }: { product: Product }) {
  const { selectedId, select } = useStockPilot();
  const Icon = categoryIcons[p.category];
  return (
    <Button
      variant="product"
      className={selectedId === p.id ? "selected-product" : ""}
      onClick={() => select(p.id)}
    >
      <span className={`product-thumbnail category-${p.category.toLowerCase()}`}>
        <Icon size={22} />
      </span>
      <span className="product-row-name">
        <strong>{p.name}</strong>
        <span>
          <i className={`category-dot category-${p.category.toLowerCase()}`} />
          {p.category}
          <span className="product-size"> · {p.size}</span>
        </span>
      </span>
      <span className={`stock-number ${isLowStock(p) ? "low-stock" : ""}`}>
        <strong>{p.stock}</strong>
        <small>{isLowStock(p) ? "Low stock" : "units"}</small>
      </span>
    </Button>
  );
}
type ModalMode = "create" | "edit" | "receive" | "sell" | "archive" | "remove" | "return" | null;
function ProductDetail({
  open,
}: {
  open: (mode: Exclude<ModalMode, "create" | null>) => void;
}) {
  const { state, setState, selectedId, user, role } = useStockPilot();
  const p = state.products.find((p) => p.id === selectedId);
  if (!p) return <div className="empty-state">Select a product.</div>;
  const Icon = categoryIcons[p.category];
  return (
    <section className="product-detail">
      <div className="detail-topline">
        <span>PRODUCT DETAILS</span>
        <span className="status-tag">
          <i />
          {p.archived ? "Archived" : "Active product"}
        </span>
      </div>
      <div className="detail-hero">
        <div className={`detail-image category-${p.category.toLowerCase()}`}>
            <span className="detail-emoji">{p.emoji}</span>

        </div>
        <div className="detail-product-title">
          <span className={`category-tag category-${p.category.toLowerCase()}`}>
            <Icon size={12} />
            {p.category}
          </span>
          <h2>{p.name}</h2>
          <p>
            {p.size} <span>·</span> ID: {p.id.toUpperCase()} <span>·</span> SKU: {p.sku}
          </p>
          <p className="barcode-line" aria-label={`Barcode ${p.barcode}`}>
            <span className="barcode-bars" aria-hidden="true">
              {[...(p.barcode ?? "")].map((c, i) => (
                <i key={i} style={{ width: `${(Number(c) % 3) + 1}px` }} />
              ))}
            </span>
            <code>{p.barcode ?? "—"}</code>
          </p>
          {role === "Manager" && <div className="detail-actions">
            <Button variant="outline" size="sm" onClick={() => open("edit")}>
              <Pencil size={13} />
              Edit product
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Archive product"
              title="Archive product"
              disabled={p.archived}
              onClick={() => open("archive")}
            >
              <Archive size={15} />
            </Button>
          </div>}
        </div>
      </div>
      <div className="detail-stat-grid">
        <div>
          <span>Current stock</span>
          <strong>
            {p.stock} <small>units</small>
          </strong>
          <span className={isLowStock(p) ? "negative" : "positive"}>
            <i className="inline-dot" />
            {isLowStock(p) ? "Reorder soon" : "Healthy stock"}
          </span>
        </div>
        <div>
          <span>Selling price</span>
          <strong>{money(p.price)}</strong>
          <span>Per unit</span>
        </div>
        <div>
          <span>Cost price</span>
          <strong>{money(p.cost)}</strong>
          <span>Per unit</span>
        </div>
        <div>
          <span>Profit margin</span>
          <strong>
            {Math.round(((p.price - p.cost) / p.price) * 100)}
            <small>%</small>
          </strong>
          <span>{money(p.price - p.cost)} per unit</span>
        </div>
      </div>
      <div className="supplier-line">
        <div>
          <span className="supplier-icon">
            <Store size={17} />
          </span>
          <div>
            <span>Supplier</span>
            <strong>{p.supplier}</strong>
          </div>
        </div>
        <span>
          Reorder point <strong>{p.threshold} units</strong>
        </span>
      </div>
      <div className="chart-section-heading">
        <h3>Performance at a glance</h3>
        <span>
          May – Oct 2026
          <ChevronDown size={12} />
        </span>
      </div>
      <ProductCharts product={p} />
      <div className="detail-bottom">
        <span>
          <span className="live-dot" />
          Stock levels update in real time
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={p.archived || p.stock === 0}
          onClick={() => open("sell")}
        >
          Record sale
        </Button>
        {role === "Manager" && <>
        <Button size="sm" disabled={p.archived} onClick={() => open("receive")}>
          <ArrowDownToLine />
          Receive stock
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={p.archived}
          title={`Restock to ${p.threshold * 2} units`}
          onClick={() =>
            setState((s) =>
              changeStock(s, p.id, restockQuantity(p), "receive", user, new Date().toISOString()),
            )
          }
        >
          <PackagePlus />
          Restock now
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={p.archived || p.stock === 0}
          onClick={() => open("remove")}
        >
          Remove stock
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={p.archived || p.stock === 0}
          onClick={() => open("return")}
        >
          Return to supplier
        </Button>
        </>}
      </div>
      <div className="recent-activity">
        <div className="section-heading">
          <h3>Recent activity</h3>
          <Button asChild variant="link" size="sm">
            <Link to="/activity">
              View all
              <ArrowUpRight size={13} />
            </Link>
          </Button>
        </div>
        {state.activities
          .filter((a) => a.product === p.name)
          .slice(0, 2)
          .map((a) => (
            <div className="mini-activity" key={a.id}>
              <span className="activity-icon">
                <History size={14} />
              </span>
              <div>
                <strong>{a.action}</strong>
                <span>
                  {a.actor} ·{" "}
                  {new Date(a.time).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <span
                className={
                  a.after !== undefined && a.before !== undefined && a.after < a.before
                    ? "negative"
                    : "positive"
                }
              >
                {a.before} <span>→</span> {a.after} units
              </span>
            </div>
          ))}
        {!state.activities.some((a) => a.product === p.name) && (
          <p className="text-sm text-muted-foreground py-4">
            No changes recorded for this product yet.
          </p>
        )}
      </div>
    </section>
  );
}
function ProductModal({
  mode,
  close,
}: {
  mode: ModalMode;
  close: () => void;
}) {
  const { state, setState, selectedId, select, user } = useStockPilot();
  const p = state.products.find((p) => p.id === selectedId);
  const [error, setError] = useState("");
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const time = new Date().toISOString();
    if (mode === "receive" || mode === "sell") {
      const q = Number(data.get("quantity"));
      if (!p || q <= 0 || !Number.isInteger(q) || (mode === "sell" && q > p.stock)) {
        setError("Enter a valid whole quantity within available stock.");
        return;
      }
      setState((s) => changeStock(s, p.id, q, mode, user, time));
    } else if (mode === "remove" || mode === "return") {
      const q = Number(data.get("quantity"));
      const memoNo = String(data.get("memoNumber") ?? "").trim();
      const memoDate = String(data.get("memoDate") ?? "");
      const noMemo = data.get("noMemo") === "on";
      const memo =
        mode !== "return" ? "" : noMemo ? "No credit memo" : `Credit memo ${memoNo} (${memoDate})`;
      const reason = [String(data.get("reason") ?? ""), String(data.get("note") ?? "").trim(), memo]
        .filter(Boolean)
        .join(" — ");
      if (!p || q <= 0 || !Number.isInteger(q) || q > p.stock) {
        setError("Enter a valid whole quantity within available stock.");
        return;
      }
      if (mode === "return" && !noMemo && (!memoNo || !memoDate)) {
        setError("Enter the credit memo number and date, or tick “No credit memo”.");
        return;
      }
      setState((s) => removeStock(s, p.id, q, mode, reason, user, time));
    } else if (mode === "archive" && p) {
      setState((s) => ({
        ...s,
        products: s.products.map((item) => (item.id === p.id ? { ...item, archived: true } : item)),
        activities: [
          { id: time, product: p.name, actor: user, action: "Product archived", time },
          ...s.activities,
        ],
      }));
      const next = state.products.find((item) => item.id !== p.id && !item.archived);
      if (next) select(next.id);
    } else if (mode === "create" || mode === "edit") {
      const id = mode === "edit" && p ? p.id : `p-${Date.now()}`;
      const cat = categories.find((c) => c === data.get("category")) || "Beverages";
      const name = String(data.get("name")).trim();
      const stock = Number(data.get("stock"));
      const price = Number(data.get("price"));
      const cost = Number(data.get("cost"));
      if (!name || cost > price) {
        setError("Enter a name and a selling price at least equal to cost.");
        return;
      }
      const item: Product = {
        id,
        name,
        size: String(data.get("size")),
        category: cat,
        stock,
        threshold: Number(data.get("threshold")),
        price,
        cost,
        supplier: String(data.get("supplier")),
        sku: mode === "edit" && p ? p.sku : `SP-${Date.now().toString().slice(-5)}`,
        barcode: String(data.get("barcode") ?? "").trim() || (mode === "edit" && p ? p.barcode : ean13(Date.now().toString().slice(-12))),
        emoji: {
          Beverages: "🥤",
          Snacks: "🍪",
          Dairy: "🥛",
          Bakery: "🍞",
          Produce: "🍎",
          Household: "🧴",
        }[cat],
        history: mode === "edit" && p ? [...p.history.slice(0, -1), stock] : Array(6).fill(stock),
        received: mode === "edit" && p ? p.received : Array(6).fill(0),
        sold: mode === "edit" && p ? p.sold : Array(6).fill(0),
      };
      setState((s) => ({
        ...s,
        products:
          mode === "edit"
            ? s.products.map((existing) => (existing.id === id ? item : existing))
            : [...s.products, item],
        activities: [
          {
            id: time,
            product: name,
            actor: user,
            action: mode === "edit" ? "Product updated" : "Product created",
            before: mode === "edit" ? p?.stock : undefined,
            after: stock,
            time,
          },
          ...s.activities,
        ],
      }));
      select(id);
    }
    setError("");
    close();
  };
  return (
    <Dialog
      open={!!mode}
      onOpenChange={(o) => {
        if (!o) {
          setError("");
          close();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? "Add a new product"
              : mode === "edit"
                ? "Edit product"
                : mode === "remove"
                  ? "Remove stock"
                  : mode === "return"
                  ? "Return to supplier"
                  : mode === "receive"
                  ? "Receive stock"
                  : mode === "sell"
                    ? "Record a sale"
                    : "Archive product"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Add an item to your store inventory." : p?.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} key={`${mode}-${p?.id}`} className="product-form">
          {mode === "create" || mode === "edit" ? (
            <>
              <Field label="Product name" name="name" value={mode === "edit" ? p?.name : ""} />
              <div className="form-two">
                <label>
                  Category
                  <select
                    name="category"
                    defaultValue={mode === "edit" ? p?.category : "Beverages"}
                  >
                    {categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <Field label="Pack size" name="size" value={mode === "edit" ? p?.size : ""} />
              </div>
              <div className="form-two">
                <Field
                  label="Current stock"
                  name="stock"
                  type="number"
                  value={mode === "edit" ? p?.stock : 0}
                />
                <Field
                  label="Reorder point"
                  name="threshold"
                  type="number"
                  value={mode === "edit" ? p?.threshold : 12}
                />
              </div>
              <div className="form-two">
                <Field
                  label="Selling price ($)"
                  name="price"
                  type="number"
                  step="0.01"
                  value={mode === "edit" ? p?.price : ""}
                />
                <Field
                  label="Cost price ($)"
                  name="cost"
                  type="number"
                  step="0.01"
                  value={mode === "edit" ? p?.cost : ""}
                />
              </div>
              <Field label="Supplier" name="supplier" value={mode === "edit" ? p?.supplier : ""} />
              <label>
                Barcode (EAN, optional)
                <input
                  name="barcode"
                  inputMode="numeric"
                  pattern="[0-9]{8,14}"
                  placeholder="Auto-generated if empty"
                  defaultValue={mode === "edit" ? p?.barcode : ""}
                />
              </label>
            </>
          ) : mode === "remove" || mode === "return" ? (
            <>
              <div className="stock-modal-summary">
                Available stock <strong>{p?.stock} units</strong>
              </div>
              {mode === "return" && (
                <p className="text-sm text-muted-foreground">
                  Units go back to <strong>{p?.supplier}</strong>; their cost is credited to your
                  budget.
                </p>
              )}
              <Field label="Quantity" name="quantity" type="number" min={1} max={p?.stock} value={1} />
              <label>
                Reason
                <select name="reason" required defaultValue="">
                  <option value="" disabled>
                    Choose a reason
                  </option>
                  {(mode === "return" ? returnReasons : removalReasons).map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
              <label>
                Note (optional)
                <input name="note" placeholder="e.g. Cans dented in delivery" />
              </label>
              {mode === "return" && <CreditMemoFields />}
            </>
          ) : mode === "archive" ? (
            <p className="text-sm text-muted-foreground">
              This product will leave your active inventory. Its history will remain available in
              the activity log and archived filter.
            </p>
          ) : (
            <>
              <div className="stock-modal-summary">
                Available stock <strong>{p?.stock} units</strong>
              </div>
              <Field
                label={mode === "receive" ? "Quantity received" : "Quantity sold"}
                name="quantity"
                type="number"
                min={1}
                max={mode === "sell" ? p?.stock : undefined}
                value={mode === "receive" ? 24 : 1}
              />
            </>
          )}
          {error && (
            <p className="negative text-sm" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={mode === "archive" || mode === "remove" ? "destructive" : "default"}
            >
              {mode === "remove"
                ? "Remove from stock"
                : mode === "return"
                  ? "Send return"
                  : mode === "create"
                ? "Create product"
                : mode === "edit"
                  ? "Save changes"
                  : mode === "archive"
                    ? "Archive product"
                    : mode === "sell"
                      ? "Record sale"
                      : "Confirm receipt"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function Field({
  label,
  name,
  value,
  type = "text",
  step,
  min = 0,
  max,
}: {
  label: string;
  name: string;
  value?: string | number | undefined;
  type?: string;
  step?: string;
  min?: number;
  max?: number | undefined;
}) {
  return (
    <label>
      {label}
      <input
        name={name}
        type={type}
        required
        defaultValue={value}
        min={min}
        max={max}
        step={step}
      />
    </label>
  );
}
function Orders() {
  const { state, setState, user, role } = useStockPilot();
  const [tab, setTab] = useState("All orders");
  const [confirmation, setConfirmation] = useState<"Invoice" | "Delivery note" | "Both">("Both");
  const [requestOpen, setRequestOpen] = useState(false);
  const [supplier, setSupplier] = useState("");
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [requestError, setRequestError] = useState("");
  const [requestSearch, setRequestSearch] = useState("");
  const suppliers = [...new Set(state.products.filter((p) => !p.archived && p.supplier.trim()).map((p) => p.supplier))].sort();
  const supplierProducts = state.products.filter((p) => !p.archived && p.supplier === supplier);
  const requestLines = supplierProducts.filter((p) => (quantities[p.id] ?? "") !== "").map((p) => ({ productId: p.id, quantity: Number(quantities[p.id]) }));
  const requestTotal = requestLines.reduce((total, line) => total + line.quantity * (supplierProducts.find((p) => p.id === line.productId)?.cost ?? 0), 0);
  const submitRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const time = new Date().toISOString();
    if (createPurchaseRequest(state, supplier, requestLines, user, time) === state) {
      setRequestError("Choose a supplier and enter a positive whole quantity for at least one product.");
      return;
    }
    setState((s) => createPurchaseRequest(s, supplier, requestLines, user, time));
    setTab("Draft");
    setRequestOpen(false);
  };
  return (
    <section className="data-section">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold">Purchase requests</h2>
        <Button variant="outline" onClick={() => {
          const next = requestAllLowStock(state, 16, user, new Date().toISOString());
          const made = next.orders.length - state.orders.length;
          if (!made) { toast("No items are below their minimum."); return; }
          setState(() => next);
          toast(`Created ${made} purchase request${made > 1 ? "s" : ""} for low stock (16 each).`);
        }}><PackagePlus />Request all low stock ×16</Button>
        <Button disabled={!suppliers.length} onClick={() => { setSupplier(suppliers[0] ?? ""); setQuantities({}); setRequestError(""); setRequestSearch(""); setRequestOpen(true); }}><Plus />New purchase request</Button>
      </div>
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent className="request-dialog">
          <DialogHeader>
            <DialogTitle>New purchase request</DialogTitle>
            <DialogDescription>Supplier: {supplier || "Not selected"}</DialogDescription>
          </DialogHeader>
          <form className="product-form" onSubmit={submitRequest}>
            <label>Supplier
              <select aria-label="Request supplier" value={supplier} required onChange={(e) => { setSupplier(e.target.value); setQuantities({}); setRequestError(""); setRequestSearch(""); }}>
                {suppliers.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
            <div className="search-input"><Search size={16} /><input aria-label="Search supplier products" placeholder="Search products or pack sizes…" value={requestSearch} onChange={(e) => setRequestSearch(e.target.value)} /></div>
            <div className="table-overflow request-table">
              <table>
                <thead><tr><th>Product</th><th>Unit cost</th><th>Stacks</th><th>Quantity</th></tr></thead>
                <tbody>{supplierProducts.filter((p) => `${p.name} ${p.size} ${p.sku}`.toLowerCase().includes(requestSearch.toLowerCase())).map((p) => <tr key={p.id}>
                  <td><strong>{p.name}</strong><div className="text-xs text-muted-foreground">{p.size} · {p.sku} · {p.stock} in stock</div></td>
                  <td>{money(p.cost)}</td>
                  <td>{p.caseSize ? (
                    <div className="stack-picker">
                      <input className="w-16 rounded-md border border-input bg-background px-2 py-2 text-foreground" aria-label={`Request stacks for ${p.name} (${p.size})`} type="number" min="0" step="1" placeholder="—"
                        value={p.caseSize && (quantities[p.id] ?? "") !== "" && Number(quantities[p.id]) % p.caseSize === 0 ? String(Number(quantities[p.id]) / p.caseSize) : ""}
                        onChange={(e) => { const stacks = e.target.value; setQuantities((q) => ({ ...q, [p.id]: stacks === "" ? "" : String(stackUnits(p, Number(stacks))) })); setRequestError(""); }} />
                      <span className="text-xs text-muted-foreground">× {p.caseSize}</span>
                      <div className="stack-layouts" role="group" aria-label={`Quick stack layouts for ${p.name}`}>
                        {([[2, 2], [2, 3], [3, 3]] as [number, number][]).map(([w, h]) => (
                          <button type="button" key={`${w}x${h}`} className="stack-layout" onClick={() => { setQuantities((q) => ({ ...q, [p.id]: String(stackUnits(p, w * h)) })); setRequestError(""); }}>{w}×{h}</button>
                        ))}
                      </div>
                    </div>
                  ) : <span className="text-xs text-muted-foreground">Units only</span>}</td>
                  <td><input className="w-20 rounded-md border border-input bg-background px-2 py-2 text-foreground" aria-label={`Request quantity for ${p.name} (${p.size})`} type="number" min="1" step="1" value={quantities[p.id] ?? ""} placeholder="—" onChange={(e) => { setQuantities((q) => ({ ...q, [p.id]: e.target.value })); setRequestError(""); }} /></td>
                </tr>)}</tbody>
              </table>
            </div>
            <div className="order-total"><span>Estimated request value</span><strong>{money(requestTotal)}</strong></div>
            {requestError && <p role="alert" className="text-sm text-destructive">{requestError}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setRequestOpen(false)}>Cancel</Button>
              <Button type="submit"><Plus />Create draft request</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <div className="view-tabs">
        {["All orders", "Draft", "Approved", "Received"].map((t) => (
          <Button variant={tab === t ? "secondary" : "ghost"} key={t} onClick={() => setTab(t)}>
            {t}
          </Button>
        ))}
      </div>
      <div className="order-grid">
        {state.orders
          .filter((o) => tab === "All orders" || o.status === tab)
          .map((o) => (
            <article className="order-card" key={o.id}>
              <div className="flex justify-between">
                <strong>{o.id}</strong>
                <span className={`order-status status-${o.status.toLowerCase()}`}>{o.status}</span>
              </div>
              <h3>{o.supplier}</h3>
              <p>Created {o.date}</p>
              <div className="order-lines">
                {o.lines.map((l) => {
                  const p = state.products.find((p) => p.id === l.productId);
                  return (
                    <div key={l.productId}>
                      <span>{p?.name}<span className="block text-xs text-muted-foreground">{p?.size}</span></span>
                      <strong>{l.quantity} units</strong>
                    </div>
                  );
                })}
              </div>
              <div className="order-total">
                <span>Estimated request value</span>
                <strong>
                  {money(
                    o.lines.reduce(
                      (n, l) =>
                        n +
                        l.quantity * (state.products.find((p) => p.id === l.productId)?.cost || 0),
                      0,
                    ),
                  )}
                </strong>
              </div>
              {o.status === "Draft" ? (
                role !== "Manager" ? <p className="text-sm text-muted-foreground">Waiting for a manager to approve.</p> :
                <Button
                  className="w-full"
                  onClick={() =>
                    setState((s) => approveOrder(s, o.id, user, new Date().toISOString()))
                  }
                >
                  <Check />
                  Approve order
                </Button>
              ) : o.status === "Approved" ? (
                <div className="supplier-confirmation">
                  <label>Supplier confirmation
                    <select aria-label={`Supplier confirmation for ${o.id}`} value={confirmation} onChange={(e) => setConfirmation(e.target.value as "Invoice" | "Delivery note" | "Both")}>
                      <option value="Both">Invoice + delivery note</option><option value="Invoice">Invoice only</option><option value="Delivery note">Delivery note only</option>
                    </select>
                  </label>
                  <Button variant="outline" className="w-full" onClick={() => setState((s) => confirmSupplier(s, o.id, confirmation, user, new Date().toISOString()))}><FileText />Record demo confirmation</Button>
                  <p className="text-xs text-muted-foreground">Invoice: {supplierDocuments(state, o.id).invoice ? "Recorded" : "Missing"} · Delivery note: {supplierDocuments(state, o.id).delivery ? "Recorded" : "Missing"}</p>
                  <Button
                  variant="outline"
                  className="w-full"
                  disabled={!supplierDocuments(state, o.id).invoice || !supplierDocuments(state, o.id).delivery}
                  onClick={() =>
                    setState((s) => receiveOrder(s, o.id, user, new Date().toISOString()))
                  }
                >
                  <PackageCheck />
                  Receive order
                </Button>
                </div>
              ) : (
                <div className="received-order">
                  <Check size={16} />
                  Stock received
                </div>
              )}
            </article>
          ))}
      </div>
      {!state.orders.some((o) => tab === "All orders" || o.status === tab) && (
        <div className="empty-state">No {tab.toLowerCase()} orders.</div>
      )}
    </section>
  );
}
function ActivityTable() {
  const { state } = useStockPilot();
  const [search, setSearch] = useState("");
  return (
    <section className="data-section">
      <div className="section-heading">
        <h2>Inventory activity</h2>
        <div className="search-input activity-search">
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activity..."
            aria-label="Search activity"
          />
        </div>
      </div>
      <div className="table-overflow">
        <table>
          <thead>
            <tr>
               <th>PRODUCT / ORDER</th>
               <th>ACTIVITY</th>
               <th>STOCK CHANGE</th>
               <th>AMOUNT</th>
              <th>CHANGED BY</th>
              <th>DATE & TIME</th>
            </tr>
          </thead>
          <tbody>
            {state.activities
              .filter((a) =>
                `${a.product} ${a.actor} ${a.action}`.toLowerCase().includes(search.toLowerCase()),
              )
              .map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.product}</strong>
                  </td>
                  <td>
                    {a.action}
                    {a.reason && <div className="text-xs text-muted-foreground">{a.reason}</div>}
                  </td>
                   <td>
                     {a.before !== undefined ? (
                       <span
                         className={
                           a.after !== undefined && a.after < a.before ? "negative" : "positive"
                         }
                       >
                         {a.before} → {a.after} units
                       </span>
                     ) : (
                       "—"
                     )}
                   </td>
                    <td>
                      {a.amount !== undefined ? (
                        <span className={a.flow === "out" || a.flow === "customer-refund" ? "negative" : "positive"}>
                          {a.flow === "out" || a.flow === "customer-refund" ? "−" : "+"}
                          {money(a.amount)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  <td>
                    <span className="table-person">
                      <span className="avatar small">
                        {a.actor
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                      {a.actor}
                    </span>
                  </td>
                  <td>
                    {new Date(a.time).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
function Dashboard() {
  const { state } = useStockPilot();
  const low = state.products.filter(isLowStock);
  const first = state.products.find((p) => !p.archived);
  return (
    <>
      <div className="dashboard-grid">
        <section className="dashboard-section">
          <div className="section-heading">
            <h2>Stock needs attention</h2>
            <span className="low-stock">{low.length} products</span>
          </div>
          {low.map((p) => (
            <div className="dashboard-low" key={p.id}>
              <span className={`category-tag category-${p.category.toLowerCase()}`}>{p.emoji}</span>
              <div>
                <strong>{p.name}</strong>
                <span>{p.supplier}</span>
              </div>
              <span className="negative">
                {p.stock} / {p.threshold} units
              </span>
            </div>
          ))}
        </section>
        <section className="dashboard-section">
          <div className="section-heading">
            <h2>Inventory by category</h2>
          </div>
          {categories.map((c) => {
            const ps = state.products.filter((p) => p.category === c && !p.archived);
            return (
              <div className="category-summary" key={c}>
                <span>
                  <i className={`category-dot category-${c.toLowerCase()}`} />
                  {c}
                </span>
                <strong>{ps.reduce((n, p) => n + p.stock, 0)} units</strong>
                <span>{money(ps.reduce((n, p) => n + p.stock * p.cost, 0))}</span>
              </div>
            );
          })}
        </section>
      </div>
      {first && (
        <section className="dashboard-section mt-6">
          <div className="section-heading">
            <h2>{first.name} · Six-month performance</h2>
          </div>
          <ProductCharts product={first} />
        </section>
      )}
    </>
  );
}
function StoreSettings({ initialTab = "profile" }: { initialTab?: "profile" | "appearance" }) {
  const { storeName, setStoreName, user, setUser, role, pinned, setPinned, budget, setBudget } =
    useStockPilot();
  const manager = role === "Manager";
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"profile" | "appearance" | ExtraTab>(initialTab);
  const [startPage, setStartPage] = usePref("startPage", "Dashboard");
  const [chartPeriod, setChartPeriod] = usePref("chartPeriod", "Monthly");
  const [sortBy, setSortBy] = usePref("sortBy", "Name (A–Z)");
  const [perPage, setPerPage] = usePref("perPage", "24");
  const [compact, setCompact] = usePref("compact", false);
  const [confirmLeave, setConfirmLeave] = usePref("confirmLeave", true);
  const [tooltips, setTooltips] = usePref("tooltips", true);
  return (
    <section className="settings-section">
      <div className="settings-tabs flex-wrap" role="tablist" aria-label="Settings">
        <Button id="profile-tab" role="tab" aria-selected={tab === "profile"} aria-controls="settings-panel" variant="ghost" onClick={() => setTab("profile")}>{manager ? "Store profile" : "General"}</Button>
        {extraTabs.filter((t) => manager || !t.managerOnly).map((t) => (
          <Button key={t.id} id={`${t.id}-tab`} role="tab" aria-selected={tab === t.id} aria-controls="settings-panel" variant="ghost" onClick={() => setTab(t.id)}>{t.label}</Button>
        ))}
        <Button id="appearance-tab" role="tab" aria-selected={tab === "appearance"} aria-controls="settings-panel" variant="ghost" onClick={() => setTab("appearance")}>Appearance</Button>
      </div>
      <div id="settings-panel" role="tabpanel" aria-labelledby={`${tab}-tab`}>
      {tab === "appearance" ? <AppearanceSettings /> : tab !== "profile" ? <ExtraSettings key={tab} tab={tab} /> : <>
      <h2>{manager ? "Store profile" : "Your settings"}</h2>
      <form
        className="product-form"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          if (manager) {
          setStoreName(String(data.get("store")));
          setUser(String(data.get("manager")));
          }
          const b = Number(data.get("budget"));
          if (manager && Number.isFinite(b) && b >= 0) setBudget(b);
          setSaved(true);
        }}
      >
        {manager && <><Field label="Store name" name="store" value={storeName} />
        <Field label="Store manager" name="manager" value={user} />
        <Field
          label="Monthly purchase budget ($)"
          name="budget"
          type="number"
          step="0.01"
          value={budget}
        /></>}
        <label>
          Currency
          <input value="USD — US Dollar (demo)" readOnly />
        </label>
        <h3 className="settings-subhead">Workspace preferences</h3>
        <label>
          Start page after sign-in
          <select value={startPage} onChange={(e) => setStartPage(e.target.value)}>
            {["Dashboard", "Inventory", "Cashier", "Purchase orders", "Documents", "Activity log"].map((o) => <option key={o}>{o}</option>)}
          </select>
        </label>
        <label>
          Default chart period
          <select value={chartPeriod} onChange={(e) => setChartPeriod(e.target.value)}>
            {["Daily", "Weekly", "Monthly", "Yearly"].map((o) => <option key={o}>{o}</option>)}
          </select>
        </label>
        <label>
          Sort products by
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {["Name (A–Z)", "Stock: low first", "Stock: high first", "Price: low first", "Price: high first", "Recently changed"].map((o) => <option key={o}>{o}</option>)}
          </select>
        </label>
        <label>
          Products per page
          <select value={perPage} onChange={(e) => setPerPage(e.target.value)}>
            {["12", "24", "48", "All"].map((o) => <option key={o}>{o}</option>)}
          </select>
        </label>
        <div className="settings-check">
          <label>
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
            Keep inventory sidebar pinned
          </label>
          <label>
            <input type="checkbox" checked={compact} onChange={(e) => setCompact(e.target.checked)} />
            Compact tables and lists
          </label>
          <label>
            <input type="checkbox" checked={confirmLeave} onChange={(e) => setConfirmLeave(e.target.checked)} />
            Ask before discarding unsaved forms
          </label>
          <label>
            <input type="checkbox" checked={tooltips} onChange={(e) => setTooltips(e.target.checked)} />
            Show helpful tips on buttons and fields
          </label>
        </div>
        <div className="flex gap-4 items-center">
          <Button type="submit">Save settings</Button>
          {saved && (
            <span className="positive text-sm">
              <Check size={14} className="inline" /> Changes saved
            </span>
          )}
        </div>
      </form>
      </>}
      </div>
      <div className="settings-note">
        <Store size={18} />
        <div>
          <strong>Local demo workspace</strong>
          <p>Settings are saved to your account in this browser. Stock and orders reset each session.</p>
        </div>
      </div>
    </section>
  );
}
export function Login() {
  const { storeName } = useStockPilot();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  return (
    <div className="login-page">
      <div className="login-brand-panel">
        <Logo />
        <div className="login-brand-content">
          <span className="eyebrow">A CLEARER VIEW OF YOUR STORE</span>
          <h1>
            Good stock.
            <br />
            Better business.
          </h1>
          <p>
            A little more control over every shelf,
            <br />
            every order, and every day.
          </p>
          <div className="login-art">
            <div className="login-art-product">
              <span className="login-art-emoji">🥤</span>
              <span>Coca-Cola Original</span>
              <strong>
                48 <small>units in stock</small>
              </strong>
            </div>
            <span className="login-art-check">
              <Check size={20} />
              Your shelves, in sync.
            </span>
          </div>
        </div>
        <span className="login-brand-footer">BUILT FOR THE STORE AROUND THE CORNER</span>
      </div>
      <div className="login-form-panel">
        <div className="login-form">
          <span className="category-tag category-produce">
            <Store size={14} />
            {storeName}
          </span>
          <h2>Welcome back.</h2>
          <p>Sign in to your Stock Genie workspace.</p>
          <form
            className="product-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!email || !password) {
                setError("Enter a username and password to continue.");
                return;
              }
              const acc = findAccount(email, password);
              if (!acc) {
                setError("Wrong username or password. Try manager / manager123 or staff / staff123.");
                return;
              }
              setCurrentAccount(acc.username);
              void navigate({ to: "/" });
            }}
          >
            <label>
              Username
              <input
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager or staff"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                required
                minLength={4}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </label>
            {error && <span className="negative">{error}</span>}
            <Button type="submit" className="w-full">
              Sign in
              <ArrowUpRight />
            </Button>
          </form>
          <div className="login-divider">
            <span />
            or explore Stock Genie
            <span />
          </div>
          {(["Manager", "Staff"] as const).map((r) => (
            <Button
              key={r}
              asChild
              variant="outline"
              className="w-full"
              onClick={() => setCurrentAccount(r === "Manager" ? "manager" : "staff")}
            >
              <Link to="/">
                {r === "Manager" ? "Try the demo as Manager" : "Try the demo as Staff"}
                <ArrowUpRight />
              </Link>
            </Button>
          ))}
          <p className="login-demo-note">Test accounts: <strong>manager</strong> / manager123 · <strong>staff</strong> / staff123. Settings are saved per account in this browser.</p>
        </div>
        <span className="login-copyright">© 2026 Stock Genie. A smarter store starts here.</span>
      </div>
    </div>
  );
}

/** Supplier credit memo details for a return; can be skipped when no document was issued. */
function CreditMemoFields() {
  const [none, setNone] = useState(false);
  return (
    <fieldset className="grid gap-2 rounded-md border border-border p-3">
      <legend className="px-1 text-sm font-medium">Credit memo</legend>
      <div className="form-two">
        <label>
          Document number
          <input name="memoNumber" placeholder="e.g. CM-0001234" disabled={none} required={!none} />
        </label>
        <label>
          Document date
          <input name="memoDate" type="date" disabled={none} required={!none} />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="noMemo" checked={none} onChange={(e) => setNone(e.target.checked)} />
        No credit memo (no documents for this return)
      </label>
    </fieldset>
  );
}
