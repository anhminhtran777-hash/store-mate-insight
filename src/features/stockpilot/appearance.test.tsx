import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { AppearanceProvider, AppearanceSettings } from "./appearance";

afterEach(cleanup);

it("applies all workspace themes and restores the default", () => {
  render(<AppearanceProvider><AppearanceSettings /></AppearanceProvider>);
  expect(document.documentElement.dataset["theme"]).toBe("forest");
  fireEvent.click(screen.getByRole("button", { name: /Nightfall/ }));
  expect(document.documentElement.dataset["theme"]).toBe("night");
  expect(document.documentElement.classList.contains("dark")).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: /Daylight/ }));
  expect(document.documentElement.dataset["theme"]).toBe("daylight");
  expect(document.documentElement.classList.contains("dark")).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: /Forest/ }));
  expect(document.documentElement.dataset["theme"]).toBe("forest");
});