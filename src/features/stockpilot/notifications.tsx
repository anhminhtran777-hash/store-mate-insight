import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, CheckCheck, Check, X, Package, ShoppingCart, ArrowUpRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useStockPilot } from "./store";
import { storeAlerts } from "./notification-data";

export function NotificationCenter() {
  const { state, select, notificationStatus = {}, setNotificationStatus } = useStockPilot();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const alerts = useMemo(() => storeAlerts(state), [state]);
  const unread = alerts.filter((a) => !notificationStatus[a.id]).length;
  const active = alerts.filter((a) => notificationStatus[a.id] !== "dismissed");
  const visible = alerts.filter((a) => {
    const status = notificationStatus[a.id];
    if (filter === "Dismissed" ? status !== "dismissed" : status === "dismissed") return false;
    if (filter === "Unread" && status) return false;
    if (["Stock", "Orders"].includes(filter) && a.category !== filter) return false;
    return `${a.title} ${a.detail} ${a.productIds.map((id) => state.products.find((p) => p.id === id)?.name).join(" ")}`.toLowerCase().includes(query.toLowerCase());
  });
  function update(id: string, status: "read" | "dismissed") {
    setNotificationStatus((current) => ({ ...current, [id]: status }));
  }
  return <>
    <Button variant="ghost" size="icon" title="Notifications" aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`} onClick={() => setOpen(true)}>
      <Bell size={18} />{unread > 0 && <i className="notification-dot" />}
    </Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="notification-center">
        <DialogHeader>
          <DialogTitle>Notifications <span className="notification-count">{unread} unread</span></DialogTitle>
          <DialogDescription>{active.length} active alerts · Stock and purchase requests</DialogDescription>
        </DialogHeader>
        <div className="notification-tools">
          <input aria-label="Search notifications" placeholder="Search supplier, item or order…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Button variant="outline" size="sm" disabled={!unread} onClick={() => setNotificationStatus((current) => ({ ...current, ...Object.fromEntries(alerts.filter((a) => !current[a.id]).map((a) => [a.id, "read" as const])) }))}><CheckCheck size={15} />Mark all read</Button>
        </div>
        <div className="notification-filters" role="group" aria-label="Notification filters">
          {["All", "Unread", "Stock", "Orders", "Dismissed"].map((name) => <Button key={name} size="sm" variant={filter === name ? "default" : "ghost"} aria-pressed={filter === name} onClick={() => setFilter(name)}>{name}</Button>)}
        </div>
        <div className="notification-list">
          {!visible.length && <div className="notification-empty"><CheckCheck size={30} /><strong>No notifications here</strong><span>{query ? "No alerts match your search." : "You’re all caught up in this section."}</span></div>}
          {visible.map((alert) => <article key={alert.id} className={`notification-item ${!notificationStatus[alert.id] ? "is-unread" : ""}`}>
            <div className="notification-item-heading">
              <span className={alert.urgent ? "negative" : "text-muted-foreground"}>{alert.category === "Stock" ? <Package size={19} /> : <ShoppingCart size={19} />}</span>
              <div><span className="notification-label">{alert.category} · {alert.urgent ? "Action needed" : "Catalogue"}</span><h3>{alert.title}</h3><p>{alert.detail}</p></div>
            </div>
            <p className="notification-next"><strong>Next step</strong>{alert.nextStep}</p>
            {alert.productIds.length > 0 && <details><summary>Items ({alert.productIds.length}) <ChevronDown size={14} /></summary><ul>{alert.productIds.map((id) => {
              const product = state.products.find((p) => p.id === id);
              return product ? <li key={id}><span>{product.name} <small>{product.size}</small></span><strong className="negative">{product.stock} / {product.threshold}</strong></li> : null;
            })}</ul></details>}
            <div className="notification-actions">
              <Button variant="outline" size="sm" onClick={() => { update(alert.id, "read"); const id = alert.productIds[0]; if (id) select(id); setOpen(false); void navigate({ to: alert.to }); }}>{alert.action}<ArrowUpRight size={14} /></Button>
              {notificationStatus[alert.id] !== "dismissed" ? <div>
                <Button variant="ghost" size="icon" title="Mark as read" aria-label={`Mark ${alert.title} as read`} disabled={notificationStatus[alert.id] === "read"} onClick={() => update(alert.id, "read")}><Check size={16} /></Button>
                <Button variant="ghost" size="icon" title="Dismiss notification" aria-label={`Dismiss ${alert.title}`} onClick={() => update(alert.id, "dismissed")}><X size={16} /></Button>
              </div> : <Button variant="ghost" size="sm" onClick={() => setNotificationStatus((current) => { const next = { ...current }; delete next[alert.id]; return next; })}>Restore</Button>}
            </div>
          </article>)}
        </div>
        <div className="notification-footer">{visible.length} grouped alerts <span>Read and dismissed alerts are kept for this session.</span></div>
      </DialogContent>
    </Dialog>
  </>;
}