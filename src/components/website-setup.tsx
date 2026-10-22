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
import { headerLayout, storefrontStyle } from "@/lib/storefront-design";
import { StorefrontHeader } from "./storefront-header";
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

type SetupStep = {
  id: "setup" | "identity" | "locations" | "template" | "address" | "review";
  label: string;
};
const templateSteps: SetupStep[] = [
  { id: "setup", label: "Website setup" },
  { id: "identity", label: "Business identity" },
  { id: "locations", label: "Locations & ordering" },
  { id: "template", label: "Template & appearance" },
  { id: "address", label: "Web address" },
  { id: "review", label: "Go live" },
];
function stepsFor(path: WebsitePath, deferredReview: boolean): SetupStep[] {
  if (path === "existing")
    return [
      { id: "setup", label: "Website setup" },
      { id: "address", label: "Existing website" },
      { id: "review", label: "Review connection" },
    ];
  if (path === "deferred")
    return deferredReview
      ? [
          { id: "setup", label: "Website setup" },
          { id: "review", label: "Go live" },
        ]
      : [{ id: "setup", label: "Website setup" }];
  return templateSteps;
}

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
  // Retain the review screen after publication so its confirmation stays visible.
  const [deferredReview, setDeferredReview] = useState(
    !!subscription.website_live_template,
  );
  const setupSteps = useMemo(
    () => stepsFor(path, deferredReview),
    [path, deferredReview],
  );
  const activeStep = setupSteps[step] ?? setupSteps[0];
  const [template, setTemplate] = useState<WebsiteTemplate | null>(
    subscription.website_template ?? null,
  );
  const [liveTemplate, setLiveTemplate] = useState<WebsiteTemplate | null>(
    subscription.website_live_template ?? null,
  );
  const [launchedAt, setLaunchedAt] = useState(
    subscription.website_template_launched_at ?? null,
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
  const [confirmLaunch, setConfirmLaunch] = useState(false);
  const [previewView, setPreviewView] = useState<"home" | "shop">("home");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<"success" | "error">("error");
  const feedback = useRef<HTMLDivElement>(null);
  const [completion, setCompletion] = useState<
    "deferred" | "existing" | "template" | "storefront" | null
  >(
    subscription.website_setup_completed_at
      ? subscription.website_path === "existing"
        ? "existing"
        : subscription.website_path === "deferred"
          ? subscription.website_live_template
            ? null
            : "deferred"
          : subscription.website_live_template
            ? "template"
            : null
      : null,
  );
  const stepHeading = useRef<HTMLHeadingElement>(null);
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
    if (
      messageKind === "success" &&
      (message.startsWith("Saved for later") ||
        message.startsWith("Website published successfully") ||
        message.startsWith("Your existing website has been hidden"))
    ) {
      feedback.current?.focus();
      feedback.current?.scrollIntoView({ block: "nearest" });
    }
  }, [message, messageKind]);

  useEffect(() => {
    if (initialStep.current) {
      initialStep.current = false;
      return;
    }
    stepHeading.current?.focus();
  }, [step, path]);

  async function save(markComplete: boolean) {
    setMessageKind("error");
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
      setLaunchedAt(saved.website_template_launched_at ?? null);
      onSaved({ ...saved, default_location_id: persistedLocationId || null });
      setMessageKind("success");
      if (markComplete && path === "deferred") {
        setCompletion(saved.website_live_template ? null : "deferred");
        setMessage(
          saved.website_live_template
            ? "Saved for later. Your existing live Talix website was not changed."
            : "Saved for later. No website was published.",
        );
      } else if (markComplete && path === "existing") {
        setCompletion("existing");
        setMessage(
          "Existing website saved. It remains your primary website, and your Talix ordering page remains available.",
        );
      } else {
        setMessage("Draft saved.");
      }
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
    setMessageKind("error");
    if (activeStep.id === "template" && !template) {
      setMessage("Choose a template before continuing.");
      return;
    }
    const needsSave = ["setup", "locations", "template", "address"].includes(
      activeStep.id,
    );
    if (needsSave && !(await save(false))) return;
    setStep((current) => Math.min(current + 1, setupSteps.length - 1));
  }

  async function editAppearance() {
    if (await save(false)) openAppearance();
  }

  async function launch() {
    setMessageKind("error");
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
    setCompletion(null);
    setMessageKind("error");
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
      if (
        !saved.website_live_template ||
        !saved.website_template_launched_at ||
        Number.isNaN(Date.parse(saved.website_template_launched_at))
      ) {
        throw new Error(
          "Publication could not be confirmed. Reload setup to check the current website status before trying again.",
        );
      }
      setLiveTemplate(saved.website_live_template ?? null);
      setLaunchedAt(saved.website_template_launched_at ?? null);
      onSaved({
        ...saved,
        default_location_id: selectedLocation?.id ?? (savedLocationId || null),
      });
      setConfirmLaunch(false);
      setCompletion("template");
      setMessageKind("success");
      setMessage(
        `Website published successfully, ${subscription.name} has been published at ${new Date(saved.website_template_launched_at).toLocaleString()}.${eligibleProducts.length ? "" : " Live — online ordering not ready."}`,
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

  async function publishStorefront() {
    setMessageKind("error");
    if (!liveTemplate || !launchedAt) return;
    const previousTemplate = liveTemplate;
    const previousLaunchedAt = launchedAt;
    if (!(await save(false))) return;
    setBusy(true);
    setCompletion(null);
    setMessage("");
    setMessageKind("error");
    try {
      const { data, error } = await browserClient().rpc(
        "publish_storefront_only",
        {
          p_subscription: subscription.id,
          p_previous_template: previousTemplate,
          p_previous_launched_at: previousLaunchedAt,
        },
      );
      if (error) {
        if (error.code === "PGRST202" || error.code === "42883")
          throw new Error(
            "Storefront-only publication is awaiting activation. Your live website has not been hidden.",
          );
        throw error;
      }
      const saved = data as
        | (WebsiteState & { storefront_only?: boolean })
        | null;
      if (
        !saved ||
        saved.storefront_only !== true ||
        saved.website_path !== "deferred" ||
        saved.website_live_template !== null ||
        saved.website_template_launched_at !== null
      ) {
        throw new Error(
          "Publication could not be confirmed. Reload setup to check the public mode before trying again.",
        );
      }
      setLiveTemplate(null);
      setLaunchedAt(null);
      onSaved({ ...saved, default_location_id: savedLocationId || null });
      setCompletion("storefront");
      setMessageKind("success");
      setMessage(
        "Your existing website has been hidden, Talix is now in storefront only mode",
      );
    } catch (error) {
      setMessage(
        (error as { message?: string })?.message ||
          "Publication could not be confirmed. Reload setup to check the public mode, or retry this confirmation safely.",
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
            {setupSteps.map(({ id, label }, index) => (
              <li key={id}>
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
            {activeStep.label}
          </h2>
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            Step {step + 1} of {setupSteps.length}: {activeStep.label}
          </p>
        </header>

        {completion && (
          <section
            className="website-callout"
            aria-label="Website setup status"
          >
            <strong>
              {completion === "storefront"
                ? "Storefront-only mode published"
                : completion === "template"
                  ? "Website published successfully"
                  : completion === "existing"
                    ? "Existing website connection saved"
                    : "Website setup saved for later"}
            </strong>
            <p>
              {completion === "storefront"
                ? "Your existing website has been hidden, Talix is now in storefront only mode"
                : completion === "template"
                  ? `${subscription.name} is published at its Talix website address.`
                  : completion === "existing"
                    ? "Your existing website connection is saved. The public Talix experience remains unchanged."
                    : liveTemplate
                      ? "Setup is deferred. Your previously published Talix website remains unchanged."
                      : "No marketing website was published. Your Talix ordering page remains available."}
            </p>
            {completion !== "deferred" && (
              <div className="website-template-actions">
                {completion === "existing" &&
                  validExistingWebsite(existingUrl) && (
                    <a
                      className="secondary"
                      href={existingUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open existing website
                    </a>
                  )}
                <a
                  className="button website-gold-action"
                  href={`/shop/${subscription.slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {liveTemplate ? "Open website" : "Open storefront"}
                </a>
              </div>
            )}
          </section>
        )}

        {activeStep.id === "setup" && (
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
                        if (item.id === "deferred" && liveTemplate)
                          setDeferredReview(true);
                        setStep(0);
                        setMessage("");
                        setCompletion(null);
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
                {path === "deferred"
                  ? deferredReview && liveTemplate
                    ? "Save to continue, then use Go live to publish storefront-only mode. Your existing website stays live until you confirm."
                    : "Save this choice and return to Website Appearance whenever you are ready."
                  : "Start with the best fit today. Nothing publishes until you complete the final review."}
              </p>
            </div>
          </div>
        )}

        {activeStep.id === "identity" && (
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
                    <dd
                      className={
                        subscription.logo_url
                          ? "website-asset-added"
                          : "website-asset-optional"
                      }
                    >
                      {subscription.logo_url
                        ? "✓ Added"
                        : "Optional — using business initial"}
                    </dd>
                  </div>
                  <div>
                    <dt>Header identity</dt>
                    <dd
                      className={
                        subscription.header_photo_url
                          ? "website-asset-added"
                          : "website-asset-optional"
                      }
                    >
                      {subscription.header_photo_url
                        ? subscription.header_identity === "photo"
                          ? "✓ Added — displayed in header"
                          : "✓ Added — business name displayed"
                        : "Optional — using business name"}
                    </dd>
                  </div>
                  <div>
                    <dt>Hero image</dt>
                    <dd
                      className={
                        subscription.website_hero_url
                          ? "website-asset-added"
                          : "website-asset-optional"
                      }
                    >
                      {subscription.website_hero_url
                        ? "✓ Added"
                        : "Optional — no hero image added"}
                    </dd>
                  </div>
                  <div>
                    <dt>Brand color</dt>
                    <dd className="website-brand-color">
                      <span
                        aria-hidden="true"
                        style={{ backgroundColor: subscription.accent }}
                      />
                      {subscription.accent.toUpperCase()}
                    </dd>
                  </div>
                </dl>
                <button
                  type="button"
                  className="website-gold-action"
                  disabled={busy}
                  onClick={() => void editAppearance()}
                >
                  Edit Website Branding
                </button>
              </section>
            </div>
          </div>
        )}

        {activeStep.id === "locations" && (
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

        {activeStep.id === "template" && (
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

        {activeStep.id === "address" && (
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
                <p className="muted">
                  Custom domains are not available yet. Use your included Talix
                  address; domain masking is not supported.
                </p>
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

        {activeStep.id === "review" && (
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
                  <div className="website-launch-details">
                    <section className="website-checklist">
                      <div className="website-checklist-heading">
                        <div>
                          <span className="website-card-label">
                            GO-LIVE CHECK
                          </span>
                          <h4>
                            {readyCount} of {readiness.length} content checks
                            ready
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
                    <section
                      className="website-launch-summary"
                      aria-label="Live website details"
                    >
                      <span className="website-card-label">PUBLIC WEBSITE</span>
                      <strong>
                        {liveTemplate
                          ? "Live"
                          : "Not published — private draft"}
                      </strong>
                      <a
                        href={`/shop/${subscription.slug}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {liveTemplate ? "Open website" : "Open storefront"} ↗
                      </a>
                      <small>/shop/{subscription.slug}</small>
                      {liveTemplate && launchedAt && (
                        <small>
                          Published {new Date(launchedAt).toLocaleString()}
                        </small>
                      )}
                      <p>
                        Draft featured location:{" "}
                        {selectedLocation?.name ?? "Not ready"}
                      </p>
                    </section>
                  </div>
                  <section
                    className="website-review-preview"
                    aria-label="Your website preview"
                  >
                    <div className="preview-label">
                      YOUR WEBSITE <span>Private draft</span>
                    </div>
                    <div
                      className="preview-devices"
                      role="group"
                      aria-label="Preview size"
                    >
                      {(["mobile", "tablet", "desktop"] as const).map(
                        (size) => (
                          <button
                            key={size}
                            type="button"
                            className="secondary"
                            aria-pressed={device === size}
                            onClick={() => setDevice(size)}
                          >
                            {size[0].toUpperCase() + size.slice(1)}
                          </button>
                        ),
                      )}
                    </div>
                    {template ? (
                      <div
                        className={`website-inline-preview appearance-live-preview header-${headerLayout(previewSubscription)} preview-device-${device}`}
                        style={storefrontStyle(previewSubscription)}
                        tabIndex={0}
                        role="region"
                        aria-label="Scrollable website preview"
                      >
                        <div className="preview-header shop-header">
                          <StorefrontHeader
                            subscription={previewSubscription}
                            location={selectedLocation}
                            preview
                            onPreviewNavigate={setPreviewView}
                          />
                        </div>
                        <WebsiteTemplateHero
                          subscription={previewSubscription}
                          location={selectedLocation}
                          products={eligibleProducts}
                          preview
                          previewView={previewView}
                          onPreviewNavigate={setPreviewView}
                        />
                      </div>
                    ) : (
                      <p>Choose a template to preview your website.</p>
                    )}
                    <p className="preview-note">
                      Ordering is disabled in preview. Publishing is a separate
                      action.
                    </p>
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
                <h3>
                  {path === "existing"
                    ? "Your website connection is ready to save"
                    : deferredReview
                      ? "Switch to storefront-only mode"
                      : "Your choice is saved for later"}
                </h3>
                <p>
                  {path === "existing"
                    ? `Customers can continue using ${existingUrl || "your existing website"}, with a normal link to Talix ordering.`
                    : deferredReview
                      ? "Your existing Talix website will be hidden only when you publish this change. Your storefront address, products, branding and saved website draft are retained."
                      : "Nothing will be published, and you can return at any time."}
                </p>
                {path === "deferred" && deferredReview && (
                  <div>
                    <p>
                      {liveTemplate
                        ? "Your existing website is still live."
                        : "Your storefront is the current public experience."}
                    </p>
                    {liveTemplate && (
                      <p>
                        Current website:{" "}
                        {
                          websiteTemplates.find(
                            (item) => item.id === liveTemplate,
                          )?.title
                        }
                        .
                        {launchedAt &&
                          ` Published ${new Date(launchedAt).toLocaleString()}.`}
                      </p>
                    )}
                  </div>
                )}
                {path === "existing" && (
                  <dl>
                    <div>
                      <dt>Primary website</dt>
                      <dd>{existingUrl || "Website address needed"}</dd>
                    </div>
                    <div>
                      <dt>Talix ordering page</dt>
                      <dd>talix.app/shop/{subscription.slug}</dd>
                    </div>
                  </dl>
                )}
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
                {path === "deferred" ? "Save to continue" : "Save and continue"}
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
            ) : path === "deferred" && deferredReview ? (
              <button
                type="button"
                disabled={busy || !liveTemplate || !launchedAt}
                onClick={() => void publishStorefront()}
              >
                {busy ? "Working…" : "Publish storefront-only mode"}
              </button>
            ) : path === "existing" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void save(true)}
              >
                Save website connection
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => void save(true)}
              >
                Save for later
              </button>
            )}
          </div>
        </footer>
        <div
          ref={feedback}
          tabIndex={-1}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={message ? `website-feedback ${messageKind}` : "sr-only"}
        >
          {message && (
            <>
              <strong>
                {messageKind === "success" ? "✓ " : ""}
                {message}
              </strong>
              {messageKind === "success" &&
                message.startsWith("Website published successfully") &&
                liveTemplate && (
                  <a
                    className="button website-gold-action"
                    href={`/shop/${subscription.slug}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open website
                  </a>
                )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
