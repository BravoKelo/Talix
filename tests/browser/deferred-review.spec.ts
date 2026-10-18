import { test, expect } from "@playwright/test";

test("deferred proposals review without changing a subscription", async ({
  page,
}) => {
  await page.goto("/prototypes/deferred-review.html");
  await expect(
    page.getByRole("heading", { name: "Your order is ready" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Return to storefront" }).click();
  await expect(page.getByRole("status")).toContainText(
    "without sharing the private order link",
  );
  await page
    .getByRole("button", { name: "Change industry", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Change industry", exact: true })
    .last()
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog
    .getByLabel("Industry", { exact: true })
    .selectOption("Restaurant");
  await dialog.getByLabel("Plan", { exact: true }).selectOption("59.99");
  await dialog.getByRole("button", { name: "Review change" }).click();
  await expect(dialog).toContainText("Restaurant · Pro");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(
    page.getByText("Other business · Starter", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/deferred-review-${test.info().project.name}.png`,
    fullPage: true,
  });
});
