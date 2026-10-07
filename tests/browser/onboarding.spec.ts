import { expect, test } from "@playwright/test";
test.use({ actionTimeout: 10000 });
import { onboardingGateway } from "../helpers/onboarding-gateway";
test("landing → signup → confirmation → price review → workspace; staff edits never rewrite purchased terms", async ({
  page,
  browser,
}) => {
  test.setTimeout(60000);
  const gateway = await onboardingGateway();
  async function connect(context: import("@playwright/test").BrowserContext) {
    await context.route("http://127.0.0.1:3290/**", async (route) => {
      const request = route.request();
      const response = await fetch(request.url(), {
        method: request.method(),
        headers: request.headers(),
        body: ["GET", "HEAD"].includes(request.method())
          ? undefined
          : request.postData(),
      });
      await route.fulfill({
        status: response.status,
        headers: Object.fromEntries(response.headers),
        body: Buffer.from(await response.arrayBuffer()),
      });
    });
  }
  await connect(page.context());
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await page.goto(
      "/auth/confirm?token_hash=unused&type=recovery&next=https://example.com",
    );
    await expect(page).toHaveURL(
      /\/login\?confirmation=failed&next=onboarding$/,
    );
    await page
      .getByLabel("Email", { exact: true })
      .fill("newowner@example.invalid");
    await expect(
      page.getByRole("button", { name: "Resend confirmation email" }),
    ).toHaveCount(0);
    await page.goto("/");
    await page.getByRole("link", { name: "Sign up →", exact: true }).click();
    await page
      .getByLabel("Business name", { exact: true })
      .fill("Independent shop");
    await page.getByLabel("Your full name").fill("Alex Owner");
    await page.getByLabel("Business phone").fill("5551234567");
    await page.getByLabel("Billing address").fill("100 Billing Road");
    await page.getByLabel("First location name").fill("Main shop");
    await page.getByLabel("Location address").fill("200 Main Road");
    await page.getByLabel("Your online store address").fill("independent-shop");
    await page.getByRole("button", { name: "Choose your plan →" }).click();
    await page
      .getByRole("combobox", { name: "Business type", exact: true })
      .selectOption({ label: "Retail" });
    await page.getByRole("radio", { name: /Starter/ }).check();
    await page.getByRole("checkbox", { name: /Extra insights/ }).check();
    await page.getByRole("button", { name: "Review your selection →" }).click();
    await expect(
      page.getByText("$39.00 / month", { exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: `test-results/signup-review-${test.info().project.name}.png`,
      fullPage: true,
    });
    await page
      .getByLabel("Email", { exact: true })
      .fill("newowner@example.invalid");
    await page
      .getByLabel("Password", { exact: true })
      .fill("Test-only-long-password!");
    await page.getByLabel("Confirm password").fill("Test-only-long-password!");
    gateway.setAutoconfirm(false);
    await page.getByRole("button", { name: "Sign up", exact: true }).click();
    await expect(page.getByRole("status")).toContainText(
      "Signup is temporarily unavailable.",
    );
    expect(gateway.signupBody).toBeUndefined();
    expect(gateway.mailRequests).toBe(0);
    gateway.setAutoconfirm(true);
    await page.getByRole("button", { name: "Sign up", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Thanks for signing up." }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/signup\/confirmation$/);
    await expect(page.getByText("Email confirmation sent to:")).toContainText(
      "newowner@example.invalid",
    );
    await expect(
      page.getByText("(Feature coming soon)", { exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByText("(Feature coming soon)", { exact: true }),
    ).toBeVisible();
    expect(await page.locator("body").innerText()).not.toMatch(
      /demonstration|Supabase|schema|RPC/i,
    );
    await page.screenshot({
      path: `test-results/signup-confirmation-${test.info().project.name}.png`,
      fullPage: true,
    });
    expect(gateway.signupBody).toMatchObject({
      email: "newowner@example.invalid",
      data: {
        talix_onboarding: {
          business: { business_name: "Independent shop" },
          quote: { total_cents: 3900 },
        },
      },
    });
    expect(
      (await gateway.db.query("select id from public.clients")).rows,
    ).toEqual([]);
    // This also retains coverage of the future email-token callback, independent of signup.
    await gateway.confirm("newowner@example.invalid");
    const staffContext = await browser.newContext();
    await connect(staffContext);
    const staff = await staffContext.newPage();
    await staff.goto("/login?next=admin");
    await staff
      .getByLabel("Email", { exact: true })
      .fill("staff@example.invalid");
    await staff
      .getByLabel("Password", { exact: true })
      .fill("Test-only-long-password!");
    await staff.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(
      staff.getByRole("heading", { name: "Your offerings and customers." }),
    ).toBeVisible();
    const retailStarter = staff
      .locator(".list-item")
      .filter({
        has: staff.getByRole("heading", { name: "Starter", exact: true }),
      })
      .filter({ hasText: "Retail" });
    await retailStarter
      .getByRole("button", { name: "Edit Starter", exact: true })
      .click();
    const offeringEditor = staff.locator("form").filter({
      has: staff.getByRole("heading", { name: "Edit offering", exact: true }),
    });
    await offeringEditor.getByLabel("Price (USD)").fill("49.00");
    await offeringEditor.getByRole("button", { name: "Save offering" }).click();
    await expect(
      staff.getByRole("status").filter({ hasText: "Changes saved." }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Continue →", exact: true }).click();
    await expect(page).toHaveURL(/\/onboarding$/);
    await expect(
      page.getByText("$59.00 / month", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Please review the current pricing before continuing."),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Confirm subscription", exact: true })
      .click();
    await expect(page).toHaveURL(/\/workspace$/);
    await expect(
      page.getByRole("heading", { name: "Independent shop", exact: true }),
    ).toBeVisible();
    expect(
      (
        await gateway.db.query(
          "select total_cents from public.subscription_purchases",
        )
      ).rows,
    ).toEqual([{ total_cents: 5900 }]);
    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { name: "Talix staff access only." }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save offering" }),
    ).toHaveCount(0);
    await staff.getByRole("button", { name: "Customers", exact: true }).click();
    await expect(
      staff.getByText("newowner@example.invalid", { exact: false }),
    ).toBeVisible();
    await expect(staff.getByText(/\$59.00 \/ month/)).toBeVisible();
    await staff.getByRole("button", { name: "Offerings", exact: true }).click();
    await retailStarter
      .getByRole("button", { name: "Edit Starter", exact: true })
      .click();
    await staff
      .locator("form")
      .filter({
        has: staff.getByRole("heading", { name: "Edit offering", exact: true }),
      })
      .getByLabel("Price (USD)")
      .fill("99.00");
    await staff.getByRole("button", { name: "Save offering" }).click();
    await expect(
      staff.getByRole("status").filter({ hasText: "Changes saved." }),
    ).toBeVisible();
    expect(
      (
        await gateway.db.query(
          "select total_cents from public.subscription_purchases",
        )
      ).rows,
    ).toEqual([{ total_cents: 5900 }]);
    await staff
      .getByRole("button", { name: "Add offering", exact: true })
      .click();
    const newOffering = staff.locator("form").filter({
      has: staff.getByRole("heading", {
        name: "Add an offering",
        exact: true,
      }),
    });
    await newOffering
      .getByRole("combobox", { name: "Offering type", exact: true })
      .selectOption("addon");
    await newOffering
      .getByLabel("Name", { exact: true })
      .fill("Custom assistance");
    await newOffering
      .getByLabel("Description", { exact: true })
      .fill("A sample optional product.");
    await newOffering.getByLabel("Price (USD)").fill("12.00");
    await newOffering.getByRole("button", { name: "Save offering" }).click();
    await expect(
      staff.getByRole("heading", { name: "Custom assistance", exact: true }),
    ).toBeVisible();
    expect(
      (
        await gateway.db.query(
          "select total_cents from public.subscription_purchases",
        )
      ).rows,
    ).toEqual([{ total_cents: 5900 }]);
    await page.goto("/signup");
    expect(await page.locator("body").innerText()).not.toMatch(
      /Supabase|PostgreSQL|schema|RPC|business-neutral/,
    );
    await page.screenshot({
      path: `test-results/signup-${test.info().project.name}.png`,
      fullPage: true,
    });
    expect(errors).toEqual([]);
    expect(gateway.mailRequests).toBe(0);
    await page.goto("/signup/confirmation?email=someone-else@example.invalid");
    await expect(page).toHaveURL(/\/workspace$/);
    await page.goto(
      "/auth/confirm?token_hash=verification-token&type=email&next=https://example.com",
    );
    await expect(page).toHaveURL(/\/onboarding$/);
    await staffContext.close();
  } finally {
    await gateway.close();
  }
});
