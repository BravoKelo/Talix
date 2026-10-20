"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { browserClient } from "@/lib/supabase/client";
import { confirmedMutation } from "@/lib/persistence";
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
  websiteProductsForLocation,
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
  | "default_location_id"
>;

const setupSteps = [
  "Website setup",
  "Business identity",
  "Locations & ordering",
  "Template & appearance",
  "Web address",
  "Go live",
] as const;

export function WebsiteSetup({
  subscription,
  locations,
  products,
  onSaved,
  close,
  openAppearance,
}: {
  subscription: Subscription;
  locations: Location[];
  products: Product[];
  onSaved: (state: WebsiteState) => void;
  close: () => void;
  openAppearance: () => void;
}) {
  const [step, setStep] = useState(0);
  const [path, setPath] = useState<WebsitePath>(
    subscription.website_path ?? "deferred",
  );
  const [template, setTemplate] = useState<WebsiteTemplate | null>(
    subscription.website_template ?? null,
  );
  const [liveTemplate, setLiveTemplate] = useState<WebsiteTemplate | null>(
    subscription.website_live_template ?? null,
  );
  const [existingUrl, setExistingUrl] = useState(
    subscription.existing_website_url ?? "",
  );
  const published = useMemo(
    () => locations.filter((location) => location.published),
    [locations],
  );
  const [locationId, setLocationId] = useState(
    subscription.default_location_id ?? published[0]?.id ?? "",
  );
  const [savedLocationId, setSavedLocationId] = useState(
    subscription.default_location_id ?? "",
  );
  const [device, setDevice] = useState<"mobile" | "tablet" | "desktop">(
    "desktop",
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmLaunch, setConfirmLaunch] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const previewTrigger = useRef<HTMLButtonElement>(null);
  const initialStep = useRef(true);
  const selectedLocation =
    published.find((location) => location.id === locationId) ?? published[0];
  const eligibleProducts = useMemo(
    () => websiteProductsForLocation(products, selectedLocation?.id),
    [products, selectedLocation?.id],
  );
  const readiness = useMemo(
    () =>
      websiteReadiness(
        subscription,
        selectedLocation ? [selectedLocation] : [],
        eligibleProducts,
      ),
    [subscription, selectedLocation, eligibleProducts],
  );
  const previewSubscription = { ...subscription, website_template: template };
  const readyCount = readiness.filter((item) => item.ready).length;

  useEffect(() => {
    if (initialStep.current) {
      initialStep.current = false;
      return;
    }
    stepHeading.current?.focus();
  }, [step]);

  async function save(markComplete: boolean) {
    if (
      path === "existing" &&
      (markComplete || existingUrl) &&
      !validExistingWebsite(existingUrl)
    ) {
      setMessage(
        "Enter a complete HTTPS website address without sign-in details.",
      );
      return false;
    }
    if (path === "talix_template" && markComplete && !template) {
      setMessage("Choose a template before continuing.");
      return false;
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
      let persistedLocationId = savedLocationId;
      if (
        path === "talix_template" &&
        selectedLocation &&
        selectedLocation.id !== savedLocationId
      ) {
        const locationData = confirmedMutation<{
          default_location_id: string | null;
        }>(
          await browserClient()
            .from("subscriptions")
            .update({ default_location_id: selectedLocation.id })
            .eq("id", subscription.id)
            .select("default_location_id")
            .single(),
          "The featured location was not saved. Your access may have changed.",
        );
        persistedLocationId = locationData.default_location_id ?? "";
        setSavedLocationId(persistedLocationId);
      }
      const saved = data as WebsiteState;
      setLiveTemplate(saved.website_live_template ?? null);
      onSaved({ ...saved, default_location_id: persistedLocationId || null });
      setMessage(markComplete ? "Website setup saved." : "Draft saved.");
      return true;
    } catch (error) {
      setMessage(
        (error as { message?: string })?.message ||
          "We couldn’t save your website setup. Your choices are still here.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function continueFromStep() {
    if (step === 3 && path === "talix_template" && !template) {
      setMessage("Choose a template before continuing.");
      return;
    }
    const needsSave = step === 0 || step === 2 || step === 3 || step === 4;
    if (needsSave && !(await save(step === 4))) return;
    setStep((current) => Math.min(current + 1, setupSteps.length - 1));
  }

  async function editAppearance() {
    if (await save(false)) openAppearance();
  }

  function closePreview() {
    setPreviewOpen(false);
    window.requestAnimationFrame(() => previewTrigger.current?.focus());
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
    if (!(await save(true))) return;
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
      const saved = data as WebsiteState;
      setLiveTemplate(saved.website_live_template ?? null);
      onSaved({
        ...saved,
        default_location_id: selectedLocation?.id ?? (savedLocationId || null),
      });
      setConfirmLaunch(false);
      setMessage(
        eligibleProducts.length
          ? "Your Talix website is live."
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
      className="website-onboarding"
      aria-labelledby="website-setup-title"
    >
      <aside className="website-step-sidebar">
        <div>
          <p className="eyebrow">WEBSITE APPEARANCE</p>
          <h2 id="website-setup-title">Build your website</h2>
          <p>Set up the customer experience connected to your business.</p>
        </div>
        <nav aria-label="Website setup progress">
          <ol>
            {setupSteps.map((label, index) => (
              <li key={label}>
                <button
                  type="button"
                  className={index === step ? "active" : ""}
                  aria-current={index === step ? "step" : undefined}
                  onClick={() => {
                    setStep(index);
                    setMessage("");
                  }}
                >
                  <span>{index + 1}</span>
                  {label}
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <button type="button" className="secondary" onClick={close}>
          Exit setup
        </button>
      </aside>

      <div className="website-step-content">
        <header className="website-step-header">
          <p className="eyebrow">
            STEP {step + 1} OF {setupSteps.length}
          </p>
          <h2 ref={stepHeading} tabIndex={-1}>
            {setupSteps[step]}
          </h2>
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            Step {step + 1} of {setupSteps.length}: {setupSteps[step]}
          </p>
        </header>

        {step === 0 && (
          <div className="website-step-body">
            <div className="website-intro">
              <h3>How would you like customers to find you online?</h3>
              <p>
                Choose a starting point. Your Talix ordering page remains
                available with every option, and you can change this later.
              </p>
            </div>
            <fieldset disabled={busy}>
              <legend className="sr-only">Choose a website path</legend>
              <div className="website-paths">
                {websitePaths.map((item, index) => (
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
                    <span className="website-choice-number">0{index + 1}</span>
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.description}</small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="website-callout">
              <strong>Your choice is flexible</strong>
              <p>
                Start with the best fit today. Nothing publishes until you
                review the final Go live step.
              </p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="website-step-body">
            <div className="website-intro">
              <h3>Review the identity customers will see</h3>
              <p>
                These details come from Storefront appearance, so your business
                stays consistent across Talix.
              </p>
            </div>
            <div className="website-identity-grid">
              <section className="website-summary-card">
                <span className="website-card-label">BUSINESS DETAILS</span>
                <h4>{subscription.name}</h4>
                <p>
                  {subscription.description ||
                    "Add an introduction so customers understand what your business offers."}
                </p>
                <dl>
                  <div>
                    <dt>Logo</dt>
                    <dd>{subscription.logo_url ? "Added" : "Not added"}</dd>
                  </div>
                  <div>
                    <dt>Hero image</dt>
                    <dd>
                      {subscription.header_photo_url ? "Added" : "Not added"}
                    </dd>
                  </div>
                  <div>
                    <dt>Brand color</dt>
                    <dd>{subscription.accent.toUpperCase()}</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  className="secondary"
                  disabled={busy}
                  onClick={() => void editAppearance()}
                >
                  Edit business appearance
                </button>
              </section>
              <section className="website-identity-preview">
                <span className="website-card-label">CUSTOMER PREVIEW</span>
                <div
                  className="website-brand-swatch"
                  style={{ backgroundColor: subscription.accent }}
                />
                <h3>{subscription.name}</h3>
                <p>
                  {subscription.description ||
                    "Your introduction appears here."}
                </p>
                <span className="button">Browse products</span>
              </section>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="website-step-body">
            <div className="website-intro">
              <h3>Choose the location featured on your website</h3>
              <p>
                Customers will see its current address, hours, and ordering
                availability. Only published locations can be featured.
              </p>
            </div>
            {published.length ? (
              <div className="website-location-grid">
                <fieldset className="website-location-list">
                  <legend>Published locations</legend>
                  {published.map((location) => (
                    <label key={location.id}>
                      <input
                        type="radio"
                        name="website-location"
                        checked={selectedLocation?.id === location.id}
                        onChange={() => setLocationId(location.id)}
                      />
                      <span>
                        <strong>{location.name}</strong>
                        <small>{location.address}</small>
                        <small>{location.hours}</small>
                      </span>
                    </label>
                  ))}
                </fieldset>
                <section className="website-readiness-card">
                  <span className="status-ready">Published</span>
                  <h4>{selectedLocation?.name}</h4>
                  <p>{selectedLocation?.address}</p>
                  <p>{selectedLocation?.hours}</p>
                  <strong>
                    {eligibleProducts.length} available{" "}
                    {eligibleProducts.length === 1 ? "product" : "products"}
                  </strong>
                </section>
              </div>
            ) : (
              <div className="website-callout warning">
                <strong>A published location is required</strong>
                <p>
                  Finish and publish a location in Locations & ordering before
                  launching a Talix website.
                </p>
              </div>
            )}
            <p className="muted">
              This becomes the default location on the live website when you
              save. Manage its details in Locations & ordering.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="website-step-body">
            {path === "talix_template" ? (
              <>
                <div className="website-intro">
                  <h3>Choose the structure that fits your customers</h3>
                  <p>
                    Every template uses the same mobile-friendly ordering,
                    accessibility, and modern search foundation.
                  </p>
                </div>
                <fieldset>
                  <legend className="sr-only">Choose a website template</legend>
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
                        <span
                          className={`template-thumbnail template-${item.id}`}
                        >
                          <i />
                          <i />
                          <i />
                        </span>
                        <span>
                          <strong>{item.title}</strong>
                          <small>{item.description}</small>
                          <small>Best for: {item.bestFor}.</small>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="website-appearance-link">
                  <div>
                    <strong>Make it feel like your business</strong>
                    <p>
                      Adjust branding, the header, product presentation, and
                      style in the existing appearance editor.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="secondary"
                    disabled={busy}
                    onClick={() => void editAppearance()}
                  >
                    Open appearance editor
                  </button>
                </div>
              </>
            ) : (
              <div className="website-callout">
                <strong>
                  {path === "existing"
                    ? "Your existing website keeps its current design"
                    : "You can choose a template later"}
                </strong>
                <p>
                  {path === "existing"
                    ? "Talix will connect customers to ordering without replacing or framing your website."
                    : "Return to Website Appearance whenever you are ready to build a Talix website."}
                </p>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="website-step-body">
            {path === "existing" ? (
              <>
                <div className="website-intro">
                  <h3>Connect your current website</h3>
                  <p>
                    Enter the public address customers already use. Talix saves
                    the address but does not copy, frame, or fetch your site.
                  </p>
                </div>
                <label className="website-address-field">
                  Existing website address
                  <span>
                    <strong>https://</strong>
                    <input
                      type="url"
                      inputMode="url"
                      maxLength={2048}
                      placeholder="www.yourbusiness.com"
                      value={existingUrl.replace(/^https:\/\//, "")}
                      onChange={(event) =>
                        setExistingUrl(`https://${event.target.value}`)
                      }
                    />
                  </span>
                </label>
                <div className="website-callout">
                  <strong>Safe connection, not an embed</strong>
                  <p>
                    Add a standard link on your website to the Talix ordering
                    page. Website embeds are a separately reviewed future
                    feature.
                  </p>
                </div>
              </>
            ) : path === "talix_template" ? (
              <>
                <div className="website-intro">
                  <h3>Your included Talix web address</h3>
                  <p>
                    This secure address is ready for previews and launch. It
                    keeps one clear, indexable home for your content.
                  </p>
                </div>
                <div className="website-hosted-address">
                  <span>YOUR WEBSITE ADDRESS</span>
                  <strong>talix.app/shop/{subscription.slug}</strong>
                  <small>Included with your Talix website template</small>
                </div>
                <section className="website-future-option">
                  <span>FUTURE OPTION</span>
                  <h4>Use a domain you already own</h4>
                  <p>
                    Custom-domain activation will be offered after its security,
                    support, and operations review. Domain masking is not
                    supported because it can weaken trust and search quality.
                  </p>
                  <button type="button" disabled>
                    Not available yet
                  </button>
                </section>
              </>
            ) : (
              <div className="website-callout">
                <strong>No website address is needed yet</strong>
                <p>
                  Your current Talix ordering page remains available while you
                  decide.
                </p>
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="website-step-body">
            <div className="website-intro">
              <h3>Review before customers see it</h3>
              <p>
                Preview is private and ordering is disabled. Publishing remains
                a separate, explicit action.
              </p>
            </div>
            {path === "talix_template" ? (
              <>
                <div className="website-go-live-grid">
                  <section className="website-launch-summary">
                    <span className="website-card-label">YOUR WEBSITE</span>
                    <h4>
                      {websiteTemplates.find((item) => item.id === template)
                        ?.title ?? "Choose a template"}
                    </h4>
                    <p>talix.app/shop/{subscription.slug}</p>
                    <p>
                      Featured location:{" "}
                      {selectedLocation?.name ?? "Not ready"}
                    </p>
                    <strong>{liveTemplate ? "Live" : "Private draft"}</strong>
                    <button
                      ref={previewTrigger}
                      type="button"
                      className="secondary"
                      disabled={!template}
                      onClick={() => setPreviewOpen(true)}
                    >
                      Open customer preview
                    </button>
                  </section>
                  <section className="website-checklist">
                    <div className="website-checklist-heading">
                      <div>
                        <span className="website-card-label">
                          GO-LIVE CHECK
                        </span>
                        <h4>
                          {readyCount} of {readiness.length} content checks ready
                        </h4>
                      </div>
                      <span className="website-score">
                        {readyCount}/{readiness.length}
                      </span>
                    </div>
                    <ul>
                      {readiness.map((item) => (
                        <li key={item.label}>
                          <span
                            className={
                              item.ready ? "status-ready" : "status-attention"
                            }
                          >
                            {item.ready ? "Ready" : "Review"}
                          </span>
                          <span>
                            <strong>{item.label}</strong>
                            <small>{item.action}</small>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
                {!eligibleProducts.length && published.length > 0 && (
                  <label className="website-launch-confirmation">
                    <input
                      type="checkbox"
                      checked={confirmLaunch}
                      onChange={(event) =>
                        setConfirmLaunch(event.target.checked)
                      }
                    />
                    <span>
                      <strong>Launch without online ordering</strong>
                      <small>
                        I understand customers cannot order until an available
                        product is published.
                      </small>
                    </span>
                  </label>
                )}
              </>
            ) : (
              <div className="website-callout">
                <strong>
                  {path === "existing"
                    ? "Your website connection is ready to save"
                    : "Your choice is saved for later"}
                </strong>
                <p>
                  {path === "existing"
                    ? `Customers can continue using ${existingUrl || "your existing website"}, with a normal link to Talix ordering.`
                    : "Nothing will be published, and you can return at any time."}
                </p>
              </div>
            )}
          </div>
        )}

        <footer className="website-step-actions">
          <button
            type="button"
            className="secondary"
            disabled={busy || step === 0}
            onClick={() => {
              setStep((current) => Math.max(current - 1, 0));
              setMessage("");
            }}
          >
            Back
          </button>
          <div>
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => void save(false)}
            >
              {busy ? "Saving…" : "Save draft"}
            </button>
            {step < setupSteps.length - 1 ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void continueFromStep()}
              >
                Save and continue
              </button>
            ) : path === "talix_template" ? (
              <button
                type="button"
                disabled={
                  busy ||
                  !template ||
                  !published.length ||
                  (!eligibleProducts.length && !confirmLaunch)
                }
                onClick={() => void launch()}
              >
                {busy
                  ? "Working…"
                  : liveTemplate
                    ? "Update live website"
                    : "Make website live"}
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => void save(true)}
              >
                Finish setup
              </button>
            )}
          </div>
        </footer>
        <p role="status" className={message ? "message" : "sr-only"}>
          {message}
        </p>
      </div>

      {previewOpen && template && (
        <TaskDialog
          title={`${websiteTemplates.find((item) => item.id === template)?.title} customer preview`}
          closeLabel="Exit preview"
          close={closePreview}
          className="website-preview-dialog"
          backdropClose
        >
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
          <div className={`website-inline-preview preview-device-${device}`}>
            <WebsiteTemplateHero
              subscription={previewSubscription}
              location={selectedLocation}
              products={eligibleProducts}
              preview
            />
          </div>
          <p className="muted">
            Ordering is disabled in preview. Nothing here changes your live
            website.
          </p>
        </TaskDialog>
      )}
    </section>
  );
}
