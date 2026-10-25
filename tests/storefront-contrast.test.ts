import { expect, it } from "vitest";
import { contrastRatio, defaultDesign } from "../src/lib/storefront-design";

it("measures actual product foregrounds against their white background without rounding the acceptance threshold", () => {
  expect(contrastRatio("#ffffff", "#ffffff")).toBe(1);
  expect(contrastRatio("#000000", "#ffffff")).toBe(21);
  expect(contrastRatio("#777777", "#ffffff")).toBeLessThan(4.5);
  for (const color of [
    "#767676",
    "#315566",
    "#667189",
    "#667085",
    defaultDesign.storefront_text,
  ]) {
    expect(contrastRatio(color, "#ffffff"), color).toBeGreaterThanOrEqual(4.5);
  }
});
