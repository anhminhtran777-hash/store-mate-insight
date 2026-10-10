import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { ProductCharts } from "./charts";
import { initialState } from "./model";

afterEach(cleanup);

it("switches chart periods without a hook crash and exposes yearly totals", () => {
  const product = initialState.products[0];
  if (!product) throw new Error("Missing demo product");
  render(<ProductCharts product={product} />);
  for (const period of ["Daily", "Weekly", "Monthly", "Yearly"]) {
    fireEvent.click(screen.getByRole("button", { name: period }));
    fireEvent.focus(screen.getByRole("img", { name: new RegExp(`${period} received and sold`) }));
    const tooltip = screen.getAllByRole("tooltip")[1];
    expect(tooltip?.textContent).toContain(period === "Yearly" ? "900 units" : period === "Monthly" ? "132 units" : period === "Weekly" ? "80 units" : "14 units");
  }
});