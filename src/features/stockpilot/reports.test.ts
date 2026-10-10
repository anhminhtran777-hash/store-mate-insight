import { describe, it, expect } from "vitest";
import { initialState, reportDocumentIssue, refundReport, canAccessPage, type StoreDocument } from "./model";
const doc: StoreDocument = { id: "d1", kind: "Invoice", reference: "PO-1040", party: "Fresh Co", actor: "x", time: "t", lines: [{ name: "Milk", quantity: 10, unit: 1.1 }], total: 11 };
describe("supplier document reports", () => {
  it("staff can open documents but not reports", () => {
    expect(canAccessPage("Staff", "Documents")).toBe(true);
    expect(canAccessPage("Staff", "Reports")).toBe(false);
    expect(canAccessPage("Manager", "Reports")).toBe(true);
  });
  it("rejects reporting more than the document lists", () => {
    const s = reportDocumentIssue(initialState, doc, "Missing items", [{ name: "Milk", quantity: 11, unit: 1.1 }], "", "Demo Staff", "t");
    expect(s).toBe(initialState);
  });
  it("supplier refund resolves the report once and logs a refund", () => {
    const s = reportDocumentIssue(initialState, doc, "Missing items", [{ name: "Milk", quantity: 2, unit: 1.1 }], "short", "Demo Staff", "t");
    const id = s.reports?.[0]?.id ?? "";
    const r = refundReport(s, id, 2.2, "CM-1", "Demo Manager", "t2");
    expect(r.reports?.[0]?.status).toBe("Refunded");
    expect(r.activities[0]?.flow).toBe("refund");
    expect(r.activities[0]?.amount).toBe(2.2);
    expect(refundReport(r, id, 2.2, "", "Demo Manager", "t3")).toBe(r);
  });
});
