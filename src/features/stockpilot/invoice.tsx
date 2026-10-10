import { money, type StoreDocument } from "./model";

/** Boxed original-invoice layout; missing legal data is explicit, never fabricated. */
export function InvoiceSheet({ doc, buyer }: { doc: StoreDocument; buyer: string }) {
  const date = new Date(doc.time).toLocaleDateString("en-GB");
  const acc = doc.kind === "Accounting invoice";
  const credit = doc.kind === "Credit memo";
  return (
    <article className="doc-sheet doc-business doc-invoice" aria-label={credit ? "Credit memo" : "Supplier invoice"}>
      <p className="invoice-demo">{acc || credit ? "ACCOUNTING ONLY · NOT LINKED TO DELIVERED STOCK" : "SIMULATED SUPPLIER DOCUMENT · NOT VALID FOR TAX OR PAYMENT"}</p>
      <header className="invoice-heading">
        <div><strong>Recipient / buyer</strong><span>{buyer}</span><span>Address: Not recorded</span><span>Company ID: Not recorded</span><span>VAT ID: Not recorded</span><span>Representative: Not recorded</span></div>
        <h2>{credit ? "CREDIT MEMO" : "INVOICE"}<br /><span>ORIGINAL</span></h2>
        <div><strong>Issuer / supplier</strong><span>{doc.party}</span><span>Address: Not recorded</span><span>Company ID: Not recorded</span><span>VAT ID: Not recorded</span><span>Representative: Not recorded</span></div>
      </header>
      <div className="invoice-type"><strong>{credit ? "Credit memo" : "Standard invoice"}</strong><span>{acc || credit ? `Accounting record${doc.note ? ` · ${doc.note}` : ""}` : `Purchase request: ${doc.reference}`}</span></div>
      <dl className="invoice-meta">
        <div><dt>{credit ? "Credit memo number" : "Invoice number"}</dt><dd>{doc.number ?? doc.reference}</dd></div>
        <div><dt>Issue date</dt><dd>{date}</dd></div>
        <div><dt>Place of supply</dt><dd>Not recorded</dd></div>
        <div><dt>Tax event date</dt><dd>Not recorded</dd></div>
      </dl>
      <table>
        <thead><tr><th>No.</th><th>Description of goods / services</th><th>Unit</th><th>Quantity</th><th>Unit price</th><th>Amount</th></tr></thead>
        <tbody>{doc.lines.map((line, i) => <tr key={i}><td>{i + 1}</td><td>{line.name}</td><td>{acc || credit ? "—" : "pcs"}</td><td>{line.quantity}</td><td>{money(line.unit)}</td><td>{money(line.unit * line.quantity)}</td></tr>)}</tbody>
      </table>
      <section className="invoice-totals">
        <dl><div><dt>{credit ? "Credited value" : "Goods value"}</dt><dd>{money(doc.total)}</dd></div><div><dt>VAT rate / amount</dt><dd>Not recorded</dd></div></dl>
        <div><span>{credit ? "Credit total (recorded)" : "Invoice total (recorded)"}</span><strong>{credit ? `−${money(doc.total)}` : money(doc.total)}</strong><small>Tax breakdown unavailable</small></div>
        <div><span>Payment method: Not recorded</span><span>Due date: Not recorded</span><span>Prepared by: {doc.actor}</span></div>
      </section>
      <section className="invoice-links"><strong>Supporting documents</strong><span>{acc || credit ? `None — this ${credit ? "credit memo" : "invoice"} does not change stock or link to a delivery.${credit && doc.reason ? ` Refers to invoice ${doc.reason}.` : ""}` : `Purchase request ${doc.reference} · Linked delivery note and goods receipt available in the document record.`}</span></section>
      <footer className="invoice-signatures"><div>Recipient<span>Signature</span></div><div>Issuer<span>Signature</span></div></footer>
    </article>
  );
}