import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useStockPilot } from "./store";
import {
  customerRefundReasons,
  money,
  refundApprovalLimit,
  refundConditions,
  refundSale,
  refundedQuantity,
  refundWindowDays,
  type StoreDocument,
} from "./model";

/** Cashier refund: look up a sales receipt, pick items, reason, condition and (if needed) manager approval. */
export function RefundDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone: (doc: StoreDocument) => void;
}) {
  const { state, setState, user } = useStockPilot();
  const receipts = (state.documents ?? []).filter((d) => d.kind === "Receipt");
  const [receiptId, setReceiptId] = useState("");
  const [qty, setQty] = useState<Record<string, string>>({});
  const [reason, setReason] = useState<string>(customerRefundReasons[0]);
  const [condition, setCondition] = useState<(typeof refundConditions)[number]>("Resellable");
  const [note, setNote] = useState("");
  const [manager, setManager] = useState("");
  const [error, setError] = useState("");
  const receipt = receipts.find((r) => r.id === receiptId.trim().toUpperCase());
  const lines = Object.entries(qty)
    .map(([productId, v]) => ({ productId, quantity: Number(v) }))
    .filter((l) => l.quantity > 0);
  const total = lines.reduce((n, l) => n + l.quantity * (receipt?.lines.find((x) => x.productId === l.productId)?.unit ?? 0), 0);

  const reset = () => {
    setReceiptId(""); setQty({}); setNote(""); setManager(""); setError(""); setCondition("Resellable");
    setReason(customerRefundReasons[0]);
  };
  const submit = () => {
    if (!receipt) return setError("Enter a valid receipt number.");
    const no = `RF-${String(1000 + (state.documents ?? []).filter((d) => d.kind === "Refund receipt").length + 1)}`;
    const result = refundSale(state, {
      receiptId: receipt.id, lines, reason, note, condition, approvedBy: manager, actor: user, time: new Date().toISOString(), refundNo: no,
    });
    if (!result.refund) return setError(result.error ?? "Refund could not be completed.");
    setState(result.state);
    reset();
    onDone(result.refund);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Refund an item</DialogTitle>
          <DialogDescription>
            Proof of purchase required. Refunds go back to the original payment method within {refundWindowDays} days.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 text-sm">
          <label className="grid gap-1">
            <span>Receipt number</span>
            <Input list="refund-receipts" placeholder="e.g. R-1001" value={receiptId} onChange={(e) => { setReceiptId(e.target.value); setQty({}); setError(""); }} />
            <datalist id="refund-receipts">{receipts.map((r) => <option key={r.id} value={r.id} />)}</datalist>
            {!receipts.length && <small className="text-muted-foreground">No sales yet — make a sale first.</small>}
          </label>
          {receipt && (
            <div className="grid gap-2 rounded-md border p-2">
              <small className="text-muted-foreground">
                Sold {new Date(receipt.time).toLocaleString()} · paid by {receipt.method}
              </small>
              {receipt.lines.map((l) => {
                const left = l.productId ? l.quantity - refundedQuantity(state, receipt.id, l.productId) : 0;
                return (
                  <div key={l.productId ?? l.name} className="flex items-center justify-between gap-2">
                    <span>{l.name} · {money(l.unit)} <small className="text-muted-foreground">({left} of {l.quantity} refundable)</small></span>
                    <Input
                      aria-label={`Refund quantity for ${l.name}`}
                      className="w-20"
                      type="number" min={0} max={left} step={1} disabled={!l.productId || left <= 0}
                      value={l.productId ? (qty[l.productId] ?? "") : ""}
                      onChange={(e) => l.productId && setQty((q) => ({ ...q, [l.productId as string]: e.target.value }))}
                    />
                  </div>
                );
              })}
            </div>
          )}
          <label className="grid gap-1">
            <span>Reason</span>
            <select className="h-9 rounded-md border bg-background px-2" value={reason} onChange={(e) => setReason(e.target.value)}>
              {customerRefundReasons.map((r) => <option key={r}>{r}</option>)}
            </select>
          </label>
          <label className="grid gap-1">
            <span>Item condition</span>
            <select className="h-9 rounded-md border bg-background px-2" value={condition} onChange={(e) => setCondition(e.target.value as typeof condition)}>
              <option value="Resellable">Resellable — put back on the shelf</option>
              <option value="Damaged">Damaged — write off, don't restock</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span>Note (optional)</span>
            <Textarea rows={2} maxLength={200} placeholder="e.g. Cap was leaking" value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          {total > refundApprovalLimit && (
            <label className="grid gap-1">
              <span>Manager approval (over {money(refundApprovalLimit)})</span>
              <Input placeholder="Manager name" value={manager} onChange={(e) => setManager(e.target.value)} />
            </label>
          )}
          <div className="flex justify-between font-medium"><span>Refund total</span><span className="negative">−{money(total)}</span></div>
          {error && <p className="negative" role="alert">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!receipt || !lines.length}>Issue refund</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
