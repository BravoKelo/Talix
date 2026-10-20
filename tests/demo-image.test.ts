import { describe, expect, it } from "vitest";
import { displayImageUrl } from "../src/lib/demo-image";

describe("bundled demo images", () => {
  it("loads showcase images from the deployment currently being viewed", () => {
    expect(
      displayImageUrl(
        "https://talix-git-feature-website-owner-onboarding-bravokelo.vercel.app/demo-showcase/cedar-stone-kitchen-hero.webp",
      ),
    ).toBe("/demo-showcase/cedar-stone-kitchen-hero.webp");
  });

  it("preserves customer-hosted images", () => {
    expect(displayImageUrl("https://images.example.com/hero.webp")).toBe(
      "https://images.example.com/hero.webp",
    );
  });
});
