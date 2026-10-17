import { expect, it } from "vitest";
import { imageObjectName, savedImageName } from "../src/lib/image-name";

it("retains original filenames through encoded public URLs", () => {
  for (const name of ["logo.png", "Shop logo 50%.png", "Café #1?.webp"]) {
    const path = imageObjectName("11111111-1111-4111-8111-111111111111", name);
    expect(path).not.toContain("/");
    expect(
      savedImageName(`https://example.test/images/${encodeURI(path)}`),
    ).toBe(name);
  }
});
it("shows stored legacy names and only returns no filename for absent images", () => {
  expect(savedImageName("https://example.test/old-image.png?x=1")).toBe(
    "old-image.png",
  );
  expect(savedImageName(null)).toBeNull();
  expect(savedImageName("https://example.test/")).toBe("Saved image");
});
