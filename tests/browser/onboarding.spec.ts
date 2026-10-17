import { expect, test } from "@playwright/test";
test.use({ actionTimeout: 10000 });
import { onboardingGateway } from "../helpers/onboarding-gateway";
for (const changedPrice of [false, true])
  test(`signup → confirmation → ${changedPrice ? "changed price review" : "direct completion"} → workspace`, async ({
    page,
    browser,
  }) => {
    test.setTimeout(120000);
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
    if (test.info().project.name === "mobile" && !changedPrice)
      await page.setViewportSize({ width: 320, height: 780 });
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
      await expect(
        page.getByRole("heading", {
          name: "Your next order. Your next opportunity.",
        }),
      ).toBeVisible();
      await page.getByRole("link", { name: "Questions", exact: true }).click();
      await page
        .getByText("Will I be charged when I try Talix?", { exact: true })
        .click();
      await expect(
        page.getByText(/Payments are simulated; no money is collected/),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      await page
        .getByRole("link", { name: "Back to top", exact: true })
        .click();
      await expect
        .poll(() => page.evaluate(() => window.scrollY))
        .toBeLessThan(4);
      const navigationRows = await page
        .locator(".home-nav a")
        .evaluateAll((links) =>
          links.map((link) => Math.round(link.getBoundingClientRect().top)),
        );
      expect(new Set(navigationRows).size).toBe(1);
      await page.goto("/");
      await page.screenshot({
        path: `test-results/landing-${test.info().project.name}.png`,
        fullPage: true,
      });
      await page.getByRole("link", { name: "Sign up →", exact: true }).click();
      await page
        .getByLabel("Business name", { exact: true })
        .fill("Independent shop");
      await page.getByLabel("Your full name").fill("Alex Owner");
      await page.getByLabel("Business phone").fill("5551234567");

      await page.getByLabel("First location name").fill("Main shop");
      for (const title of ["Billing address", "Location address"]) {
        await page
          .getByLabel(title + " — Street address", { exact: true })
          .fill("100 Main Road");
        await page
          .getByLabel(title + " — City or town", { exact: true })
          .fill("Seattle");
        await page
          .getByLabel(title + " — State or region (optional)", { exact: true })
          .fill("WA");
        await page
          .getByLabel(title + " — Postal code", { exact: true })
          .fill("98101");
      }
      await expect(page.getByLabel("Your online store address")).toHaveCount(0);
      await page.getByRole("button", { name: "Choose your plan →" }).click();
      await page
        .getByRole("combobox", { name: "Business type", exact: true })
        .selectOption({ label: "Retail" });
      await page.getByRole("radio", { name: /Starter/ }).check();
      await page.getByRole("checkbox", { name: /Extra insights/ }).check();
      await page
        .getByRole("button", { name: "Review your selection →" })
        .click();
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
      await page
        .getByLabel("Confirm password")
        .fill("Test-only-long-password!");
      await page.getByRole("button", { name: "Change plan or extras" }).click();
      await page
        .getByRole("button", { name: "Review your selection →" })
        .click();
      await expect(page.getByLabel("Email", { exact: true })).toHaveValue(
        "newowner@example.invalid",
      );
      await expect(page.getByLabel("Password", { exact: true })).toHaveValue(
        "Test-only-long-password!",
      );
      await expect(page.getByLabel("Confirm password")).toHaveValue(
        "Test-only-long-password!",
      );
      gateway.setAutoconfirm(false);
      await page.getByRole("button", { name: "Sign up", exact: true }).click();
      await expect(page.locator(".signup-review [role=alert]")).toContainText(
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
      if (changedPrice) {
        await retailStarter
          .getByRole("button", { name: "Edit Starter", exact: true })
          .click();
        const offeringEditor = staff.locator("form").filter({
          has: staff.getByRole("heading", {
            name: "Edit offering",
            exact: true,
          }),
        });
        await offeringEditor.getByLabel("Price (USD)").fill("49.00");
        await offeringEditor
          .getByRole("button", { name: "Save offering" })
          .click();
        await expect(
          staff.getByRole("status").filter({ hasText: "Changes saved." }),
        ).toBeVisible();
        await page
          .getByRole("button", { name: "Continue →", exact: true })
          .click();
        await expect(page.getByRole("status")).toContainText("latest price");
        await page
          .getByRole("link", { name: "Review your selection", exact: true })
          .click();
        await expect(page).toHaveURL(/\/onboarding\?review=1$/);
        await expect(
          page.getByText("$59.00 / month", { exact: true }),
        ).toBeVisible();
        await expect(
          page.getByText(
            "Please review the current pricing before continuing.",
          ),
        ).toBeVisible();

        await page
          .getByRole("button", { name: "Confirm subscription", exact: true })
          .click();
      } else {
        await page
          .getByRole("button", { name: "Continue →", exact: true })
          .click();
      }
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
      ).toEqual([{ total_cents: changedPrice ? 5900 : 3900 }]);
      await page.goto("/admin");
      await expect(
        page.getByRole("heading", { name: "Talix staff access only." }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Save offering" }),
      ).toHaveCount(0);
      await staff
        .getByRole("button", { name: "Customers", exact: true })
        .click();
      await expect(
        staff.getByText("newowner@example.invalid", { exact: false }),
      ).toBeVisible();
      await expect(
        staff.getByText(changedPrice ? /\$59.00 \/ month/ : /\$39.00 \/ month/),
      ).toBeVisible();
      await staff
        .getByRole("button", { name: "Offerings", exact: true })
        .click();
      await retailStarter
        .getByRole("button", { name: "Edit Starter", exact: true })
        .click();
      await staff
        .locator("form")
        .filter({
          has: staff.getByRole("heading", {
            name: "Edit offering",
            exact: true,
          }),
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
      ).toEqual([{ total_cents: changedPrice ? 5900 : 3900 }]);
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
      ).toEqual([{ total_cents: changedPrice ? 5900 : 3900 }]);
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
      await page.goto(
        "/signup/confirmation?email=someone-else@example.invalid",
      );
      await expect(page).toHaveURL(/\/workspace$/);
      await page.goto(
        "/auth/confirm?token_hash=verification-token&type=email&next=https://example.com",
      );
      await expect(page).toHaveURL(/\/workspace$/);
      await expect(
        page.getByRole("link", { name: "Add subscription", exact: true }),
      ).toBeVisible();
      const fixture = (
        await gateway.db.query<{ sid: string; lid: string }>(
          "select subscription_id as sid,id as lid from public.locations limit 1",
        )
      ).rows[0];
      await gateway.db.query(
        "update public.locations set published=true where id=$1",
        [fixture.lid],
      );
      const product = (
        await gateway.db.query<{ id: string }>(
          "insert into public.products(subscription_id,name,price_cents) values($1,'Notebook',1000) returning id",
          [fixture.sid],
        )
      ).rows[0].id;
      await gateway.db.query(
        "select public.checkout_simulated($1,$2,$3,$4,'approved')",
        [
          fixture.lid,
          crypto.randomUUID(),
          JSON.stringify({
            name: "Ledger Customer",
            email: "ledger@example.invalid",
            phone: "5551234567",
          }),
          JSON.stringify([
            { product_id: product, quantity: 1, option_ids: [] },
          ]),
        ],
      );
      await page.getByRole("button", { name: "Refresh", exact: true }).click();
      await page
        .getByRole("button", { name: /Open order .* for Ledger Customer/ })
        .click();
      const orderDialog = page.getByRole("dialog", { name: "Order details" });
      await expect(
        orderDialog.getByRole("heading", { name: "Ledger Customer" }),
      ).toBeVisible();
      await orderDialog
        .getByRole("button", { name: "Mark in progress", exact: true })
        .click();
      await expect(
        orderDialog.getByRole("button", { name: "Mark ready", exact: true }),
      ).toBeVisible();
      await page.screenshot({
        path: `test-results/order-dialog-${test.info().project.name}.png`,
        fullPage: true,
      });
      await page.keyboard.press("Escape");
      await expect(orderDialog).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: /Open order .* for Ledger Customer/ }),
      ).toBeFocused();
      await page
        .getByRole("navigation", { name: "Workspace shortcuts" })
        .getByRole("button", { name: "Settings", exact: true })
        .click();
      await page.screenshot({
        path: `test-results/settings-${test.info().project.name}.png`,
        fullPage: true,
      });
      await page
        .getByLabel("Search settings", { exact: true })
        .fill("nothing-matches");
      await expect(
        page.getByText("No settings match your search. Try another word."),
      ).toBeVisible();
      await page.getByLabel("Search settings", { exact: true }).fill("logo");
      await page
        .getByRole("button", { name: /Storefront appearance Business logo/ })
        .click();
      const appearance = page.getByRole("region", {
        name: "Storefront appearance",
      });
      await appearance
        .getByLabel("Introduction", { exact: true })
        .fill("A fresh introduction for our customers.");
      await expect(appearance.locator(".store-preview")).toContainText(
        "A fresh introduction for our customers.",
      );
      await appearance
        .getByRole("button", { name: "Cancel changes", exact: true })
        .click();
      await expect(
        appearance.getByLabel("Introduction", { exact: true }),
      ).toHaveValue("");
      await appearance
        .getByLabel("Introduction", { exact: true })
        .fill("A fresh introduction for our customers.");
      await appearance
        .getByRole("button", { name: "Save branding", exact: true })
        .click();
      await expect(appearance.getByRole("status")).toContainText(
        "has been saved",
      );
      expect(
        (await gateway.db.query("select description from public.subscriptions"))
          .rows,
      ).toEqual([{ description: "A fresh introduction for our customers." }]);
      await page.screenshot({
        path: `test-results/appearance-${test.info().project.name}.png`,
        fullPage: true,
      });
      await gateway.addAccount("employee@example.invalid");
      await page
        .getByRole("navigation", { name: "Workspace shortcuts" })
        .getByRole("button", { name: "Users", exact: true })
        .click();
      await expect(
        page.getByRole("table", {
          name: "Configured users",
          includeHidden: true,
        }),
      ).toContainText("Owner");
      await page.getByRole("tab", { name: "Permissions", exact: true }).click();
      await page
        .getByLabel("Role name", { exact: true })
        .fill("Order observer");
      await page.getByRole("tab", { name: "Add user", exact: true }).click();
      await page.getByRole("tab", { name: "Permissions", exact: true }).click();
      await expect(page.getByLabel("Role name", { exact: true })).toHaveValue(
        "Order observer",
      );
      await page.screenshot({
        path: `test-results/users-tabs-${test.info().project.name}.png`,
        fullPage: true,
      });
      await page.getByRole("checkbox", { name: /View orders/ }).check();
      await page
        .getByRole("button", { name: "Save custom role", exact: true })
        .click();
      await expect(
        page.getByRole("status").filter({ hasText: "Changes saved." }),
      ).toBeVisible();
      // Saving again must edit the new role instead of creating a duplicate.
      await page
        .getByRole("button", { name: "Save custom role", exact: true })
        .click();
      await expect(
        page.getByRole("status").filter({ hasText: "Changes saved." }),
      ).toBeVisible();
      expect(
        (
          await gateway.db.query(
            "select id from public.business_roles where name='Order observer'",
          )
        ).rows,
      ).toHaveLength(1);
      await page.getByRole("tab", { name: "Add user", exact: true }).click();
      await page
        .getByLabel("User email", { exact: true })
        .fill("employee@example.invalid");
      await page
        .getByLabel("Subscription role", { exact: true })
        .selectOption({ label: "Viewer" });
      await page
        .getByLabel("Role at Main shop", { exact: true })
        .selectOption({ label: "Order observer" });
      await page
        .getByRole("button", { name: "Save user", exact: true })
        .click();
      await expect(
        page.getByRole("table", {
          name: "Configured users",
          includeHidden: true,
        }),
      ).toContainText("employee@example.invalid");
      await page.getByRole("tab", { name: "Users", exact: true }).click();
      await page
        .getByRole("button", {
          name: "Edit employee@example.invalid",
          exact: true,
        })
        .click();
      await page
        .getByLabel("Role at Main shop", { exact: true })
        .selectOption({ label: "Lead" });
      await page
        .getByRole("button", { name: "Save user", exact: true })
        .click();
      await expect(
        page.getByRole("table", {
          name: "Configured users",
          includeHidden: true,
        }),
      ).toContainText("Lead");
      // A denied removal must retain the selected user and all typed choices.
      const removalEndpoint =
        "http://127.0.0.1:3290/rest/v1/rpc/save_business_user";
      await page.route(removalEndpoint, async (route) => {
        await route.fulfill({
          status: 403,
          contentType: "application/json",
          body: JSON.stringify({ code: "42501", message: "Permission denied" }),
        });
      });
      await page
        .getByRole("button", { name: "Remove user access", exact: true })
        .click();
      await expect(
        page.getByRole("status").filter({ hasText: "We couldn’t save" }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Edit user", exact: true }),
      ).toBeVisible();
      await expect(page.getByLabel("User email", { exact: true })).toHaveValue(
        "employee@example.invalid",
      );
      await expect(
        page.getByLabel("Role at Main shop", { exact: true }),
      ).toHaveValue(
        (await page
          .getByLabel("Role at Main shop", { exact: true })
          .locator("option", { hasText: /^Lead$/ })
          .getAttribute("value")) ?? "",
      );
      await page.unroute(removalEndpoint);
      await page
        .getByRole("button", { name: "Remove user access", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Add a user", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("table", {
          name: "Configured users",
          includeHidden: true,
        }),
      ).not.toContainText("employee@example.invalid");
      if (!changedPrice) {
        const clientBefore = (
          await gateway.db.query("select * from public.clients")
        ).rows;
        await page
          .getByRole("link", { name: "Add subscription", exact: true })
          .click();
        await page
          .getByLabel("Business name", { exact: true })
          .fill("Second business");
        await page.getByLabel("Your full name").fill("Alex Owner");
        await page.getByLabel("Business phone").fill("2065550123");
        await page.getByLabel("First location name").fill("Second location");
        for (const title of ["Billing address", "Location address"]) {
          await page
            .getByLabel(title + " — Street address", { exact: true })
            .fill("100 Main Road");
          await page
            .getByLabel(title + " — City or town", { exact: true })
            .fill("Seattle");
          await page
            .getByLabel(title + " — Postal code", { exact: true })
            .fill("98101");
        }
        await page.getByRole("button", { name: "Choose your plan →" }).click();
        await page
          .getByRole("combobox", { name: "Business type", exact: true })
          .selectOption({ label: "Other business" });
        await page.getByRole("radio", { name: /Starter/ }).check();
        await page
          .getByRole("button", { name: "Review your selection →" })
          .click();
        await expect(page.getByLabel("Password", { exact: true })).toHaveCount(
          0,
        );
        await page
          .getByRole("button", { name: "Confirm subscription", exact: true })
          .click();
        await expect(page).toHaveURL(/\/workspace$/);
        expect(
          (await gateway.db.query("select * from public.clients")).rows,
        ).toEqual(clientBefore);
        expect(
          (
            await gateway.db.query(
              "select business_details->>'business_name' as name from public.subscription_purchases order by created_at",
            )
          ).rows,
        ).toEqual([{ name: "Independent shop" }, { name: "Second business" }]);
        await page
          .getByLabel("Subscription", { exact: true })
          .selectOption({ label: "Second business" });
        await expect(
          page.getByRole("heading", { name: "Second business", exact: true }),
        ).toBeVisible();
      }
      await page.getByRole("button", { name: "Sign out", exact: true }).click();
      await expect(page).toHaveURL(/\/login$/);
      await expect(
        page.getByRole("link", { name: "Business workspace", exact: true }),
      ).toHaveCount(0);
      await page.goto("/workspace");
      await expect(page).toHaveURL(/\/login$/);
      await page.goBack();
      await expect(
        page.getByRole("heading", { name: "Independent shop", exact: true }),
      ).toHaveCount(0);
      await page.goto("/signup");
      await page
        .getByLabel("Business name", { exact: true })
        .fill("Third business");
      await page.getByLabel("Your full name").fill("Alex Owner");
      await page.getByLabel("Business phone").fill("2065550123");
      await page.getByLabel("First location name").fill("Main");
      for (const title of ["Billing address", "Location address"]) {
        await page
          .getByLabel(title + " — Street address", { exact: true })
          .fill("100 Main Road");
        await page
          .getByLabel(title + " — City or town", { exact: true })
          .fill("Seattle");
        await page
          .getByLabel(title + " — Postal code", { exact: true })
          .fill("98101");
      }
      await page.getByRole("button", { name: "Choose your plan →" }).click();
      await page
        .getByRole("combobox", { name: "Business type", exact: true })
        .selectOption({ label: "Retail" });
      await page.getByRole("radio", { name: /Starter/ }).check();
      await page
        .getByRole("button", { name: "Review your selection →" })
        .click();
      await page
        .getByLabel("Email", { exact: true })
        .fill("newowner@example.invalid");
      await page
        .getByLabel("Password", { exact: true })
        .fill("Test-only-long-password!");
      await page
        .getByLabel("Confirm password")
        .fill("Test-only-long-password!");
      await page.getByRole("button", { name: "Sign up", exact: true }).click();
      await expect(page.locator(".signup-review [role=alert]")).toContainText(
        "already registered",
      );
      await expect(
        page.getByRole("link", {
          name: "Sign in to your account",
          exact: true,
        }),
      ).toBeVisible();
      await expect(page.getByLabel("Email", { exact: true })).toHaveValue(
        "newowner@example.invalid",
      );
      await staffContext.close();
    } finally {
      await gateway.close();
    }
  });
