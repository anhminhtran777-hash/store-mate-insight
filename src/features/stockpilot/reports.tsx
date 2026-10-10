import { useState } from "react";
import { Flag, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useStockPilot } from "./store";
import {
  closeReport,
  money,
  refundReport,
  reportDocumentIssue,
  reportIssues,
  reportValue,
  reportableKinds,
  type DocumentReport,
  type StoreDocument,
} from "./model";

/** Staff (and managers) flag missing, damaged or wrong items on supplier paperwork. */
export function ReportIssueButton({ doc }: { doc: StoreDocument }) {
  const { state, setState, user } = useStockPilot();
  const [open, setOpen] = useState(false);
  const [issue, setIssue] = useState<DocumentReport["issue"]>("Missing items");
  const [qty, setQty] = useState<Record<number, string>>({});
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");
  if (!reportableKinds.includes(doc.kind)) return null;
  const lines = doc.lines.map((l, i) => ({ ...l, quantity: Number(qty[i] || 0) })).filter((l) => l.quantity > 0);
  const submit = (e: import("react").FormEvent) => {
    e.preventDefault();
    const next = reportDocumentIssue(state, doc, issue, lines, note, user, new Date().toISOString());
    if (next === state) {
      setError("Enter a whole quantity for at least one item (no more than on the document), or describe the problem.");
      return;
    }
    setState(next);
    setSent(next.reports?.[0]?.id ?? "");
    setOpen(false);
  };
  return (
    <>
      <Button variant="outline" onClick={() => { setIssue("Missing items"); setQty({}); setNote(""); setError(""); setOpen(true); }}>
        <Flag />
        Report an issue
      </Button>
      {sent && <span className="positive text-sm">Sent to the manager as {sent}</span>}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="request-dialog">
          <DialogHeader>
            <DialogTitle>Report an issue</DialogTitle>
            <DialogDescription>{doc.kind} {doc.number ?? doc.reference} · {doc.party}</DialogDescription>
          </DialogHeader>
          <form className="product-form" onSubmit={submit}>
            <label>
              What's wrong?
              <select value={issue} onChange={(e) => setIssue(e.target.value as DocumentReport["issue"])}>
                {reportIssues.map((r) => <option key={r}>{r}</option>)}
              </select>
            </label>
            <div className="request-table">
              <table>
                <thead><tr><th>Item</th><th>On document</th><th>Affected qty</th></tr></thead>
                <tbody>
                  {doc.lines.map((l, i) => (
                    <tr key={i}>
                      <td>{l.name}</td>
                      <td>{l.quantity}</td>
                      <td>
                        <input type="number" min={0} max={l.quantity} step={1} value={qty[i] ?? ""} aria-label={`Affected quantity of ${l.name}`}
                          onChange={(e) => setQty((q) => ({ ...q, [i]: e.target.value }))} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <label>
              Note for the manager
              <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Box arrived with 4 cans missing" />
            </label>
            <p className="text-sm">Affected value: <strong>{money(reportValue({ lines }))}</strong></p>
            {error && <span className="negative text-sm">{error}</span>}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit"><Flag />Send report</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Manager panel: review staff reports and claim supplier refunds. */
export function ReportsPanel() {
  const { state, setState, user } = useStockPilot();
  const [filter, setFilter] = useState<"Open" | "Resolved" | "All">("Open");
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [memos, setMemos] = useState<Record<string, string>>({});
  const reports = (state.reports ?? []).filter((r) => filter === "All" || (filter === "Open" ? r.status === "Open" : r.status !== "Open"));
  return (
    <section className="documents">
      <div className="chart-period-switch" role="group" aria-label="Report status">
        {(["Open", "Resolved", "All"] as const).map((f) => (
          <Button key={f} variant="ghost" size="sm" aria-pressed={filter === f} data-state={filter === f ? "on" : "off"} onClick={() => setFilter(f)}>{f}</Button>
        ))}
      </div>
      {!reports.length && <p className="text-sm text-muted-foreground py-6">No {filter === "All" ? "" : filter.toLowerCase() + " "}reports. Staff can report problems from any invoice or delivery note in Documents.</p>}
      <div className="grid gap-3 py-3">
        {reports.map((r) => {
          const value = reportValue(r);
          const amount = amounts[r.id] ?? (value ? value.toFixed(2) : "");
          return (
            <article key={r.id} className="settings-section">
              <div className="flex justify-between gap-3 flex-wrap">
                <div>
                  <strong>{r.id} · {r.issue}</strong>
                  <p className="text-sm text-muted-foreground">{r.documentLabel} · {r.supplier} · reported by {r.reporter} on {new Date(r.time).toLocaleString()}</p>
                </div>
                <span className={r.status === "Open" ? "negative text-sm" : "positive text-sm"}>
                  {r.status === "Refunded" ? `Refunded ${money(r.refund ?? 0)}` : r.status}
                </span>
              </div>
              {!!r.lines.length && (
                <ul className="text-sm py-2">
                  {r.lines.map((l, i) => <li key={i}>{l.quantity} × {l.name} — {money(l.quantity * l.unit)}</li>)}
                </ul>
              )}
              {r.note && <p className="text-sm">“{r.note}”</p>}
              {r.resolution && <p className="text-sm text-muted-foreground">{r.resolution}{r.resolvedBy ? ` · ${r.resolvedBy}` : ""}</p>}
              {r.status === "Open" && (
                <div className="flex gap-2 flex-wrap items-end pt-2">
                  <label className="text-sm grid gap-1">Refund amount ($)
                    <input className="doc-email-input" type="number" min={0.01} step={0.01} value={amount} onChange={(e) => setAmounts((a) => ({ ...a, [r.id]: e.target.value }))} />
                  </label>
                  <label className="text-sm grid gap-1">Credit memo no. (optional)
                    <input type="text" value={memos[r.id] ?? ""} onChange={(e) => setMemos((m) => ({ ...m, [r.id]: e.target.value }))} />
                  </label>
                  <Button disabled={!(Number(amount) > 0)} onClick={() => setState((s) => refundReport(s, r.id, Number(amount), memos[r.id] ?? "", user, new Date().toISOString()))}>
                    <Check />Record supplier refund
                  </Button>
                  <Button variant="ghost" onClick={() => setState((s) => closeReport(s, r.id, memos[r.id] ?? "", user, new Date().toISOString()))}>
                    <X />Close without refund
                  </Button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
