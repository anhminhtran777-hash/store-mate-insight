import { useEffect, useMemo, useRef, useState } from "react";
import { Printer, Mail, Trash2, FileText, Receipt, Truck, PackageCheck, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useStockPilot } from "./store";
import { checkout, findCashierItem, money, type CartLine, type StoreDocument } from "./model";
import { RefundDialog } from "./refund";
import { InvoiceSheet } from "./invoice";

/** Opens the browser print dialog for one document only. */
function printDocument() {
  document.body.classList.add("printing-doc");
  const done = () => {
    document.body.classList.remove("printing-doc");
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  window.print();
}

export function DocumentSheet({ doc }: { doc: StoreDocument }) {
  const { storeName, state } = useStockPilot();
  const refund = doc.kind === "Refund receipt";
  const receipt = doc.kind === "Receipt" || refund;
  const delivery = doc.kind === "Delivery note";
  const goods = doc.kind === "Goods receipt";
  const order = state.orders.find((o) => o.id === doc.reference);
  const date = new Date(doc.time).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  const units = doc.lines.reduce((n, line) => n + line.quantity, 0);
  if (doc.kind === "Invoice") return <InvoiceSheet doc={doc} buyer={storeName} />;
  if (receipt) return (
    <article className="doc-sheet doc-receipt" aria-label="Sales receipt">
      <header className="receipt-heading">
        <strong>{storeName}</strong>
        <span>{refund ? "REFUND RECEIPT" : "SALES RECEIPT"}</span>
        <span>{date}</span>
      </header>
      <dl className="receipt-details">
        <div><dt>{refund ? "Refund" : "Receipt"}</dt><dd>{doc.id}</dd></div>
        {refund && <div><dt>Original receipt</dt><dd>{doc.reference}</dd></div>}
        <div><dt>Cashier</dt><dd>{doc.actor}</dd></div>
        <div><dt>Customer</dt><dd>{doc.party}</dd></div>
      </dl>
      <div className="receipt-items">
        {doc.lines.map((line, i) => (
          <div className="receipt-item" key={i}>
            <strong>{line.name}</strong>
            <div><span>{line.quantity} × {money(line.unit)}</span><span>{money(line.quantity * line.unit)}</span></div>
          </div>
        ))}
      </div>
      <footer className="receipt-footer">
        <div><span>{units} items</span><span>{money(doc.total)}</span></div>
        <div className="receipt-total"><strong>TOTAL</strong><strong>{money(doc.total)}</strong></div>
        {refund ? <>
          <div><span>Refunded to {doc.method ?? "original payment"}</span><span>−{money(doc.total)}</span></div>
          <div><span>Reason</span><span>{doc.reason}</span></div>
          {doc.note && <div><span>Note</span><span>{doc.note}</span></div>}
          {doc.approvedBy && <div><span>Approved by</span><span>{doc.approvedBy}</span></div>}
          <p>REFUND COMPLETE</p>
          <p>Customer signature<br />______________________</p>
        </> : <>
        <div><span>{doc.method ?? "Payment"}</span><span>{money(doc.paid ?? doc.total)}</span></div>
        <div><span>Change</span><span>{money(Math.max(0, (doc.paid ?? doc.total) - doc.total))}</span></div>
        <p>PAYMENT COMPLETE</p>
        <p>Thank you for shopping<br />at {storeName}!</p>
        </>}
        <span className="receipt-reference">{doc.reference} · Keep for your records</span>
      </footer>
    </article>
  );
  return (
    <article className="doc-sheet doc-business" aria-label={doc.kind}>
      {doc.demo && <p className="invoice-demo">SIMULATED SUPPLIER DOCUMENT · DEMO ONLY</p>}
      <header className="business-heading">
        <div><span className="doc-label">{goods ? "STOCK RECEIVING RECORD" : delivery ? "SUPPLIER DELIVERY RECORD" : "PURCHASE REQUEST · NOT AN INVOICE"}</span><strong>{goods ? "Goods-received receipt" : doc.kind}</strong><span>{goods ? storeName : delivery ? doc.party : storeName}</span></div>
        <div className="business-reference"><strong>{doc.number ?? doc.reference}</strong><span>{goods ? "Stock received" : delivery ? "Supplier dispatch confirmation" : "Request to supplier"}</span></div>
      </header>
      <section className="doc-parties">
        <div><span className="doc-label">{delivery ? "Delivered by" : "Supplier / order to"}</span><strong>{doc.party}</strong><span>Supplier for this order</span></div>
        <div><span className="doc-label">{goods ? "Received at" : "Buyer / deliver to"}</span><strong>{storeName}</strong><span>{goods ? `Received by ${doc.actor}` : `Prepared by ${doc.actor}`}</span></div>
      </section>
      <dl className="business-details">
        <div><dt>{goods ? "Received on" : delivery ? "Issued on" : "Requested on"}</dt><dd>{date}</dd></div>
        <div><dt>Purchase order</dt><dd>{doc.reference}</dd></div>
        <div><dt>Order created</dt><dd>{order?.date ?? "Not recorded"}</dd></div>
        <div><dt>{goods ? "Receiving officer" : delivery ? "Issued by" : "Requested by"}</dt><dd>{doc.actor}</dd></div>
      </dl>
      <table>
        <caption>{goods ? "Goods received into stock" : delivery ? "Goods dispatched" : "Items requested"}</caption>
        <thead>
          <tr>
            <th>No.</th><th>Item / description</th>
            <th>{goods ? "Received qty" : delivery ? "Delivered qty" : "Requested qty"}</th>
            <th>Unit cost</th><th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {doc.lines.map((l, i) => (
            <tr key={i}>
              <td>{String(i + 1).padStart(2, "0")}</td>
              <td>{l.name}</td>
              <td>{l.quantity}</td>
              <td>{money(l.unit)}</td>
              <td>{money(l.quantity * l.unit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <section className="business-summary">
        <div><span className="doc-label">Order summary</span><p>{doc.lines.length} product lines · {units} units</p><p>{goods ? "Goods received in full and added to inventory." : delivery ? "Supplier lists these goods for delivery. Stock is recorded separately on the goods receipt." : "Request for the supplier to confirm availability and supply these goods."}</p></div>
        <dl><div><dt>Line total</dt><dd>{money(doc.total)}</dd></div><div className="business-total"><dt>{goods ? "Received value" : delivery ? "Goods value" : "Estimated value"}</dt><dd>{money(doc.total)}</dd></div></dl>
      </section>
      <section className="business-notes">
        <span className="doc-label">{delivery ? "Receiving record" : "Order notes"}</span>
        <p>{goods ? `Receipt recorded by ${doc.actor} on ${date}. Retained with the supplier delivery note and original invoice.` : `Please reference ${doc.reference} on related deliveries and supplier correspondence.`}</p>
        <p>Tax, delivery charges and payment terms are not recorded. This document is not a tax invoice.</p>
        {(goods || delivery) && <p>{(state.documents ?? []).filter((d) => d.reference === doc.reference && d.id !== doc.id && (d.kind === "Invoice" || d.kind === "Delivery note" || d.kind === "Goods receipt")).map((d) => `${d.kind}: ${d.number ?? d.reference}`).join(" · ")}</p>}
      </section>
      <footer className="business-footer">
        <div><span>{goods ? "Received by" : delivery ? "Issued by" : "Requested by"}</span><strong>{doc.actor}</strong></div>
        <div><span>Document reference</span><strong>{doc.number ?? doc.reference}</strong></div>
      </footer>
    </article>
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
  const [selected, setSelected] = useState<StoreDocument | null>(null);
  useEffect(() => setSelected(null), [initial?.id]);
  const active = selected ?? initial;
  const doc = (state.documents ?? []).find((d) => d.id === active?.id) ?? active;
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
      <DialogContent className={`doc-dialog print:translate-x-0 print:translate-y-0 print:transform-none print:animate-none ${doc?.kind === "Receipt" || doc?.kind === "Refund receipt" ? "doc-dialog-receipt" : "doc-dialog-business"}`}>
        <DialogHeader>
          <DialogTitle>{doc?.kind}</DialogTitle>
          <DialogDescription>{doc?.reference}</DialogDescription>
        </DialogHeader>
        {doc && <div className="doc-preview"><DocumentSheet doc={doc} /></div>}
        {doc && <div className="doc-related" aria-label="Related documents">{(state.documents ?? []).filter((d) => d.reference === doc.reference && d.id !== doc.id).map((d) => <Button key={d.id} variant="outline" size="sm" onClick={() => setSelected(d)}><FileText />{d.kind === "Goods receipt" ? "Goods-received receipt" : d.kind}</Button>)}</div>}
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
  ["Code + Enter", "Add item by code, barcode, SKU or name (type on the keyboard)"],
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
  const [refundOpen, setRefundOpen] = useState(false);
  const counter = useRef(1);
  const allProducts = useMemo(() => state.products.filter((p) => !p.archived), [state.products]);
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
    // While a text query is being typed (name/SKU lookup), operator keys become letters.
    const textMode = /[A-Za-z]/.test(buffer);
    if (key === " ") {
      if (textMode) setBuffer((b) => (b + " ").slice(0, 40));
      return;
    }
    if (/^[\dA-Za-z]$/.test(key)) return setBuffer((b) => (b + key).slice(0, 40));
    if (key === "Backspace") return setBuffer((b) => b.slice(0, -1));
    if (textMode && /^[*\-+/.]$/.test(key)) return setBuffer((b) => (b + key).slice(0, 40));
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
      const found = findCashierItem(allProducts, buffer);
      if (found === "many") return setMessage(`Several items match "${buffer}" — type more characters.`);
      if (!found) return setMessage(`No item matches "${buffer}".`);
      add(found.id, qty);
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
      if (/^[a-zA-Z0-9*+\-/.\s]$/.test(e.key) || e.key === "Enter" || e.key === "Backspace") {
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
        <h3 className="cashier-heading">Items</h3>
        <div className="cashier-grid">
          {allProducts.map((p) => (
            <button
              key={p.id}
              className={`cashier-item category-${p.category.toLowerCase()}`}
              disabled={p.stock === 0}
              onClick={() => add(p.id, 1)}
            >
              <span className="cashier-code">{code(p.id)}</span>
              <span>{p.emoji}</span>
               <strong>{p.name}</strong>
               <small>{p.size}</small>
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
                   {c.quantity} × {p?.name} ({p?.size})
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
        <Button variant="outline" onClick={() => setRefundOpen(true)}>
          <Undo2 /> Refund an item
        </Button>
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
      <RefundDialog open={refundOpen} onOpenChange={setRefundOpen} onDone={(d) => { setRefundOpen(false); setDoc(d); setMessage(`Refunded ${money(d.total)} to ${d.method ?? "customer"}.`); }} />
    </div>
  );
}

const kindIcon = { Receipt, "Refund receipt": Undo2, "Purchase order": FileText, "Delivery note": Truck, Invoice: FileText, "Goods receipt": PackageCheck };
export function Documents() {
  const { state } = useStockPilot();
  const [filter, setFilter] = useState<"All" | StoreDocument["kind"]>("All");
  const [open, setOpen] = useState<StoreDocument | null>(null);
  const docs = (state.documents ?? []).filter((d) => filter === "All" || d.kind === filter);
  return (
    <section className="documents">
      <div className="chart-period-switch" role="group" aria-label="Document type">
        {(["All", "Receipt", "Refund receipt", "Purchase order", "Invoice", "Delivery note", "Goods receipt"] as const).map((f) => (
          <Button
            key={f}
            variant="ghost"
            size="sm"
            aria-pressed={filter === f}
            data-state={filter === f ? "on" : "off"}
            onClick={() => setFilter(f)}
          >
            {f === "All" ? "All" : f === "Goods receipt" ? "Goods receipts" : `${f}s`}
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
