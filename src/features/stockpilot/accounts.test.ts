import { describe, expect, it } from "vitest";
import { findAccount } from "./accounts";

describe("test accounts", () => {
  it("signs manager in as Manager", () => expect(findAccount("manager", "manager123")?.role).toBe("Manager"));
  it("signs staff in as Staff", () => expect(findAccount("staff", "staff123")?.role).toBe("Staff"));
  it("rejects a wrong password", () => expect(findAccount("manager", "staff123")).toBeUndefined());
});
