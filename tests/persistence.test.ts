import { describe, expect, it } from "vitest";
import { confirmedMutation } from "../src/lib/persistence";

describe("acknowledged persistence", () => {
  it("returns the authoritative saved row", () => {
    expect(confirmedMutation({ data: { id: "saved" }, error: null })).toEqual({
      id: "saved",
    });
  });

  it("does not report a zero-row mutation as successful", () => {
    expect(() =>
      confirmedMutation(
        { data: null, error: null },
        "Your access changed before this could be saved.",
      ),
    ).toThrow("Your access changed before this could be saved.");
  });

  it("preserves the database error for actionable handling", () => {
    const error = new Error("permission denied");
    expect(() => confirmedMutation({ data: null, error })).toThrow(error);
  });
});
