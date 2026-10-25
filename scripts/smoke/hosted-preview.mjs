import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { chromium, expect } from "@playwright/test";
import {
  developmentHost,
  navigationFailure,
  requireCheck,
  SmokeFailure,
  validateCdp,
  validateFixture,
  validateTarget,
  verifyCatalog,
  verifyMembership,
  unchangedSave,
} from "./preview-contract.mjs";

const steps = [];
const retainedOrders = [];
let target,
  browser,
  context,
  owner,
  customer,
  connected = false,
  active = "deployment-build";
let fixture,
  completed = false,
  publicKey,
  originalColor,
  appearance,
  colorSaved = false,
  subscriptionSnapshot,
  pendingOrderRequest;
const runtimeErrors = { application: 0, provider: 0 };
const apiHosts = new Set();
const record = (step, detail = {}) =>
  steps.push({ step, result: "passed", ...detail });
async function jsonFile(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    throw new SmokeFailure(active, "missing-or-invalid-input-record");
  }
}
async function navigate(page, path, appAuth = false) {
  const response = await page.goto(target.origin + path, {
    waitUntil: "domcontentloaded",
    timeout: 20_000,
  });
  const category = navigationFailure(
    target.origin,
    page.url(),
    response?.status(),
    appAuth,
  );
  if (category)
    steps.push({
      step: "navigation-observation",
      httpStatus: response?.status() ?? null,
      destination:
        new URL(page.url()).origin === target.origin
          ? "same-deployment"
          : "external-sign-in-or-redirect",
      classification: category,
    });
  if (category)
    throw new SmokeFailure(
      category,
      appAuth && category === "application-auth"
        ? "fixture-owner-session-required"
        : "navigation-preflight-failed",
    );
  requireCheck(
    (await page
      .getByRole("heading", {
        name: /^(Authentication Required|Log in to Vercel)$/,
      })
      .count()) === 0,
    "vercel-protection",
    "protection-page",
  );
  return response;
}
async function newPage() {
  const page = await context.newPage();
  page.setDefaultTimeout(10_000);
  page.on("pageerror", (e) => {
    runtimeErrors[
      e.stack?.includes("vercel.live") ? "provider" : "application"
    ]++;
  });
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (u.hostname.endsWith(".supabase.co")) apiHosts.add(u.hostname);
  });
  return page;
}
async function servicePreflight(page) {
  let source = "";
  const scripts = await page
    .locator("script[src]")
    .evaluateAll((ns) =>
      ns.map((n) => n.src).filter((s) => new URL(s).origin === location.origin),
    );
  requireCheck(
    scripts.length > 0 && scripts.length < 40,
    "app-runtime",
    "missing-application-scripts",
  );
  for (const src of scripts) {
    const response = await context.request.get(src, {
      timeout: 15_000,
      maxRedirects: 0,
    });
    requireCheck(
      response.status() === 200,
      "vercel-protection",
      "script-access-failed",
    );
    source += await response.text();
  }
  const hosts = [...new Set(source.match(/[a-z0-9]+\.supabase\.co/g) ?? [])];
  requireCheck(
    hosts.length === 1 &&
      hosts[0] === developmentHost &&
      !/sb_secret_[A-Za-z0-9_-]{20,}/.test(source),
    "app-runtime",
    "development-service-identity-mismatch",
  );
  publicKey = source.match(/sb_publishable_[A-Za-z0-9_-]+/)?.[0];
  requireCheck(
    !!publicKey,
    "app-runtime",
    "missing-development-publishable-configuration",
  );
  const settings = await context.request.get(
    `https://${developmentHost}/auth/v1/settings`,
    { headers: { apikey: publicKey }, timeout: 15_000, maxRedirects: 0 },
  );
  requireCheck(
    settings.status() === 200,
    "application-auth",
    "development-public-auth-settings-unavailable",
  );
  record("served-development-only-configuration");
}
async function ownerSession() {
  active = "application-auth";
  // The SSR route performs real getUser. No password, cookie, token or storage-state copying.
  const membership = owner.waitForResponse(
    (r) =>
      new URL(r.url()).hostname === developmentHost &&
      new URL(r.url()).pathname === "/rest/v1/memberships",
  );
  const subscriptions = owner.waitForResponse(
    (r) =>
      new URL(r.url()).hostname === developmentHost &&
      new URL(r.url()).pathname === "/rest/v1/subscriptions" &&
      r.request().method() === "GET",
  );
  // Attach a rejection handler immediately when navigation can fail first.
  void membership.catch(() => {});
  void subscriptions.catch(() => {});
  await navigate(owner, "/workspace", true);
  await expect(owner.locator(".workspace-heading")).toBeVisible();
  const response = await membership;
  requireCheck(response.ok(), "application-auth", "membership-read-failed");
  verifyMembership(fixture, response.url(), await response.json());
  subscriptionSnapshot = (await (await subscriptions).json()).find(
    (s) => s.id === fixture.subscriptionId,
  );
  requireCheck(
    subscriptionSnapshot?.name === fixture.name,
    "fixture-cleanup",
    "private-fixture-name-mismatch",
  );
  await owner
    .getByLabel("Subscription", { exact: true })
    .selectOption(fixture.subscriptionId);
  await owner
    .getByLabel("Location", { exact: true })
    .selectOption(fixture.locationId);
  await expect(
    owner
      .locator(".workspace-heading")
      .getByRole("heading", { name: fixture.name, exact: true }),
  ).toBeVisible();
  await owner.reload();
  await expect(owner.locator(".workspace-heading")).toBeVisible();
  record("real-fixture-owner-session-and-reload");
}
async function customerView() {
  active = "app-runtime";
  const catalogResponse = await context.request.post(
    `https://${developmentHost}/rest/v1/rpc/public_catalog`,
    {
      headers: { apikey: publicKey },
      data: { p_slug: fixture.slug },
      timeout: 15_000,
      maxRedirects: 0,
    },
  );
  requireCheck(
    catalogResponse.ok(),
    "app-runtime",
    "real-public-catalog-request-failed",
  );
  verifyCatalog(fixture, await catalogResponse.json());
  customer = await newPage();
  await navigate(customer, `/shop/${fixture.slug}#shop-products`);
  await customer
    .getByLabel("Choose a location", { exact: true })
    .selectOption(fixture.locationId);
  await expect(
    customer.getByRole("button", {
      name: `View ${fixture.productName}`,
      exact: true,
    }),
  ).toBeVisible();
  for (const width of [1280, 768, 390]) {
    await customer.setViewportSize({ width, height: 900 });
    requireCheck(
      await customer.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "app-runtime",
      "customer-horizontal-overflow",
    );
  }
  record("real-public-catalog-and-customer-view", {
    widths: [1280, 768, 390],
    browserContext:
      "existing-operator-context; anonymous-session-isolation-not-claimed",
  });
}
async function previewFlow() {
  await navigate(owner, "/workspace?website=setup", true);
  await owner
    .getByLabel("Subscription", { exact: true })
    .selectOption(fixture.subscriptionId);
  await owner.getByRole("button", { name: "Go live", exact: true }).click();
  const preview = owner.getByRole("region", { name: "Your website preview" });
  const frame = preview.frameLocator('iframe[title="Private website preview"]');
  await expect(frame.getByText("Preview — not live")).toBeVisible();
  for (const hostWidth of [1280, 768, 390, 320]) {
    await owner.setViewportSize({ width: hostWidth, height: 900 });
    for (const [mode, width] of [
      ["Desktop", 1120],
      ["Tablet", 768],
      ["Mobile", 390],
    ]) {
      await preview
        .getByRole("button", { name: mode, exact: true })
        .press("Enter");
      await expect
        .poll(() => frame.locator("body").evaluate(() => innerWidth))
        .toBe(width);
      requireCheck(
        await preview.locator("iframe").evaluate((el) => {
          const b = el.getBoundingClientRect(),
            p = el.parentElement.getBoundingClientRect();
          return (
            Math.abs(b.width / el.clientWidth - b.height / el.clientHeight) <
              0.001 && b.right <= p.right + 1
          );
        }),
        "app-runtime",
        "preview-proportions-or-bounds",
      );
    }
  }
  await owner.setViewportSize({ width: 1280, height: 900 });
  await preview.getByRole("button", { name: "Mobile", exact: true }).click();
  await expect
    .poll(() => frame.locator("body").evaluate(() => innerWidth))
    .toBe(390);
  await preview.locator(".website-preview-viewport").scrollIntoViewIfNeeded();
  await frame
    .getByRole("region", { name: "Scrollable website preview" })
    .focus();
  await preview.locator(".website-preview-viewport").hover();
  const overflow = await frame
    .locator("body")
    .evaluate(() => document.documentElement.scrollHeight > innerHeight);
  for (let i = 0; overflow && i < 8; i++) {
    await owner.mouse.wheel(0, 600);
    await owner.waitForTimeout(150);
  }
  if (overflow)
    requireCheck(
      await frame.locator("body").evaluate(() => scrollY > 0),
      "app-runtime",
      "native-preview-scroll-failed",
    );
  await expect(frame.locator(".website-template-footer")).toBeInViewport();
  requireCheck(
    (await frame
      .getByRole("button", { name: /Add to cart|checkout/i })
      .count()) === 0,
    "app-runtime",
    "private-preview-can-order",
  );
  await preview.getByRole("button", { name: "Desktop", exact: true }).click();
  await expect
    .poll(() => frame.locator("body").evaluate(() => innerWidth))
    .toBe(1120);
  const presentation = (el) => ({
    columns: getComputedStyle(el).gridTemplateColumns,
    size: getComputedStyle(el.querySelector("h2")).fontSize,
  });
  const draft = await frame
    .locator(".website-template-hero")
    .evaluate(presentation);
  await customer.setViewportSize({ width: 1120, height: 900 });
  await navigate(customer, `/shop/${fixture.slug}`);
  expect(
    await customer.locator(".website-template-hero").evaluate(presentation),
  ).toEqual(draft);
  record("live-preview-modes-native-scroll-and-published-comparison");
}
async function contrastFlow() {
  requireCheck(
    fixture.allowUnchangedSave === true,
    "fixture-cleanup",
    "unchanged-save-not-approved-in-manifest",
  );
  await navigate(owner, "/workspace?website=setup", true);
  await owner
    .getByLabel("Subscription", { exact: true })
    .selectOption(fixture.subscriptionId);
  await owner
    .getByRole("button", { name: "Template & appearance", exact: true })
    .click();
  await owner
    .getByRole("button", { name: "Open appearance editor", exact: true })
    .click();
  appearance = owner.getByRole("region", {
    name: "Website appearance",
    exact: true,
  });
  await appearance.getByRole("tab", { name: "Style", exact: true }).click();
  const field = appearance.getByLabel("Product text", { exact: true });
  originalColor = await field.inputValue();
  requireCheck(
    subscriptionSnapshot.storefront_text === originalColor,
    "fixture-cleanup",
    "stale-appearance-baseline",
  );
  let deniedWrite = false;
  await owner.route(
    `https://${developmentHost}/rest/v1/subscriptions*`,
    async (route) => {
      const r = route.request();
      if (
        r.method() === "PATCH" &&
        !unchangedSave(fixture, subscriptionSnapshot, r.url(), r.postDataJSON())
      ) {
        deniedWrite = true;
        await route.abort();
        return;
      }
      await route.continue();
    },
  );
  requireCheck(
    (await field.getAttribute("aria-invalid")) === "false",
    "fixture-cleanup",
    "fixture-needs-readable-baseline",
  );
  await field.fill("#ffffff");
  await expect(field).toHaveAttribute("aria-invalid", "true");
  await expect(field).toHaveAccessibleDescription(/1\.00:1.*at least 4\.5:1/);
  await appearance.getByRole("tab", { name: "Branding", exact: true }).click();
  await appearance
    .getByRole("button", { name: "Save branding", exact: true })
    .click();
  await expect(field).toBeFocused();
  requireCheck(
    !deniedWrite,
    "app-runtime",
    "invalid-color-save-attempted-write; blocked-before-commit",
  );
  await appearance
    .getByRole("button", { name: "Use readable default", exact: true })
    .press("Enter");
  await expect(field).toHaveAttribute("aria-invalid", "false");
  // Explicitly save the baseline, never a new persisted brand color.
  await field.fill(originalColor);
  const saved = owner.waitForResponse(
    (r) =>
      new URL(r.url()).hostname === developmentHost &&
      r.request().method() === "PATCH" &&
      new URL(r.url()).pathname === "/rest/v1/subscriptions",
  );
  void saved.catch(() => {});
  await appearance
    .getByRole("button", { name: "Save branding", exact: true })
    .click();
  const savedResponse = await saved;
  const savedRows = await savedResponse.json();
  requireCheck(
    savedResponse.ok() &&
      Array.isArray(savedRows) &&
      savedRows.some(
        (r) =>
          r.id === fixture.subscriptionId &&
          r.storefront_text === originalColor,
      ),
    "fixture-cleanup",
    "unchanged-save-not-authoritatively-confirmed",
  );
  await expect(appearance.getByRole("status")).toContainText("has been saved");
  colorSaved = true;
  await appearance
    .getByRole("button", { name: "Cancel changes", exact: true })
    .click();
  record("real-owner-unchanged-save-and-contrast-draft-recovery");
}
async function navigationFlow() {
  for (const width of [1280, 768, 390]) {
    await customer.setViewportSize({ width, height: 900 });
    await navigate(customer, `/shop/${fixture.slug}#shop-products`);
    await customer.mouse.wheel(0, 600);
    const menu = customer.getByRole("button", {
      name: /Open navigation menu|More navigation links/,
    });
    for (const name of ["About", "Contact"]) {
      let opener = customer
        .getByRole("navigation", { name: "Business navigation", exact: true })
        .getByRole("button", { name, exact: true });
      if (!(await opener.isVisible())) {
        opener = menu;
        await menu.press("Enter");
        await customer
          .getByRole("dialog", { name: "Menu", exact: true })
          .getByRole("button", { name, exact: true })
          .press("Enter");
      } else await opener.press("Enter");
      const dialog = customer.getByRole("dialog", { name, exact: true });
      await expect(dialog.locator(".dialog-toolbar strong")).toBeFocused();
      for (const key of ["Tab", "Tab", "Shift+Tab", "Shift+Tab"]) {
        await customer.keyboard.press(key);
        requireCheck(
          await dialog.evaluate((el) => el.contains(document.activeElement)),
          "app-runtime",
          "navigation-focus-escaped",
        );
      }
      await customer.keyboard.press("Escape");
      await expect(opener).toBeFocused();
    }
  }
  record("live-navigation-keyboard-containment-and-return", {
    widths: [1280, 768, 390],
  });
}
async function trackingFlow() {
  requireCheck(
    fixture.allowSimulatedOrder === true,
    "fixture-cleanup",
    "simulated-order-not-approved-in-manifest",
  );
  await navigate(customer, `/shop/${fixture.slug}#shop-products`);
  await customer
    .getByLabel("Choose a location", { exact: true })
    .selectOption(fixture.locationId);
  await customer
    .getByRole("button", { name: `View ${fixture.productName}`, exact: true })
    .click();
  await customer.getByRole("button", { name: /^Add to cart/ }).click();
  await customer
    .getByRole("button", { name: "Your cart (1)", exact: true })
    .click();
  await customer
    .getByRole("button", { name: "Go to checkout", exact: true })
    .click();
  const customerName = `Smoke 105 ${fixture.runId}`;
  await customer.getByLabel("Your name", { exact: true }).fill(customerName);
  await customer
    .getByLabel("Email", { exact: true })
    .fill("smoke-105@example.invalid");
  await customer.getByLabel("Phone", { exact: true }).fill("5551234567");
  await customer.getByLabel("Test outcome").selectOption("approved");
  const tracked = customer.waitForResponse(
    (r) =>
      new URL(r.url()).hostname === developmentHost &&
      new URL(r.url()).pathname === "/rest/v1/rpc/track_order",
  );
  void tracked.catch(() => {});
  customer.on("request", (r) => {
    if (
      new URL(r.url()).hostname === developmentHost &&
      new URL(r.url()).pathname === "/rest/v1/rpc/checkout_simulated"
    )
      pendingOrderRequest = r.postDataJSON()?.p_request;
  });
  await customer
    .getByRole("button", {
      name: "Place order with simulated payment",
      exact: true,
    })
    .click();
  const response = await tracked;
  const data = await response.json();
  requireCheck(
    response.ok() && /^[0-9a-f-]{36}$/.test(data?.id ?? ""),
    "app-runtime",
    "tracking-result-missing",
  );
  retainedOrders.push(data.id);
  await expect(customer.locator('[aria-current="step"]')).toContainText(
    "received",
  );
  await expect(
    customer.getByRole("status").filter({ hasText: "Current status:" }),
  ).toContainText("Current status: received.");
  const privatePath = new URL(customer.url()).pathname; // Memory only; never report the bearer link.
  await navigate(owner, "/workspace", true);
  await owner
    .getByLabel("Subscription", { exact: true })
    .selectOption(fixture.subscriptionId);
  await owner
    .getByLabel("Location", { exact: true })
    .selectOption(fixture.locationId);
  await owner
    .getByRole("button", {
      name: `Open order ${data.order_number} for ${customerName}`,
      exact: true,
    })
    .click();
  for (const [button, state] of [
    ["Mark in progress", "in_progress"],
    ["Mark ready", "ready"],
    ["Mark completed", "completed"],
  ]) {
    await owner.getByRole("button", { name: button, exact: true }).click();
    await expect
      .poll(
        async () => {
          await navigate(customer, privatePath);
          return await customer.locator('[aria-current="step"]').textContent();
        },
        { intervals: [1000], timeout: 10_000 },
      )
      .toContain(state.replaceAll("_", " "));
  }
  record("real-simulated-checkout-and-tracking-transitions");
}
try {
  const { values } = parseArgs({
    options: {
      target: { type: "string" },
      sha: { type: "string" },
      fixture: { type: "string" },
      cdp: { type: "string" },
      flow: { type: "string", default: "preview" },
      preflight: { type: "boolean", default: false },
      help: { type: "boolean" },
    },
  });
  if (values.help) {
    console.log(
      "npm run smoke:preview -- --target <fresh-record.json> --sha <exact-PR-head> [--preflight] [--cdp <existing-loopback-browser-endpoint>] [--fixture <manifest.json> --flow preview|contrast|navigation|tracking]",
    );
  } else {
    target = validateTarget(await jsonFile(values.target), values.sha);
    requireCheck(
      ["preview", "contrast", "navigation", "tracking"].includes(values.flow),
      "deployment-build",
      "unknown-flow",
    );
    record("fresh-ready-preview-and-pr-record-match");
    active = "vercel-protection";
    if (values.cdp) {
      browser = await chromium.connectOverCDP(validateCdp(values.cdp), {
        timeout: 10_000,
      });
      connected = true;
      requireCheck(
        browser.contexts().length === 1,
        active,
        "operator-browser-context-ambiguous",
      );
      context = browser.contexts()[0];
    } else {
      browser = await chromium.launch({ headless: true });
      context = await browser.newContext({
        viewport: { width: 1280, height: 900 },
      });
    }
    owner = await newPage();
    await owner.setViewportSize({ width: 1280, height: 900 });
    record("browser-started", {
      name: "chromium",
      version: browser.version(),
      viewport: { width: 1280, height: 900 },
    });
    await navigate(owner, "/");
    record("vercel-access-preflight", {
      browser: browser.version(),
      mode: connected
        ? "existing-authorized-operator-browser"
        : "fresh-browser-no-credentials",
    });
    active = "app-runtime";
    await servicePreflight(owner);
    if (values.preflight) {
      active = "application-auth";
      await navigate(owner, "/workspace", true);
      await expect(owner.locator(".workspace-heading")).toBeVisible();
      record("real-app-session-preflight; fixture-owner-not-yet-verified");
    } else {
      active = "fixture-cleanup";
      fixture = validateFixture(await jsonFile(values.fixture));
      await ownerSession();
      await customerView();
      await {
        preview: previewFlow,
        contrast: contrastFlow,
        navigation: navigationFlow,
        tracking: trackingFlow,
      }[values.flow]();
      requireCheck(
        runtimeErrors.application === 0 &&
          [...apiHosts].every((h) => h === developmentHost),
        "app-runtime",
        "application-error-or-unexpected-service-host",
      );
      completed = true;
    }
  }
} catch (e) {
  // External messages/stacks can include auth headers, selectors, contact data or private URLs.
  steps.push({
    step: active,
    result: "blocked-or-failed",
    category: e instanceof SmokeFailure ? e.category : active,
    code:
      e instanceof SmokeFailure
        ? e.code
        : "operation-failed-see-private-browser-state",
  });
  process.exitCode = 2;
} finally {
  if (appearance && !colorSaved) {
    try {
      await appearance
        .getByRole("button", { name: "Cancel changes", exact: true })
        .click();
      record("unsaved-appearance-draft-discarded");
    } catch {
      steps.push({
        step: "fixture-cleanup",
        result: "unverified",
        code: "appearance-draft-discard-unverified",
      });
      process.exitCode = 3;
    }
  }
  if (retainedOrders.length || pendingOrderRequest) {
    steps.push({
      step: "fixture-cleanup",
      result: retainedOrders.length ? "retained" : "commit-unconfirmed",
      orderIds: retainedOrders,
      requestId: pendingOrderRequest,
      code: "simulated-history-requires-authorized-fixture-cleanup; no-privileged-delete-attempted",
    });
    process.exitCode = 3;
  }
  await customer?.close().catch(() => {});
  await owner?.close().catch(() => {});
  // Disconnect from CDP without closing the operator's browser or altering its credentials.
  if (!connected) await browser?.close().catch(() => {});
  console.log(
    JSON.stringify(
      {
        target: target ?? null,
        completed,
        steps,
        runtimeErrors,
        fixture: fixture
          ? {
              subscriptionId: fixture.subscriptionId,
              ownerId: fixture.ownerId,
              state: "pre-existing-disposable-fixture-retained",
            }
          : "not-opened-or-created",
        limits: [
          "No screenshots, traces, videos or Playwright report persisted",
          "No real assistive technology or physical-device claim",
          "Existing operator context; anonymous customer session not established",
        ],
      },
      null,
      2,
    ),
  );
}
// Terminating this client releases its CDP socket, without sending Browser.close.
if (connected)
  await new Promise((resolve) => process.stdout.write("", resolve)).then(() =>
    process.exit(process.exitCode ?? 0),
  );
