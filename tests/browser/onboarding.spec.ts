import { expect, test } from "@playwright/test";
test.use({ actionTimeout: 10000 });
import { onboardingGateway } from "../helpers/onboarding-gateway";
for (const changedPrice of [false, true])
  test(`signup → confirmation → ${changedPrice ? "changed price review" : "direct completion"} → workspace`, async ({
    page,
    browser,
  }) => {
    test.setTimeout(180000);
    const criticalEngine = ["firefox-critical", "webkit-critical"].includes(
      test.info().project.name,
    );
    const gateway = await onboardingGateway(
      changedPrice
        ? [
            "20261018043256_storefront_header_layout.sql",
            "20261018174618_storefront_header_navigation.sql",
            "20261019183000_website_owner_onboarding.sql",
            "20261020224059_separate_website_hero_image.sql",
            "20261021011154_editable_standard_navigation.sql",
            "20261022032702_storefront_only_publication.sql",
          ]
        : [],
    );
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
      const fit = await page.evaluate(() => ({
        width: window.innerWidth,
        pageWidth: document.documentElement.scrollWidth,
        overflowing: [...document.querySelectorAll("body *")]
          .filter(
            (el) => el.getBoundingClientRect().right > window.innerWidth + 1,
          )
          .slice(0, 12)
          .map((el) => ({
            tag: el.tagName,
            class: el.className,
            right: el.getBoundingClientRect().right,
            text: el.textContent?.slice(0, 70),
          })),
      }));
      expect(fit.pageWidth, JSON.stringify(fit)).toBeLessThanOrEqual(fit.width);
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
      await page.getByLabel("Your full name").fill("Alex123");
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
      const errorSummary = page.getByRole("alert").filter({
        hasText: "Please check these details",
      });
      await expect(errorSummary).toBeFocused();
      const contactName = page.getByLabel("Your full name");
      await expect(contactName).toHaveAttribute("aria-invalid", "true");
      await expect(contactName).toHaveAttribute(
        "aria-describedby",
        "contact_name-error",
      );
      await errorSummary.getByRole("button").first().click();
      await expect(contactName).toBeFocused();
      await contactName.fill("Alex Owner");
      await page.getByRole("button", { name: "Choose your plan →" }).click();
      await expect(
        page.getByRole("heading", { name: "Choose what works for you." }),
      ).toBeFocused();
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
      if (!criticalEngine) {
        await page
          .getByRole("button", { name: "Change plan or extras" })
          .click();
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
      }
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
      await expect(page).toHaveURL(/\/workspace\?website=setup$/);
      await expect(
        page.getByRole("heading", { name: "Build your website" }),
      ).toBeVisible();
      if (!changedPrice) {
        await gateway.db.query(
          "update public.locations set published=true where subscription_id=(select id from public.subscriptions limit 1)",
        );
        await page.reload();
        await expect(
          page.getByRole("heading", { name: "Build your website" }),
        ).toBeVisible();
        await expect(
          page.getByRole("button", { name: "Template & appearance" }),
        ).toHaveCount(0);
        await expect(
          page.getByRole("button", { name: "Save for later" }),
        ).toBeVisible();
        await page
          .getByRole("radio", { name: /Use my existing website/ })
          .check();
        await expect(
          page.getByRole("button", { name: "Template & appearance" }),
        ).toHaveCount(0);
        await page.getByRole("button", { name: "Save and continue" }).click();
        await expect(
          page.getByRole("heading", { name: "Existing website" }),
        ).toBeFocused();
        await page
          .getByLabel("Existing website address")
          .fill("example.com/business");
        await page.getByRole("button", { name: "Save and continue" }).click();
        await expect(
          page.getByRole("heading", { name: "Review connection" }),
        ).toBeFocused();
        await page
          .getByRole("button", { name: "Save website connection" })
          .click();
        await expect(page.getByRole("status")).toContainText(
          "Existing website saved",
        );
        await page.getByRole("button", { name: "Website setup" }).click();
        await page.getByRole("radio", { name: /Decide later/ }).check();
        await page.getByRole("button", { name: "Save for later" }).click();
        await expect(page.getByRole("status")).toContainText(
          "No website was published",
        );
        await expect(page.getByRole("status")).toBeFocused();
        await expect(
          page
            .getByRole("navigation", { name: "Workspace shortcuts" })
            .getByRole("link", { name: "Open storefront ↗", exact: true }),
        ).toHaveAttribute("href", /\/shop\//);
        await page.getByRole("radio", { name: /Use a Talix template/ }).check();
        await page.getByRole("button", { name: "Save and continue" }).click();
        await expect(
          page.getByRole("heading", { name: "Business identity" }),
        ).toBeFocused();
        await expect(page.getByText("CUSTOMER PREVIEW")).toHaveCount(0);
        await page.screenshot({
          path: `test-results/website-identity-${test.info().project.name}.png`,
          fullPage: true,
        });
        await expect(
          page.getByRole("button", {
            name: "Edit Website Branding",
            exact: true,
          }),
        ).toBeVisible();
        await expect(
          page.getByRole("button", {
            name: "Edit Website Branding",
            exact: true,
          }),
        ).toHaveCSS("background-color", "rgb(232, 185, 79)");
        await expect(
          page.getByText("Optional — using business initial", { exact: true }),
        ).toBeVisible();
        await expect(
          page.getByText("Optional — using business name", { exact: true }),
        ).toBeVisible();
        await expect(
          page.getByText("Optional — no hero image added", { exact: true }),
        ).toBeVisible();
        await expect(page.locator(".website-brand-color > span")).toHaveCSS(
          "background-color",
          "rgb(37, 99, 235)",
        );
        await page
          .getByRole("button", { name: "Web address", exact: false })
          .click();
        await expect(
          page.getByText("FUTURE OPTION", { exact: true }),
        ).toHaveCount(0);
        await expect(
          page.getByText(/Custom domains are not available yet/),
        ).toBeVisible();
        expect(
          (
            await gateway.db.query<{ default_location_id: string | null }>(
              "select default_location_id from public.subscriptions",
            )
          ).rows[0].default_location_id,
        ).not.toBeNull();
        await page
          .getByRole("button", { name: "Template & appearance" })
          .click();
        await page.getByRole("radio", { name: /Order First/ }).check();
        await page.getByRole("button", { name: "Go live" }).click();
        await expect(
          page.getByRole("button", { name: "Open customer preview" }),
        ).toHaveCount(0);
        const preview = page.getByRole("region", {
          name: "Your website preview",
        });
        await expect(preview.getByText("Preview — not live")).toBeVisible();
        await expect(
          preview.getByRole("heading", { name: "Products", exact: true }),
        ).toBeVisible();
        await expect(
          preview.getByRole("navigation", { name: "Navigation preview" }),
        ).toBeVisible();
        for (const device of ["Mobile", "Tablet", "Desktop"]) {
          await preview
            .getByRole("button", { name: device, exact: true })
            .click();
          await expect(
            preview.getByRole("button", { name: device, exact: true }),
          ).toHaveAttribute("aria-pressed", "true");
        }
        await page.screenshot({
          path: `test-results/website-review-${test.info().project.name}.png`,
          fullPage: true,
        });
        const previewRegion = page.getByRole("region", {
          name: "Scrollable website preview",
        });
        const originalViewport = page.viewportSize() ?? {
          width: 1280,
          height: 720,
        };
        for (const viewport of [
          originalViewport,
          { width: 768, height: 1000 },
        ]) {
          await page.setViewportSize(viewport);
          await page.evaluate(
            () =>
              new Promise<void>((resolve) => {
                requestAnimationFrame(() =>
                  requestAnimationFrame(() => resolve()),
                );
              }),
          );
          // Header overflow links are recomputed by ResizeObserver after resize.
          await expect
            .poll(
              () =>
                previewRegion.evaluate(
                  (element) => element.scrollWidth - element.clientWidth,
                ),
              { message: `Preview overflow at ${viewport.width}px` },
            )
            .toBeLessThanOrEqual(0);
          expect(
            await page
              .locator(".website-onboarding")
              .evaluate(
                (element) => element.scrollWidth <= element.clientWidth,
              ),
          ).toBe(true);
          for (const selector of [
            ".website-step-content",
            ".website-step-body",
            ".website-review-preview",
            ".website-step-actions button",
          ]) {
            expect(
              await page.locator(selector).evaluateAll((elements) =>
                elements.every((element) => {
                  const box = element.getBoundingClientRect();
                  return box.left >= 0 && box.right <= window.innerWidth;
                }),
              ),
            ).toBe(true);
          }
          expect(
            await previewRegion
              .locator(".website-template-action")
              .evaluateAll((elements) =>
                elements.every((element) => {
                  const box = element.getBoundingClientRect();
                  const frame = element
                    .closest(".website-inline-preview")!
                    .getBoundingClientRect();
                  return box.left >= frame.left && box.right <= frame.right;
                }),
              ),
          ).toBe(true);
        }
        await page.setViewportSize(originalViewport);
        await page.getByRole("button", { name: "Save draft" }).click();
        await expect(page.getByRole("status")).toContainText("Draft saved");
        await expect(
          page
            .getByRole("navigation", { name: "Workspace shortcuts" })
            .getByRole("link", { name: "Open storefront ↗", exact: true }),
        ).toBeVisible();
        await expect(
          page.getByRole("button", { name: "Make website live" }),
        ).toBeDisabled();
        await page
          .getByRole("checkbox", { name: /Launch without online ordering/ })
          .check();
        await page
          .context()
          .route("**/rest/v1/rpc/launch_website_template", (route) =>
            route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({ website_live_template: "order_first" }),
            }),
          );
        await page.getByRole("button", { name: "Make website live" }).click();
        await expect(page.getByRole("status")).toContainText(
          "Publication could not be confirmed",
        );
        await expect(
          page.getByRole("status").getByRole("link", { name: "Open website" }),
        ).toHaveCount(0);
        await page.context().unroute("**/rest/v1/rpc/launch_website_template");
        await page.getByRole("button", { name: "Make website live" }).click();
        await expect(page.getByRole("status")).toContainText(
          "Website published successfully, Independent shop has been published at",
        );
        await expect(page.getByRole("status")).toBeFocused();
        const publication = (
          await gateway.db.query<{ website_template_launched_at: string }>(
            "select website_template_launched_at from public.subscriptions",
          )
        ).rows[0];
        const publishedTime = await page.evaluate(
          (value) => new Date(value).toLocaleString(),
          publication.website_template_launched_at,
        );
        await expect(page.getByRole("status")).toContainText(publishedTime);
        await expect(
          page
            .getByRole("status")
            .getByRole("link", { name: "Open website", exact: true }),
        ).toHaveAttribute("href", /\/shop\//);
        await expect(
          page
            .getByRole("status")
            .getByRole("link", { name: "Open website", exact: true }),
        ).toHaveCSS("background-color", "rgb(232, 185, 79)");
        await expect(
          page
            .getByRole("link", { name: "Open website ↗", exact: true })
            .first(),
        ).toBeVisible();
        await page
          .getByRole("button", { name: "Website setup", exact: false })
          .click();
        await page.getByRole("radio", { name: /Decide later/ }).check();
        await page.getByRole("button", { name: "Save to continue" }).click();
        await expect(
          page.getByRole("heading", { name: "Switch to storefront-only mode" }),
        ).toBeVisible();
        expect(
          (
            await gateway.db.query<{ website_live_template: string }>(
              "select website_live_template from public.subscriptions",
            )
          ).rows[0].website_live_template,
        ).toBe("order_first");
        await expect(
          page.getByRole("link", { name: "Open website ↗", exact: true }),
        ).toBeVisible();
        await page.screenshot({
          path: `test-results/website-deferred-${test.info().project.name}.png`,
          fullPage: true,
        });
        await page
          .context()
          .route("**/rest/v1/rpc/publish_storefront_only", (route) =>
            route.fulfill({
              status: 403,
              contentType: "application/json",
              body: JSON.stringify({ message: "Owner access required." }),
            }),
          );
        await page
          .getByRole("button", { name: "Publish storefront-only mode" })
          .click();
        await expect(page.getByRole("status")).toContainText(
          "Owner access required",
        );
        await expect(page.getByRole("status")).not.toHaveClass(/success/);
        await page.context().unroute("**/rest/v1/rpc/publish_storefront_only");
        // Simulate a lost response after the database has committed; retry must
        // acknowledge the existing result without hiding a newer publication.
        await page
          .context()
          .route("**/rest/v1/rpc/publish_storefront_only", async (route) => {
            await fetch(route.request().url(), {
              method: "POST",
              headers: route.request().headers(),
              body: route.request().postData(),
            });
            await route.fulfill({
              status: 503,
              json: { message: "Publication response lost. Retry safely." },
            });
          });
        await page
          .getByRole("button", { name: "Publish storefront-only mode" })
          .click();
        await expect(page.getByRole("status")).toContainText(
          "Publication response lost",
        );
        await expect(page.getByRole("status")).not.toHaveClass(/success/);
        await page.context().unroute("**/rest/v1/rpc/publish_storefront_only");
        await page
          .getByRole("button", { name: "Publish storefront-only mode" })
          .click();
        await expect(page.getByRole("status")).toContainText(
          "Your existing website has been hidden, Talix is now in storefront only mode",
        );
        await expect(page.getByRole("status")).toBeFocused();
        await expect(
          page
            .getByRole("navigation", { name: "Workspace shortcuts" })
            .getByRole("link", { name: "Open storefront ↗", exact: true }),
        ).toBeVisible();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        ).toBe(true);
        await page
          .getByRole("button", { name: "Website setup", exact: false })
          .click();
        await page.getByRole("radio", { name: /Use a Talix template/ }).check();
        await page.getByRole("button", { name: "Save draft" }).click();
        await expect(page.getByRole("status")).toContainText("Draft saved");
        await page.route(
          "https://images.example.invalid/identity.png",
          (route) =>
            route.fulfill({
              contentType: "image/svg+xml",
              body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="navy"/></svg>',
            }),
        );
        await gateway.db.query(
          "update public.subscriptions set logo_url='https://images.example.invalid/identity.png',header_photo_url='https://images.example.invalid/identity.png',website_hero_url='https://images.example.invalid/identity.png',header_identity='photo'",
        );
        await page.reload();
        await page.getByRole("button", { name: "Business identity" }).click();
        await expect(page.getByText("✓ Added", { exact: true })).toHaveCount(2);
        await expect(
          page.getByText("✓ Added — displayed in header", { exact: true }),
        ).toBeVisible();
        await page
          .getByRole("button", { name: "Edit Website Branding", exact: true })
          .click();
        await expect(
          page.getByRole("button", { name: "Save branding", exact: true }),
        ).toBeVisible();
        // Restore the empty-asset fixture used by the existing appearance tests below.
        await gateway.db.query(
          "update public.subscriptions set logo_url=null,header_photo_url=null,website_hero_url=null,header_identity='name'",
        );
        await page.reload();
      }
      await expect(
        page
          .locator(".workspace-heading")
          .getByRole("heading", { name: "Independent shop", exact: true }),
      ).toBeVisible();
      if (criticalEngine) {
        await staffContext.close();
        return;
      }
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
        staff
          .locator(".subscription-summary")
          .getByText(changedPrice ? /\$59.00 \/ month/ : /\$39.00 \/ month/),
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
      expect(
        await page.locator(".order-ledger-table th").allTextContents(),
      ).toEqual([
        "Order number",
        "Date / time",
        "Customer",
        "Fulfillment",
        "Payment",
        "Total",
      ]);
      await expect(
        page.getByRole("button", {
          name: "Open order 100001 for Ledger Customer",
          exact: true,
        }),
      ).toBeVisible();
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
      await expect(
        orderDialog.getByText("Order 100001", { exact: true }),
      ).toBeVisible();
      await orderDialog.getByText("Cancel order", { exact: true }).click();
      await expect(
        orderDialog.getByText(/Payment is unchanged; record a separate refund/),
      ).toBeVisible();
      await orderDialog
        .getByRole("button", { name: "Confirm cancellation", exact: true })
        .click();
      await expect(
        orderDialog.getByText(/Order cancelled. Payment is unchanged/),
      ).toBeVisible();
      expect(
        (
          await gateway.db.query(
            "select status,payment_status,refunded_cents from public.orders",
          )
        ).rows,
      ).toEqual([
        { status: "cancelled", payment_status: "paid", refunded_cents: 0 },
      ]);
      await page.keyboard.press("Escape");
      await expect(orderDialog).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: /Open order .* for Ledger Customer/ }),
      ).toBeFocused();
      await expect(page.getByText("Saved.", { exact: true })).toHaveCount(0);
      await expect(page.locator("body > footer")).toBeHidden();
      await gateway.db.query(
        "insert into public.products(subscription_id,name,description,price_cents) values($1,'Longer product name to compare uniform tiles','A much longer description with enough words to take several lines without changing the size of the tile or moving its actions.',2000)",
        [fixture.sid],
      );
      await page.route("https://images.example.invalid/**", async (route) => {
        if (route.request().url().endsWith("missing.png")) return route.abort();
        await route.fulfill({
          contentType: "image/png",
          body: Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
            "base64",
          ),
        });
      });
      await gateway.db.query(
        "update public.products set image_url='https://images.example.invalid/notebook.png' where name='Notebook'",
      );
      await gateway.db.query(
        "update public.products set image_url='https://images.example.invalid/missing.png' where name like 'Longer product%'",
      );
      await page.reload();
      await page
        .getByRole("navigation", { name: "Workspace shortcuts" })
        .getByRole("button", { name: "Products", exact: true })
        .click();
      const tile = page
        .locator(".product-tile")
        .filter({ hasText: "Notebook" });
      await expect(tile).toBeVisible();
      await tile.scrollIntoViewIfNeeded();
      await expect(
        tile.getByRole("img", { name: "Notebook", exact: true }),
      ).toBeVisible();
      await expect
        .poll(() =>
          tile
            .locator("img")
            .evaluate(
              (image: HTMLImageElement) =>
                image.complete && image.naturalWidth > 0,
            ),
        )
        .toBe(true);
      await expect(
        page.getByRole("img", {
          name: /No image available for Longer product/,
        }),
      ).toBeVisible();
      const bounds = await tile.boundingBox();
      expect(bounds!.width).toBeLessThanOrEqual(
        test.info().project.name === "desktop" ? 342 : 390,
      );
      const sizes = await page.locator(".product-tile").evaluateAll((tiles) =>
        tiles.map((tile) => ({
          width: tile.getBoundingClientRect().width,
          height: tile.getBoundingClientRect().height,
        })),
      );
      expect(new Set(sizes.map((x) => x.width)).size).toBe(1);
      expect(new Set(sizes.map((x) => x.height)).size).toBe(1);
      const png = {
        name: "test.png",
        mimeType: "image/png",
        buffer: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
          "base64",
        ),
      };
      await page
        .getByRole("button", { name: "Add product", exact: true })
        .click();
      const adding = page.getByRole("dialog", {
        name: "Add product",
        exact: true,
      });
      await expect(adding.locator(".image-picker-name")).toHaveText(
        "No file chosen",
      );
      await adding
        .getByLabel("Name", { exact: true })
        .fill("Discarded product");
      await adding
        .getByLabel("Product image", { exact: true })
        .setInputFiles(png);
      await expect(page.locator(".image-picker-name:visible")).toHaveText(
        "test.png",
      );
      await adding
        .getByRole("button", { name: "Cancel", exact: true })
        .last()
        .click();
      await expect(adding).toHaveCount(0);
      expect(gateway.imageUploads).toBe(0);
      await expect(page.locator(".product-tile")).toHaveCount(2);
      await tile
        .getByRole("button", { name: "Edit Notebook", exact: true })
        .click();
      const editing = page.getByRole("dialog", {
        name: "Edit product",
        exact: true,
      });
      await editing
        .getByLabel("Name", { exact: true })
        .fill("Unsaved notebook");
      await editing
        .getByRole("button", { name: "Cancel", exact: true })
        .last()
        .click();
      await expect(editing).toHaveCount(0);
      await expect(
        tile.getByRole("heading", { name: "Notebook", exact: true }),
      ).toBeVisible();
      await page.screenshot({
        path: `test-results/products-uniform-${test.info().project.name}.png`,
        fullPage: true,
      });
      await page
        .getByRole("button", { name: "Add product", exact: true })
        .click();
      await adding
        .getByLabel("Name", { exact: true })
        .fill("Disposable product");
      await adding.getByLabel("Price (USD)").fill("5.00");
      await adding
        .getByLabel("Product image", { exact: true })
        .setInputFiles(png);
      await expect(page.locator(".image-picker-name:visible")).toHaveText(
        "test.png",
      );
      await adding
        .getByRole("button", { name: "Save product", exact: true })
        .click();
      await expect(adding).toHaveCount(0);
      expect(gateway.imageUploads).toBe(1);
      const disposable = page
        .locator(".product-tile")
        .filter({ hasText: "Disposable product" });
      await disposable
        .getByRole("button", { name: "Edit Disposable product", exact: true })
        .click();
      await expect(editing.locator(".image-picker-name")).toHaveText(
        "test.png",
      );
      await editing
        .getByRole("button", { name: "Delete image", exact: true })
        .click();
      await editing
        .getByRole("button", { name: "Cancel", exact: true })
        .last()
        .click();
      expect(
        (
          await gateway.db.query<{ image_url: string | null }>(
            "select image_url from public.products where name='Disposable product'",
          )
        ).rows[0].image_url,
      ).toBeTruthy();
      await disposable
        .getByRole("button", { name: "Edit Disposable product", exact: true })
        .click();
      await editing
        .getByRole("button", { name: "Delete image", exact: true })
        .click();
      const storageDelete =
        "http://127.0.0.1:3290/storage/v1/object/product-images";
      await page.route(storageDelete, async (route) => {
        if (route.request().method() === "DELETE")
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({
              message: "Temporary image deletion failure",
            }),
          });
        else await route.fallback();
      });
      await editing
        .getByRole("button", { name: "Save product", exact: true })
        .click();
      await expect(editing).toHaveCount(0);
      await expect(
        page.getByRole("region", { name: "Image deletion needs attention" }),
      ).toBeVisible();
      await page.unroute(storageDelete);
      await page
        .getByRole("button", { name: "Retry image deletion", exact: true })
        .click();
      await expect(
        page.getByRole("region", { name: "Image deletion needs attention" }),
      ).toHaveCount(0);
      expect(
        (
          await gateway.db.query(
            "select * from storage.objects where bucket_id='product-images'",
          )
        ).rows,
      ).toHaveLength(0);
      await disposable
        .getByRole("button", { name: "Edit Disposable product", exact: true })
        .click();
      await editing
        .getByRole("button", { name: "Delete product", exact: true })
        .click();
      await editing
        .getByRole("button", { name: "Cancel deletion", exact: true })
        .click();
      await expect(editing.getByLabel("Name", { exact: true })).toHaveValue(
        "Disposable product",
      );
      await editing
        .getByRole("button", { name: "Delete product", exact: true })
        .click();
      await editing
        .getByRole("button", { name: "Delete product", exact: true })
        .click();
      await expect(editing).toHaveCount(0);
      await expect(disposable).toHaveCount(0);
      await expect(page.getByText("Saved.", { exact: true })).toHaveCount(0);
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
      await page
        .getByLabel("Search settings", { exact: true })
        .fill(changedPrice ? "logo" : "website");
      async function openWebsiteAppearance() {
        if (changedPrice) {
          await page
            .getByRole("button", {
              name: /Storefront appearance Business logo/,
            })
            .click();
        } else {
          await page
            .getByRole("button", { name: /Website Appearance/ })
            .click();
          await page
            .getByRole("button", { name: "Template & appearance" })
            .click();
          await page
            .getByRole("button", { name: "Open appearance editor" })
            .click();
        }
      }
      await openWebsiteAppearance();
      const appearance = page.getByRole("region", {
        name: changedPrice ? "Storefront appearance" : "Website appearance",
      });
      if (test.info().project.name === "mobile")
        await appearance
          .getByRole("button", { name: "Open storefront preview", exact: true })
          .click();
      const logoFilename = appearance
        .locator(".image-picker")
        .filter({
          has: page.getByRole("button", {
            name: "Choose business logo",
            exact: true,
          }),
        })
        .locator(".image-picker-name");
      await appearance
        .getByLabel("Introduction", { exact: true })
        .fill("A fresh introduction for our customers.");
      const previousViewport = page.viewportSize()!;
      for (const viewport of [
        { width: 820, height: 1180 },
        { width: 1180, height: 820 },
      ]) {
        await page.setViewportSize(viewport);
        await page.evaluate(() => window.scrollTo(0, 650));
        await expect(page.locator(".workspace")).toHaveClass(
          /workspace-compact/,
        );
        const headerBounds = await page
          .locator(".workspace-header")
          .boundingBox();
        expect(headerBounds!.height).toBeLessThanOrEqual(80);
        const tabsBounds = await appearance.getByRole("tablist").boundingBox();
        expect(tabsBounds!.y).toBeGreaterThanOrEqual(headerBounds!.height - 1);
        expect(tabsBounds!.y).toBeLessThan(viewport.height);
        await appearance
          .getByRole("tab", { name: "Style", exact: true })
          .click();
        await appearance
          .getByRole("tab", { name: "Branding", exact: true })
          .click();
        await expect(
          appearance.getByRole("textbox", {
            name: "Introduction",
            exact: true,
          }),
        ).toHaveValue("A fresh introduction for our customers.");
        await page.screenshot({
          path: `test-results/settings-scroll-${viewport.width}-${test.info().project.name}.png`,
        });
        await page
          .getByRole("link", { name: "Back to top", exact: true })
          .click();
        await expect
          .poll(() => page.evaluate(() => window.scrollY))
          .toBeLessThan(4);
      }
      await page.setViewportSize(previousViewport);

      await appearance.getByRole("tab", { name: "Style", exact: true }).click();
      await appearance
        .getByLabel("Font family", { exact: true })
        .selectOption("serif");
      await appearance
        .getByRole("tab", { name: "Products", exact: true })
        .click();
      await appearance
        .getByLabel("Tile corners", { exact: true })
        .selectOption("round");
      await appearance
        .getByLabel("Tile spacing", { exact: true })
        .selectOption("compact");
      await expect(appearance.locator(".appearance-live-preview")).toHaveCSS(
        "font-family",
        "Georgia, serif",
      );

      await expect(appearance.locator(".store-preview")).toContainText(
        "A fresh introduction for our customers.",
      );
      await appearance
        .getByRole("button", { name: "Cancel changes", exact: true })
        .click();
      await expect(appearance).toBeHidden();
      await openWebsiteAppearance();
      await expect(
        appearance.getByLabel("Introduction", { exact: true }),
      ).toHaveValue("");
      await appearance
        .getByLabel("Introduction", { exact: true })
        .fill("A fresh introduction for our customers.");

      await appearance.getByRole("tab", { name: "Style", exact: true }).click();
      await appearance
        .getByLabel("Font family", { exact: true })
        .selectOption("serif");
      await appearance
        .getByRole("tab", { name: "Products", exact: true })
        .click();
      await appearance
        .getByLabel("Tile corners", { exact: true })
        .selectOption("round");
      await appearance
        .getByLabel("Tile spacing", { exact: true })
        .selectOption("compact");
      await expect(appearance.locator(".appearance-live-preview")).toHaveCSS(
        "font-family",
        "Georgia, serif",
      );

      await appearance
        .getByRole("button", { name: "Save branding", exact: true })
        .click();
      await expect(appearance.getByRole("status")).toContainText(
        "has been saved",
      );
      await appearance
        .getByRole("tab", { name: "Branding", exact: true })
        .click();
      await expect(logoFilename).toHaveText("No file chosen");
      expect(
        (
          await gateway.db.query(
            "select storefront_font,tile_corners,tile_spacing from public.subscriptions",
          )
        ).rows,
      ).toEqual([
        {
          storefront_font: "serif",
          tile_corners: "round",
          tile_spacing: "compact",
        },
      ]);
      expect(
        (await gateway.db.query("select description from public.subscriptions"))
          .rows,
      ).toEqual([{ description: "A fresh introduction for our customers." }]);
      await page.screenshot({
        path: `test-results/appearance-${test.info().project.name}.png`,
        fullPage: true,
      });
      await appearance
        .getByLabel("Business logo", { exact: true })
        .setInputFiles(png);
      await expect(logoFilename).toHaveText("test.png");
      await appearance
        .getByRole("button", { name: "Cancel changes", exact: true })
        .click();
      await expect(appearance).toBeHidden();
      expect(gateway.imageUploads).toBe(1);
      await openWebsiteAppearance();
      await appearance
        .getByLabel("Business logo", { exact: true })
        .setInputFiles(png);
      await expect(logoFilename).toHaveText("test.png");
      await appearance
        .getByRole("button", { name: "Save branding", exact: true })
        .click();
      await expect(appearance.getByRole("status")).toContainText(
        "has been saved",
      );
      await expect(logoFilename).toHaveText("test.png");
      expect(
        (
          await gateway.db.query(
            "select * from storage.objects where bucket_id='business-logos'",
          )
        ).rows,
      ).toHaveLength(1);
      await appearance
        .getByRole("button", { name: "Delete image", exact: true })
        .click();
      await appearance
        .getByRole("button", { name: "Cancel changes", exact: true })
        .click();
      await expect(appearance).toBeHidden();
      expect(
        (
          await gateway.db.query<{ logo_url: string | null }>(
            "select logo_url from public.subscriptions",
          )
        ).rows[0].logo_url,
      ).toBeTruthy();
      await openWebsiteAppearance();
      await appearance
        .getByRole("button", { name: "Delete image", exact: true })
        .click();
      await appearance
        .getByRole("button", { name: "Save branding", exact: true })
        .click();
      await expect(appearance.getByRole("status")).toContainText(
        "has been saved",
      );
      await appearance
        .getByRole("tab", { name: "Branding", exact: true })
        .click();
      await expect(logoFilename).toHaveText("No file chosen");
      expect(
        (
          await gateway.db.query(
            "select * from storage.objects where bucket_id='business-logos'",
          )
        ).rows,
      ).toHaveLength(0);
      await appearance
        .getByRole("tab", { name: "Header", exact: true })
        .click();
      if (changedPrice) {
        await expect(
          appearance.getByRole("radio", { name: /Custom header/ }),
        ).toBeDisabled();
        await expect(
          appearance.getByText(
            /Standard and custom navigation saving is awaiting activation/,
          ),
        ).toBeVisible();
      } else {
        await appearance.getByRole("radio", { name: /Custom header/ }).check();
        await appearance
          .getByRole("button", { name: "Add navigation link", exact: true })
          .click();
        await appearance
          .getByRole("textbox", { name: "Link label", exact: true })
          .fill("Our website");
        await appearance
          .getByRole("combobox", { name: "Destination", exact: true })
          .selectOption("website");
        await appearance
          .getByLabel("HTTPS website address", { exact: true })
          .fill("https://example.com/about");
        await appearance
          .getByRole("button", { name: "Add navigation link", exact: true })
          .click();
        await appearance
          .getByRole("textbox", { name: "Link label", exact: true })
          .fill("Order online");
        await expect(
          appearance.getByRole("textbox", { name: "Link label", exact: true }),
        ).toHaveCount(1);
        await appearance
          .getByRole("button", { name: "Move Order online up", exact: true })
          .click();
        await appearance
          .getByRole("radio", { name: /Standard header/ })
          .check();
        await expect(
          appearance.getByRole("button", {
            name: "Add navigation link",
            exact: true,
          }),
        ).toBeHidden();
        await appearance.getByRole("radio", { name: /Custom header/ }).check();
        await expect(
          appearance.getByRole("button", {
            name: "Our website https://example.com/about",
            exact: true,
          }),
        ).toBeVisible();
        await appearance
          .getByRole("radio", { name: "Search-focused", exact: true })
          .check();
        await expect(
          appearance.locator(".appearance-live-preview"),
        ).toHaveClass(/header-search/);
      }
      await page.screenshot({
        path: `test-results/header-settings-${changedPrice ? "legacy" : "active"}-${test.info().project.name}.png`,
        fullPage: true,
      });
      await appearance
        .getByLabel("Header identity", { exact: true })
        .selectOption("photo");
      await appearance
        .getByRole("tab", { name: "Branding", exact: true })
        .click();
      await appearance
        .getByLabel("Header photo", { exact: true })
        .setInputFiles(png);
      await expect(
        appearance.locator(".shop-centered-identity img"),
      ).toBeVisible();
      await appearance
        .getByRole("button", { name: "Save branding", exact: true })
        .click();
      await expect(appearance.getByRole("status")).toContainText(
        "has been saved",
      );
      expect(
        (
          await gateway.db.query<{ header_photo_url: string | null }>(
            "select header_photo_url from public.subscriptions",
          )
        ).rows[0].header_photo_url,
      ).toBeTruthy();
      await appearance
        .getByRole("button", { name: "Delete header photo", exact: true })
        .click();
      await appearance
        .getByRole("button", { name: "Save branding", exact: true })
        .click();
      await expect(appearance.getByRole("status")).toContainText(
        "has been saved",
      );
      expect(
        (
          await gateway.db.query(
            "select * from storage.objects where bucket_id='business-logos'",
          )
        ).rows,
      ).toHaveLength(0);
      if (!changedPrice) {
        const savedNavigation = (
          await gateway.db.query<{
            header_mode: string;
            header_links: unknown[];
          }>("select header_mode,header_links from public.subscriptions")
        ).rows[0];
        expect(savedNavigation).toEqual({
          header_mode: "custom",
          header_links: [
            { label: "Order online", destination: "shop", url: "" },
            {
              label: "Our website",
              destination: "website",
              url: "https://example.com/about",
            },
          ],
        });
        await appearance
          .getByRole("tab", { name: "Header", exact: true })
          .click();
        await appearance
          .getByRole("button", {
            name: "Our website https://example.com/about",
            exact: true,
          })
          .click();
        await appearance
          .getByRole("textbox", { name: "HTTPS website address", exact: true })
          .fill("javascript:alert(1)");
        await appearance
          .getByRole("radio", { name: /Standard header/ })
          .check();
        await appearance
          .getByRole("button", { name: "Save branding", exact: true })
          .click();
        await expect(appearance.getByRole("status")).toContainText(
          "custom navigation link is unfinished",
        );
        expect(
          (
            await gateway.db.query<{ header_mode: string }>(
              "select header_mode from public.subscriptions",
            )
          ).rows[0].header_mode,
        ).toBe("custom");
        await appearance
          .getByRole("button", { name: "Cancel changes", exact: true })
          .click();
        await expect(appearance).toBeHidden();
        await openWebsiteAppearance();
        await appearance
          .getByRole("tab", { name: "Header", exact: true })
          .click();
        await expect(
          appearance.getByRole("radio", { name: /Custom header/ }),
        ).toBeChecked();
        await expect(
          appearance.getByRole("button", {
            name: "Our website https://example.com/about",
            exact: true,
          }),
        ).toBeVisible();
        const orderLink = appearance.getByRole("button", {
          name: "Order online Shop",
          exact: true,
        });
        if ((await orderLink.getAttribute("aria-expanded")) !== "true")
          await orderLink.click();
        await appearance
          .getByRole("textbox", { name: "Link label", exact: true })
          .fill("Unsaved label");
        await appearance
          .getByRole("button", { name: "Cancel changes", exact: true })
          .click();
        await openWebsiteAppearance();
        await appearance
          .getByRole("tab", { name: "Header", exact: true })
          .click();
        await expect(
          appearance.getByRole("button", {
            name: "Order online Shop",
            exact: true,
          }),
        ).toBeVisible();
        await appearance
          .getByRole("radio", { name: /Standard header/ })
          .check();
        await appearance
          .getByRole("button", { name: "Save branding", exact: true })
          .click();
        await expect(appearance.getByRole("status")).toContainText(
          "has been saved",
        );
        expect(
          (
            await gateway.db.query<{ header_links: unknown[] }>(
              "select header_links from public.subscriptions",
            )
          ).rows[0].header_links,
        ).toEqual(savedNavigation.header_links);
      }
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
        await expect(page).toHaveURL(/\/workspace\?website=setup$/);
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
        const subscriptionPicker = page.getByLabel("Subscription", {
          exact: true,
        });
        await expect(
          page.getByRole("heading", { name: "Build your website" }),
        ).toBeVisible();
        if (!(await subscriptionPicker.isVisible())) {
          const headerToggle = page.getByRole("button", {
            name: "Business & account",
          });
          await headerToggle.focus();
          await headerToggle.press("Space");
        }
        await expect(subscriptionPicker).toBeVisible();
        await subscriptionPicker.selectOption({ label: "Second business" });
        await expect(
          page.getByRole("heading", { name: "Second business", exact: true }),
        ).toBeVisible();
      }
      await page.goto("/");
      await expect(page.getByText("Signed in", { exact: true })).toBeVisible();
      await expect(
        page.getByRole("link", { name: "View Your Workspace", exact: true }),
      ).toHaveCount(2);
      await page.reload();
      await expect(page.getByText("Signed in", { exact: true })).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `test-results/returning-user-${test.info().project.name}.png`,
      });
      const returning = await page.context().newPage();
      await returning.goto("/");
      await expect(
        returning.getByText("Signed in", { exact: true }),
      ).toBeVisible();
      await returning.close();
      const expiredContext = await browser.newContext({
        storageState: await page.context().storageState(),
      });
      await connect(expiredContext);
      const signedInUser = [...gateway.users.values()].find(
        (user) => user.email === "newowner@example.invalid",
      )!;
      gateway.users.delete(signedInUser.id);
      try {
        const expired = await expiredContext.newPage();
        await expired.goto("/");
        await expect(
          expired.getByText("Signed in", { exact: true }),
        ).toHaveCount(0);
        await expect(
          expired.getByRole("link", {
            name: "View Your Workspace",
            exact: true,
          }),
        ).toHaveCount(0);
        await expect(
          expired.getByRole("link", { name: "Sign in", exact: true }),
        ).toHaveCount(3);
      } finally {
        gateway.users.set(signedInUser.id, signedInUser);
        await expiredContext.close();
      }
      await page.getByRole("button", { name: "Sign out", exact: true }).click();
      await expect(page).toHaveURL(/\/$/);
      await expect(
        page.getByRole("link", { name: "Sign in", exact: true }),
      ).toHaveCount(3);
      await page.goto("/login");
      await expect(page).toHaveURL(/\/login$/);
      await expect(
        page.getByRole("link", { name: "View Your Workspace", exact: true }),
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
