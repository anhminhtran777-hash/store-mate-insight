import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Extra session-only preference panels for Settings. Values are kept for this browser session only. */
export type ExtraTab = "store" | "notifications" | "inventory" | "cashier" | "regional" | "security";

type Opt = { kind: "toggle"; label: string; hint?: string } | { kind: "select"; label: string; options: string[] } | { kind: "text"; label: string; type?: string; placeholder?: string };
type Section = { title: string; fields: Record<string, Opt> };

export const extraTabs: { id: ExtraTab; label: string; managerOnly?: boolean }[] = [
  { id: "store", label: "Store details", managerOnly: true },
  { id: "notifications", label: "Notifications" },
  { id: "inventory", label: "Inventory", managerOnly: true },
  { id: "cashier", label: "Cashier & receipts", managerOnly: true },
  { id: "regional", label: "Language & region" },
  { id: "security", label: "Account & security" },
];

const schema: Record<ExtraTab, Section[]> = {
  store: [
    { title: "Contact & legal", fields: {
      address: { kind: "text", label: "Street address", placeholder: "12 Main Street" },
      city: { kind: "text", label: "City & postcode", placeholder: "Springfield 10001" },
      phone: { kind: "text", label: "Phone", type: "tel", placeholder: "+1 555 0100" },
      email: { kind: "text", label: "Store email", type: "email", placeholder: "hello@yourstore.com" },
      taxId: { kind: "text", label: "Tax / VAT number", placeholder: "US-000000000" },
    } },
    { title: "Opening hours", fields: {
      weekdays: { kind: "text", label: "Monday – Friday", placeholder: "07:00 – 22:00" },
      weekend: { kind: "text", label: "Saturday – Sunday", placeholder: "08:00 – 20:00" },
    } },
  ],
  notifications: [
    { title: "Alerts", fields: {
      lowStock: { kind: "toggle", label: "Low-stock alerts", hint: "Notify when an item falls under its reorder point" },
      outOfStock: { kind: "toggle", label: "Out-of-stock alerts" },
      orders: { kind: "toggle", label: "Purchase order updates", hint: "Approvals, supplier confirmations and deliveries" },
      reports: { kind: "toggle", label: "Staff issue reports" },
      sound: { kind: "toggle", label: "Play a sound for new alerts" },
    } },
    { title: "Summaries", fields: {
      digest: { kind: "select", label: "Email summary", options: ["Off", "Daily", "Weekly", "Monthly"] },
    } },
  ],
  inventory: [
    { title: "Stock rules", fields: {
      reorderPoint: { kind: "text", label: "Default reorder point (units)", type: "number" },
      reorderQty: { kind: "text", label: "Default reorder quantity (units)", type: "number" },
      negative: { kind: "toggle", label: "Allow selling below zero stock" },
      autoDraft: { kind: "toggle", label: "Draft purchase requests automatically for low stock" },
      costing: { kind: "select", label: "Stock valuation method", options: ["Average cost", "FIFO (first in, first out)", "Last purchase price"] },
    } },
  ],
  cashier: [
    { title: "Checkout", fields: {
      tax: { kind: "text", label: "Default sales tax (%)", type: "number" },
      payments: { kind: "select", label: "Default payment method", options: ["Card", "Cash"] },
      rounding: { kind: "select", label: "Cash rounding", options: ["None", "Nearest 0.05", "Nearest 0.10"] },
      confirmVoid: { kind: "toggle", label: "Require manager approval to void a sale" },
    } },
    { title: "Receipts", fields: {
      autoPrint: { kind: "toggle", label: "Print receipt automatically after payment" },
      digital: { kind: "toggle", label: "Offer digital receipt by email" },
      footer: { kind: "text", label: "Receipt footer message", placeholder: "Thank you for shopping with us!" },
    } },
  ],
  regional: [
    { title: "Language & formats", fields: {
      language: { kind: "select", label: "Language", options: ["English", "Български", "Deutsch", "Español", "Français"] },
      timezone: { kind: "select", label: "Time zone", options: ["Europe/Sofia (UTC+3)", "Europe/London (UTC+1)", "America/New_York (UTC−4)", "America/Los_Angeles (UTC−7)"] },
      dateFormat: { kind: "select", label: "Date format", options: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"] },
      timeFormat: { kind: "select", label: "Time format", options: ["24-hour", "12-hour"] },
      week: { kind: "select", label: "Week starts on", options: ["Monday", "Sunday"] },
    } },
  ],
  security: [
    { title: "Password", fields: {
      current: { kind: "text", label: "Current password", type: "password" },
      next: { kind: "text", label: "New password", type: "password" },
    } },
    { title: "Sign-in & session", fields: {
      twoFactor: { kind: "toggle", label: "Two-step verification", hint: "Ask for a code when signing in on a new device" },
      autoLock: { kind: "select", label: "Lock screen after inactivity", options: ["Never", "5 minutes", "15 minutes", "30 minutes", "1 hour"] },
      pin: { kind: "toggle", label: "Require PIN to switch cashier user" },
    } },
  ],
};

const defaults: Record<string, string | boolean> = {
  lowStock: true, outOfStock: true, orders: true, reports: true, sound: false, digest: "Weekly",
  reorderPoint: "12", reorderQty: "24", negative: false, autoDraft: false, costing: "Average cost",
  tax: "0", payments: "Card", rounding: "None", confirmVoid: true, autoPrint: false, digital: true,
  footer: "Thank you for shopping with us!", language: "English", timezone: "Europe/Sofia (UTC+3)",
  dateFormat: "DD/MM/YYYY", timeFormat: "24-hour", week: "Monday", twoFactor: false, autoLock: "15 minutes", pin: true,
};
// Session-only store shared across tab switches and navigation.
const sessionValues: Record<string, string | boolean> = { ...defaults };

export function ExtraSettings({ tab }: { tab: ExtraTab }) {
  const [values, setValues] = useState<Record<string, string | boolean>>({ ...sessionValues });
  const [saved, setSaved] = useState(false);
  const set = (k: string, v: string | boolean) => { setValues((p) => ({ ...p, [k]: v })); setSaved(false); };
  const label = extraTabs.find((t) => t.id === tab)?.label;
  return (
    <form
      className="product-form"
      onSubmit={(e) => {
        e.preventDefault();
        const clean = { ...values };
        if (tab === "security") { clean["current"] = ""; clean["next"] = ""; }
        Object.assign(sessionValues, clean);
        setValues(clean);
        setSaved(true);
      }}
    >
      <h2>{label}</h2>
      {schema[tab].map((s) => (
        <fieldset key={s.title} className="grid gap-3 rounded-md border border-border p-4">
          <legend className="px-1 text-sm font-medium">{s.title}</legend>
          {Object.entries(s.fields).map(([k, f]) =>
            f.kind === "toggle" ? (
              <div key={k} className="settings-check">
                <label>
                  <input type="checkbox" checked={Boolean(values[k])} onChange={(e) => set(k, e.target.checked)} />
                  <span>{f.label}{f.hint && <small className="block text-muted-foreground">{f.hint}</small>}</span>
                </label>
              </div>
            ) : f.kind === "select" ? (
              <label key={k}>{f.label}
                <select value={String(values[k] ?? "")} onChange={(e) => set(k, e.target.value)}>
                  {f.options.map((o) => <option key={o}>{o}</option>)}
                </select>
              </label>
            ) : (
              <label key={k}>{f.label}
                <input type={f.type ?? "text"} placeholder={f.placeholder} value={String(values[k] ?? "")} minLength={f.type === "password" ? 4 : undefined} onChange={(e) => set(k, e.target.value)} />
              </label>
            ),
          )}
        </fieldset>
      ))}
      <div className="flex gap-4 items-center">
        <Button type="submit">{tab === "security" ? "Update security" : "Save settings"}</Button>
        {saved && <span className="positive text-sm"><Check size={14} className="inline" /> Changes saved</span>}
      </div>
    </form>
  );
}
