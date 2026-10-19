import { test, expect } from "@playwright/test";
import { onboardingGateway } from "../helpers/onboarding-gateway";
for (const legacy of [false, true])
  test(`industry change ${legacy ? "unapplied migration fallback" : "review, price re-review and safe network retry"}`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    const gateway = await onboardingGateway(
      legacy ? ["20261018214826_subscription_industry_changes.sql"] : [],
    );
    let dropConfirmation = false;
    await page.context().route("http://127.0.0.1:3290/**", async (route) => {
      const req = route.request();
      const res = await fetch(req.url(), {
        method: req.method(),
        headers: req.headers(),
        body: ["GET", "HEAD"].includes(req.method())
          ? undefined
          : req.postData(),
      });
      const body = Buffer.from(await res.arrayBuffer());
      if (
        dropConfirmation &&
        req.url().endsWith("/confirm_subscription_change") &&
        res.ok
      ) {
        dropConfirmation = false;
        return route.abort();
      }
      await route.fulfill({
        status: res.status,
        headers: Object.fromEntries(res.headers),
        body,
      });
    });
    try {
      const user = await gateway.addAccount("industry-owner@example.invalid");
      await gateway.db.query(
        "select set_config('request.jwt.claim.sub',$1,false)",
        [user.id],
      );
      const retail = (
        await gateway.db.query<{ id: string }>(
          "select id from public.business_types where name='Retail'",
        )
      ).rows[0].id;
      const restaurant = (
        await gateway.db.query<{ id: string }>(
          "select id from public.business_types where name='Restaurant'",
        )
      ).rows[0].id;
      const plan = (
        await gateway.db.query<{ id: string }>(
          "select id from public.talix_offerings where business_type_id=$1 and name='Starter'",
          [retail],
        )
      ).rows[0].id;
      const nextPlan = (
        await gateway.db.query<{ id: string }>(
          "select id from public.talix_offerings where business_type_id=$1 and name='Plus'",
          [restaurant],
        )
      ).rows[0].id;
      const quote = (
        await gateway.db.query<{ value: unknown }>(
          "select public.subscription_quote($1,$2,'{}') value",
          [retail, plan],
        )
      ).rows[0].value;
      const sid = (
        await gateway.db.query<{ value: string }>(
          "select public.start_subscription($1,$2,$3,$4,'{}',$5) value",
          [
            crypto.randomUUID(),
            {
              business_name: "Example business",
              contact_name: "Owner",
              phone: "+15551234567",
              billing_address: "123 Main, Seattle, WA, 98101, United States",
              location_name: "Main",
              location_address: "123 Main, Seattle, WA, 98101, United States",
            },
            retail,
            plan,
            quote,
          ],
        )
      ).rows[0].value;
      const original = (
        await gateway.db.query(
          "select * from public.subscription_purchases where subscription_id=$1",
          [sid],
        )
      ).rows;
      await page.goto("/login");
      await page.getByLabel("Email", { exact: true }).fill(user.email);
      await page
        .getByLabel("Password", { exact: true })
        .fill("test-password-only");
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await expect(page).toHaveURL(/\/workspace$/);
      await page
        .getByRole("navigation", { name: "Workspace shortcuts" })
        .getByRole("button", { name: "Settings", exact: true })
        .click();
      await page
        .getByRole("button", { name: /Your subscription Current plan/ })
        .click();
      const summary = page.locator(".subscription-summary");
      if (legacy) {
        await expect(
          summary.getByText("Industry changes are not available yet."),
        ).toBeVisible();
        await expect(
          summary.getByRole("button", { name: "Change industry" }),
        ).toHaveCount(0);
        await expect(summary).toContainText("Retail");
        return;
      }
      await summary.getByRole("button", { name: "Change industry" }).click();
      const dialog = page.getByRole("dialog", {
        name: "Change your business industry",
      });
      await dialog
        .getByLabel("Industry", { exact: true })
        .selectOption(restaurant);
      await dialog.getByLabel("Plan", { exact: true }).selectOption(nextPlan);
      await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(summary).toContainText("Retail");
      await summary.getByRole("button", { name: "Change industry" }).click();
      await dialog
        .getByLabel("Industry", { exact: true })
        .selectOption(restaurant);
      await dialog.getByLabel("Plan", { exact: true }).selectOption(nextPlan);
      await dialog.getByRole("button", { name: "Review change" }).click();
      await expect(
        dialog.getByRole("heading", { name: "New plan" }),
      ).toBeVisible();
      await gateway.db.query(
        "update public.talix_offerings set price_cents=price_cents+100 where id=$1",
        [nextPlan],
      );
      await dialog
        .getByRole("button", { name: "Confirm change", exact: true })
        .click();
      await expect(dialog.getByRole("alert")).toContainText(
        "could not be confirmed",
      );
      await dialog.getByRole("button", { name: "Back", exact: true }).click();
      await expect(dialog.getByLabel("Plan", { exact: true })).toHaveValue(
        nextPlan,
      );
      await dialog.getByRole("button", { name: "Review change" }).click();
      await page.screenshot({
        path: `test-results/industry-review-${test.info().project.name}.png`,
      });
      dropConfirmation = true;
      await dialog
        .getByRole("button", { name: "Confirm change", exact: true })
        .click();
      await expect(dialog.getByRole("alert")).toContainText(
        "Retry confirmation safely",
      );
      await dialog
        .getByRole("button", { name: "Confirm change", exact: true })
        .click();
      await expect(dialog).toHaveCount(0);
      await expect(summary).toContainText("Restaurant");
      expect(
        (
          await gateway.db.query(
            "select * from public.subscription_changes where subscription_id=$1",
            [sid],
          )
        ).rows,
      ).toHaveLength(1);
      expect(
        (
          await gateway.db.query(
            "select * from public.subscription_purchases where subscription_id=$1",
            [sid],
          )
        ).rows,
      ).toEqual(original);
      await summary.locator("summary").click();
      await expect(summary).toContainText("Retail → Restaurant");
      await page.reload();
      await page
        .getByRole("navigation", { name: "Workspace shortcuts" })
        .getByRole("button", { name: "Settings", exact: true })
        .click();
      await page
        .getByRole("button", { name: /Your subscription Current plan/ })
        .click();
      await expect(summary).toContainText("Restaurant");
    } finally {
      await gateway.close();
    }
  });
