import { useEffect, useMemo, useRef, useState } from "react";
import { Printer, Mail, Trash2, FileText, Receipt, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useStockPilot } from "./store";
import { checkout, money, type CartLine, type StoreDocument } from "./model";

/** Opens the browser print dialog for one document only. */
function printDocument() {
  document.body.classList.add("printing-doc");
  const done = () => {
    document.body.classList.remove("printing-doc");
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  window.print();
  setTimeout(done, 1000);
}

export function DocumentSheet({ doc }: { doc: StoreDocument }) {
  const { storeName } = useStockPilot();
  const receipt = doc.kind === "Receipt";
  return (
    <div className={`doc-sheet ${receipt ? "doc-receipt" : ""}`}>
      <header>
        <strong>{receipt ? storeName : doc.kind.toUpperCase()}</strong>
        <span>
          {receipt ? "Sales receipt" : `${doc.party}`} · {doc.reference}
        </span>
        <span>
          {new Date(doc.time).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })} ·{" "}
          {doc.actor}
        </span>
        {!receipt && <span>Bill to: {storeName}</span>}
      </header>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>{receipt ? "Price" : "Unit cost"}</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {doc.lines.map((l, i) => (
            <tr key={i}>
              <td>{l.name}</td>
              <td>{l.quantity}</td>
              <td>{money(l.unit)}</td>
              <td>{money(l.quantity * l.unit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer>
        <div>
          <span>Total</span>
          <strong>{money(doc.total)}</strong>
        </div>
        {receipt && (
          <>
            <div>
              <span>Paid ({doc.method})</span>
              <span>{money(doc.paid ?? doc.total)}</span>
            </div>
            <div>
              <span>Change</span>
              <span>{money(Math.max(0, (doc.paid ?? doc.total) - doc.total))}</span>
            </div>
            <p>Thank you for shopping with us!</p>
          </>
        )}
        {doc.kind === "Delivery note" && <p>Goods received in full and added to stock.</p>}
      </footer>
    </div>
  );
}

export function DocumentDialog({
  doc: initial,
  close,
}: {
  doc: StoreDocument | null;
  close: () => void;
}) {
  const { state, setState } = useStockPilot();
  const doc = (state.documents ?? []).find((d) => d.id === initial?.id) ?? initial;
  const [email, setEmail] = useState("");
  const send = () => {
    if (!doc || !/^\S+@\S+\.\S+$/.test(email)) return;
    setState((s) => ({
      ...s,
      documents: (s.documents ?? []).map((d) => (d.id === doc.id ? { ...d, sentTo: email } : d)),
    }));
  };
  return (
    <Dialog open={!!doc} onOpenChange={(o) => !o && close()}>
      <DialogContent className="doc-dialog">
        <DialogHeader>
          <DialogTitle>{doc?.kind}</DialogTitle>
          <DialogDescription>{doc?.reference}</DialogDescription>
        </DialogHeader>
        {doc && <DocumentSheet doc={doc} />}
        {doc && (
          <div className="doc-actions">
            <Button onClick={printDocument}>
              <Printer />
              Print
            </Button>
            {doc.sentTo ? (
              <span className="positive text-sm">Digital copy sent to {doc.sentTo}</span>
            ) : (
              <form
                className="doc-email"
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
              >
                <input
                  type="email"
                  required
                  placeholder="customer@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label="Email for digital copy"
                />
                <Button type="submit" variant="outline">
                  <Mail />
                  Send digital copy
                </Button>
              </form>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const keyHelp: [string, string][] = [
  ["Number + Enter", "Add item by its code (or barcode)"],
  ["Number + *", "Set quantity for the next item"],
  ["+", "One more of the last item"],
  ["−", "Remove the last item"],
  ["/", "Clear the sale"],
  ["Enter (empty)", "Pay by card"],
  ["Amount + .", "Pay cash with that amount (e.g. 2000. = $20.00)"],
];

export function Cashier() {
  const { state, setState, user } = useStockPilot();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [buffer, setBuffer] = useState("");
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState("Type an item code and press Enter.");
  const [doc, setDoc] = useState<StoreDocument | null>(null);
  const counter = useRef(1);
  const products = useMemo(() => state.products.filter((p) => !p.archived), [state.products]);
  const code = (id: string) => String(state.products.findIndex((p) => p.id === id) + 1);
  const total = cart.reduce(
    (n, c) => n + c.quantity * (state.products.find((p) => p.id === c.productId)?.price ?? 0),
    0,
  );

  const add = (id: string, n: number) => {
    const p = state.products.find((p) => p.id === id);
    if (!p) return;
    const inCart = cart.find((c) => c.productId === id)?.quantity ?? 0;
    if (inCart + n > p.stock) return setMessage(`Only ${p.stock} ${p.name} in stock.`);
    setCart((c) =>
      c.some((l) => l.productId === id)
        ? [...c.filter((l) => l.productId !== id), { productId: id, quantity: inCart + n }]
        : [...c, { productId: id, quantity: n }],
    );
    setMessage(`Added ${n} × ${p.name}`);
  };
  const pay = (method: "Cash" | "Card", paid?: number) => {
    if (!cart.length) return setMessage("The sale is empty.");
    if (method === "Cash" && (paid ?? 0) < total) return setMessage(`Cash must cover ${money(total)}.`);
    const no = `R-${String(1000 + counter.current++)}`;
    const result = checkout(state, cart, method, paid, user, new Date().toISOString(), no);
    if (!result.receipt) return setMessage("Sale could not be completed — check stock.");
    setState(result.state);
    setCart([]);
    setDoc(result.receipt);
    setMessage(
      method === "Cash"
        ? `Paid cash. Change ${money((paid ?? 0) - total)}.`
        : `Paid by card. Receipt ${no}.`,
    );
  };
  const press = (key: string) => {
    if (/^\d$/.test(key)) return setBuffer((b) => (b + key).slice(0, 14));
    if (key === "Backspace") return setBuffer((b) => b.slice(0, -1));
    if (key === "*") {
      const n = Number(buffer);
      setBuffer("");
      if (n > 0) {
        setQty(n);
        setMessage(`Quantity set to ${n}.`);
      }
      return;
    }
    if (key === "Enter") {
      setBuffer("");
      if (!buffer) return pay("Card");
      const p =
        state.products[Number(buffer) - 1] && buffer.length <= 3
          ? state.products[Number(buffer) - 1]
          : state.products.find((p) => p.barcode === buffer);
      if (!p || p.archived) return setMessage(`No item with code ${buffer}.`);
      add(p.id, qty);
      setQty(1);
      return;
    }
    if (key === "+") {
      const last = cart[cart.length - 1];
      if (last) add(last.productId, 1);
      return;
    }
    if (key === "-") {
      setCart((c) => c.slice(0, -1));
      return setMessage("Removed last item.");
    }
    if (key === "/") {
      setCart([]);
      setBuffer("");
      setQty(1);
      return setMessage("Sale cleared.");
    }
    if (key === ".") {
      setBuffer("");
      return pay("Cash", Number(buffer) / 100);
    }
  };
  const pressRef = useRef(press);
  pressRef.current = press;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
      if (document.querySelector("[role=dialog]")) return;
      if (/^[\d*+\-/.]$/.test(e.key) || e.key === "Enter" || e.key === "Backspace") {
        e.preventDefault();
        pressRef.current(e.key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="cashier">
      <section className="cashier-items">
        <h3>Items</h3>
        <div className="cashier-grid">
          {products.map((p) => (
            <button
              key={p.id}
              className={`cashier-item category-${p.category.toLowerCase()}`}
              disabled={p.stock === 0}
              onClick={() => add(p.id, 1)}
            >
              <span className="cashier-code">{code(p.id)}</span>
              <span>{p.emoji}</span>
              <strong>{p.name}</strong>
              <small>
                {money(p.price)} · {p.stock} left
              </small>
            </button>
          ))}
        </div>
      </section>
      <section className="cashier-sale">
        <div className="cashier-display" aria-live="polite">
          <span>{qty > 1 ? `${qty} × ` : ""}{buffer || "0"}</span>
          <small>{message}</small>
        </div>
        <ul className="cashier-cart">
          {cart.map((c) => {
            const p = state.products.find((p) => p.id === c.productId);
            return (
              <li key={c.productId}>
                <span>
                  {c.quantity} × {p?.name}
                </span>
                <span>{money(c.quantity * (p?.price ?? 0))}</span>
                <button
                  aria-label={`Remove ${p?.name}`}
                  onClick={() => setCart((x) => x.filter((l) => l.productId !== c.productId))}
                >
                  <Trash2 size={13} />
                </button>
              </li>
            );
          })}
          {!cart.length && <li className="text-muted-foreground">No items yet.</li>}
        </ul>
        <div className="cashier-total">
          <span>Total</span>
          <strong>{money(total)}</strong>
        </div>
        <div className="numpad" role="group" aria-label="Cashier numpad">
          {["/", "*", "-", "Backspace", "7", "8", "9", "+", "4", "5", "6", ".", "1", "2", "3", "Enter", "0"].map(
            (k) => (
              <button
                key={k}
                className={`numpad-key numpad-${k === "Enter" ? "enter" : k === "Backspace" ? "back" : k === "0" ? "zero" : "k"}`}
                onClick={() => press(k)}
              >
                {k === "Backspace" ? "⌫" : k === "-" ? "−" : k}
              </button>
            ),
          )}
        </div>
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => pay("Card")}>
            Pay by card
          </Button>
          <Button
            className="flex-1"
            variant="outline"
            onClick={() => pay("Cash", Math.ceil(total))}
          >
            Cash (exact/rounded)
          </Button>
        </div>
        <dl className="numpad-help">
          {keyHelp.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </section>
      <DocumentDialog doc={doc} close={() => setDoc(null)} />
    </div>
  );
}

const kindIcon = { Receipt, "Purchase order": FileText, "Delivery note": Truck };
export function Documents() {
  const { state } = useStockPilot();
  const [filter, setFilter] = useState<"All" | StoreDocument["kind"]>("All");
  const [open, setOpen] = useState<StoreDocument | null>(null);
  const docs = (state.documents ?? []).filter((d) => filter === "All" || d.kind === filter);
  return (
    <section className="documents">
      <div className="chart-period-switch" role="group" aria-label="Document type">
        {(["All", "Receipt", "Purchase order", "Delivery note"] as const).map((f) => (
          <Button
            key={f}
            variant="ghost"
            size="sm"
            aria-pressed={filter === f}
            data-state={filter === f ? "on" : "off"}
            onClick={() => setFilter(f)}
          >
            {f === "All" ? "All" : `${f}s`}
          </Button>
        ))}
      </div>
      {!docs.length ? (
        <p className="text-sm text-muted-foreground py-6">
          No documents yet. Sell items at the cashier, or approve and receive a purchase order.
        </p>
      ) : (
        <ul className="doc-list">
          {docs.map((d) => {
            const Icon = kindIcon[d.kind];
            return (
              <li key={d.id}>
                <button onClick={() => setOpen(d)}>
                  <Icon size={16} />
                  <span>
                    <strong>
                      {d.kind} · {d.reference}
                    </strong>
                    <small>
                      {d.party} · {new Date(d.time).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                      {d.sentTo ? ` · sent to ${d.sentTo}` : ""}
                    </small>
                  </span>
                  <strong>{money(d.total)}</strong>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <DocumentDialog doc={open} close={() => setOpen(null)} />
    </section>
  );
}
