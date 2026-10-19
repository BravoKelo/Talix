"use client";

import { useMemo, useState } from "react";
import { browserClient } from "@/lib/supabase/client";
import type {
  Location,
  Product,
  Subscription,
  WebsitePath,
  WebsiteTemplate,
} from "@/lib/types";
import {
  validExistingWebsite,
  websitePaths,
  websiteReadiness,
  websiteTemplates,
} from "@/lib/website";
import { TaskDialog } from "./order-dialog";
import { WebsiteTemplateHero } from "./website-template-hero";

type WebsiteState = Pick<
  Subscription,
  | "website_path"
  | "website_template"
  | "website_live_template"
  | "existing_website_url"
  | "website_setup_completed_at"
  | "website_template_launched_at"
>;

export function WebsiteSetup({
  subscription,
  locations,
  products,
  onSaved,
  close,
}: {
  subscription: Subscription;
  locations: Location[];
  products: Product[];
  onSaved: (state: WebsiteState) => void;
  close: () => void;
}) {
  const [path, setPath] = useState<WebsitePath>(
    subscription.website_path ?? "deferred",
  );
  const [template, setTemplate] = useState<WebsiteTemplate | null>(
    subscription.website_template ?? null,
  );
  const [existingUrl, setExistingUrl] = useState(
    subscription.existing_website_url ?? "",
  );
  const [device, setDevice] = useState<"mobile" | "tablet" | "desktop">(
    "desktop",
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmLaunch, setConfirmLaunch] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const readiness = useMemo(
    () => websiteReadiness(subscription, locations, products),
    [subscription, locations, products],
  );
  const published = locations.filter((location) => location.published);
  const eligibleProducts = products.filter(
    (product) =>
      product.available &&
      (product.location_id === null ||
        published.some((location) => location.id === product.location_id)),
  );
  const previewSubscription = { ...subscription, website_template: template };

  async function save(markComplete: boolean) {
    if (
      path === "existing" &&
      existingUrl &&
      !validExistingWebsite(existingUrl)
    ) {
      setMessage(
        "Enter a complete HTTPS website address without sign-in details.",
      );
      return;
    }
    if (markComplete && path === "talix_template" && !template) {
      setMessage("Choose a template before finishing setup.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const { data, error } = await browserClient().rpc("save_website_setup", {
        p_subscription: subscription.id,
        p_path: path,
        p_template: template,
        p_existing_url: existingUrl || null,
        p_mark_complete: markComplete,
      });
      if (error) throw error;
      if (!data) throw new Error("The saved website setup was not returned.");
      onSaved(data as WebsiteState);
      setMessage(
        markComplete
          ? "Website choice saved. You can change it later."
          : "Draft saved.",
      );
    } catch (error) {
      setMessage(
        (error as { message?: string })?.message ||
          "We couldn’t save your website setup. Your choices are still here.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function launch() {
    if (!published.length) {
      setMessage("Publish at least one location before launching.");
      return;
    }
    if (!eligibleProducts.length && !confirmLaunch) {
      setConfirmLaunch(true);
      setMessage(
        "Online ordering is not ready. Confirm below if you still want to launch.",
      );
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const { data, error } = await browserClient().rpc(
        "launch_website_template",
        {
          p_subscription: subscription.id,
          p_confirm_empty_catalog: !eligibleProducts.length && confirmLaunch,
        },
      );
      if (error) throw error;
      if (!data) throw new Error("The launch result was not returned.");
      onSaved(data as WebsiteState);
      setConfirmLaunch(false);
      setMessage(
        eligibleProducts.length
          ? "Your Talix template is live."
          : "Live — online ordering not ready.",
      );
    } catch (error) {
      setMessage(
        (error as { message?: string })?.message ||
          "We couldn’t launch your website. Your saved setup is unchanged.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="panel website-setup"
      aria-labelledby="website-setup-title"
    >
      <div className="section-heading">
        <p className="eyebrow">YOUR ONLINE HOME</p>
        <h2 id="website-setup-title">Website & storefront</h2>
        <p className="muted">
          Choose how customers find you online. Your Talix ordering page remains
          available whichever option you choose.
        </p>
      </div>

      <fieldset disabled={busy}>
        <legend>How would you like to start?</legend>
        <div className="website-paths">
          {websitePaths.map((item) => (
            <label key={item.id} className="website-choice">
              <input
                type="radio"
                name="website-path"
                checked={path === item.id}
                onChange={() => {
                  setPath(item.id);
                  setMessage("");
                  setConfirmLaunch(false);
                }}
              />
              <span>
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {path === "existing" && (
        <div className="stack website-option-panel">
          <h3>Connect your existing website</h3>
          <label>
            Your website address
            <input
              type="url"
              inputMode="url"
              maxLength={2048}
              placeholder="https://example.com"
              value={existingUrl}
              onChange={(event) => setExistingUrl(event.target.value)}
              aria-describedby="existing-site-help"
            />
          </label>
          <p id="existing-site-help" className="muted">
            Talix saves this address privately and does not copy, frame, or
            fetch your website. Add an ordinary link from your site to your
            Talix ordering page.
          </p>
          {validExistingWebsite(existingUrl) && (
            <a href={existingUrl} target="_blank" rel="noreferrer">
              Open my website in a new tab
            </a>
          )}
        </div>
      )}

      {path === "talix_template" && (
        <div className="stack website-option-panel">
          <div>
            <h3>Choose a starting point</h3>
            <p className="muted">
              All templates include the same ordering, accessibility, search,
              and mobile foundation. Choose by customer goal, not by industry.
            </p>
          </div>
          <div className="template-choices">
            {websiteTemplates.map((item) => (
              <label key={item.id} className="template-choice">
                <input
                  type="radio"
                  name="website-template"
                  checked={template === item.id}
                  onChange={() => {
                    setTemplate(item.id);
                    setMessage("");
                  }}
                />
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                  <small>Best for: {item.bestFor}.</small>
                </span>
              </label>
            ))}
          </div>
          <div className="notice">
            <strong>Your website address</strong>
            <p>
              Your Talix address is <code>/shop/{subscription.slug}</code>. One
              verified owner-supplied domain is approved for a later phase,
              after its security and operations review. Domain masking is not
              supported.
            </p>
          </div>
          {template && (
            <>
              <div
                className="preview-devices"
                role="group"
                aria-label="Preview size"
              >
                {(["mobile", "tablet", "desktop"] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    className="secondary"
                    aria-pressed={device === size}
                    onClick={() => setDevice(size)}
                  >
                    {size[0].toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
              <div
                className={`website-inline-preview preview-device-${device}`}
              >
                <p className="preview-label">UNSAVED LAYOUT PREVIEW</p>
                <WebsiteTemplateHero
                  subscription={previewSubscription}
                  location={published[0]}
                  products={eligibleProducts}
                  preview
                />
              </div>
              <button
                type="button"
                className="secondary"
                onClick={() => setPreviewOpen(true)}
              >
                Open customer preview
              </button>
            </>
          )}
          <div className="website-launch">
            <strong>
              {subscription.website_live_template
                ? eligibleProducts.length
                  ? "Live"
                  : "Live — online ordering not ready"
                : "Not live"}
            </strong>
            {!published.length && (
              <p>Publish at least one location before launching.</p>
            )}
            {!eligibleProducts.length && published.length > 0 && (
              <label>
                <input
                  type="checkbox"
                  checked={confirmLaunch}
                  onChange={(event) => setConfirmLaunch(event.target.checked)}
                />{" "}
                I understand customers will not be able to order until I publish
                an available product.
              </label>
            )}
            {template !== subscription.website_template && (
              <p>Save this template before launching it.</p>
            )}
            <button
              type="button"
              disabled={
                busy ||
                !template ||
                template !== subscription.website_template ||
                !published.length
              }
              onClick={() => void launch()}
            >
              {busy ? "Working…" : "Launch this template"}
            </button>
          </div>
        </div>
      )}

      {path === "deferred" && (
        <div className="notice website-option-panel">
          <strong>Nothing is lost</strong>
          <p>
            Your current Talix ordering page stays available. Return to Website
            & storefront whenever you are ready.
          </p>
        </div>
      )}

      <section
        className="website-findability"
        aria-labelledby="findability-title"
      >
        <h3 id="findability-title">Help customers find your business</h3>
        <p className="muted">
          Clear, current information helps people and modern search services
          understand your business. Results are never guaranteed.
        </p>
        <ul>
          {readiness.map((item) => (
            <li key={item.label}>
              <span
                className={item.ready ? "status-ready" : "status-attention"}
              >
                {item.ready ? "Ready" : "Needs attention"}
              </span>
              <span>
                <strong>{item.label}</strong>
                <small>{item.action}</small>
              </span>
            </li>
          ))}
          <li>
            <span className="status-checking">Checking</span>
            <span>
              <strong>Search and share preview</strong>
              <small>
                Technical checks run when a template is prepared for release.
              </small>
            </span>
          </li>
        </ul>
      </section>

      <div className="actions">
        <button type="button" disabled={busy} onClick={() => void save(false)}>
          {busy ? "Saving…" : "Save draft"}
        </button>
        <button type="button" disabled={busy} onClick={() => void save(true)}>
          Save choice
        </button>
        <button
          type="button"
          className="secondary"
          disabled={busy}
          onClick={close}
        >
          Back to settings
        </button>
      </div>
      <p role="status" className={message ? "message" : ""}>
        {message}
      </p>

      {previewOpen && template && (
        <TaskDialog
          title={`${websiteTemplates.find((item) => item.id === template)?.title} customer preview`}
          closeLabel="Exit preview"
          close={() => setPreviewOpen(false)}
          className="website-preview-dialog"
          backdropClose
        >
          <WebsiteTemplateHero
            subscription={previewSubscription}
            location={published[0]}
            products={eligibleProducts}
            preview
          />
          <p className="muted">
            Ordering is disabled in preview. Nothing here changes your live
            website.
          </p>
        </TaskDialog>
      )}
    </section>
  );
}
