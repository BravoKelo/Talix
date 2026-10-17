"use client";
import Image from "next/image";
import { ImagePicker } from "./image-picker";
import { useImageDraft } from "@/lib/image-draft";
import { useState } from "react";
import {
  designFor,
  storefrontStyle,
  type StorefrontDesign,
} from "@/lib/storefront-design";
import type { Location, Subscription } from "@/lib/types";

type Branding = StorefrontDesign & {
  header_photo_url: string | null;
  default_location_id: string | null;
} & Pick<Subscription, "name" | "description" | "accent" | "logo_url">;
export function AppearanceEditor({
  subscription,
  allowed,
  locations,
  save,
  cancel,
  cleanup,
}: {
  subscription: Subscription;
  allowed: boolean;
  locations: Location[];
  cancel: () => void;
  cleanup: (url: string) => Promise<void>;
  save: (value: Branding) => Promise<void>;
}) {
  const expanded = "default_location_id" in subscription;
  const original = {
    ...designFor(subscription),
    header_photo_url: subscription.header_photo_url ?? null,
    default_location_id: subscription.default_location_id ?? null,
    name: subscription.name,
    description: subscription.description,
    accent: subscription.accent,
    logo_url: subscription.logo_url ?? null,
  };
  const image = useImageDraft(
    subscription.logo_url ?? null,
    "business-logos",
    subscription.id,
  );
  const photo = useImageDraft(
    subscription.header_photo_url ?? null,
    "business-logos",
    subscription.id,
  );
  const [draft, setDraft] = useState<Branding>(original);
  const [saved, setSaved] = useState<Branding>(original);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const dirty =
    photo.dirty ||
    image.dirty ||
    JSON.stringify(draft) !== JSON.stringify(saved);
  return (
    <section
      id="storefront-appearance"
      className="panel appearance-editor"
      aria-label="Storefront appearance"
    >
      <div className="section-heading">
        <p className="eyebrow">MAKE IT YOURS</p>
        <h2>Storefront appearance</h2>
        <p className="muted">
          One look for every location in this subscription.
        </p>
      </div>
      <div className="appearance-grid">
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setMessage("");
            try {
              const url = await image.prepare();
              const photoUrl = await photo.prepare();
              const value = {
                ...draft,
                logo_url: url,
                header_photo_url: photoUrl,
              };
              await save(value);
              const old = [
                ...image.committed(url),
                ...photo.committed(photoUrl),
              ];
              setDraft(value);
              setSaved(value);
              for (const url of old) await cleanup(url);
              setMessage("Your storefront appearance has been saved.");
            } catch {
              setMessage("We couldn’t save your changes. Please try again.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <fieldset disabled={!allowed || busy} className="stack">
            <ImagePicker
              label="Business logo"
              filename={image.filename}
              disabled={!("logo_url" in subscription)}
              choose={(file) => {
                try {
                  image.choose(file);
                  setMessage("Logo selected. Save branding to upload it.");
                } catch (e) {
                  setMessage((e as Error).message);
                }
              }}
            />
            <p className="muted">
              {"logo_url" in subscription
                ? "JPEG, PNG or WebP, up to 5 MB. Your logo is public."
                : "Business logo uploads are awaiting activation."}
            </p>
            {image.preview && (
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  image.clear();
                  setMessage(
                    "Image will be deleted when you save. Cancel keeps your saved logo.",
                  );
                }}
              >
                Delete image
              </button>
            )}
            <label>
              Business name
              <input
                required
                maxLength={100}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>
            <label>
              Introduction
              <textarea
                maxLength={1000}
                value={draft.description}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
              />
            </label>
            <label>
              Brand color
              <div className="color-control">
                <input
                  aria-label="Brand color"
                  type="color"
                  value={draft.accent}
                  onChange={(e) =>
                    setDraft({ ...draft, accent: e.target.value })
                  }
                />
                <code>{draft.accent.toUpperCase()}</code>
              </div>
            </label>
            <fieldset className="stack" disabled={!expanded}>
              <legend>Website style</legend>
              {!expanded && (
                <p className="notice">
                  Additional storefront settings are awaiting activation.
                </p>
              )}
              <label>
                Centered header identity
                <select
                  aria-label="Centered header identity"
                  value={draft.header_identity}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      header_identity: e.target
                        .value as StorefrontDesign["header_identity"],
                    })
                  }
                >
                  <option value="name">Business name</option>
                  <option value="photo">Uploaded photo</option>
                </select>
              </label>
              <ImagePicker
                label="Header photo"
                filename={photo.filename}
                disabled={!expanded}
                choose={(file) => {
                  try {
                    photo.choose(file);
                    setMessage("Photo selected. Save branding to upload it.");
                  } catch (e) {
                    setMessage((e as Error).message);
                  }
                }}
              />
              <p className="muted">
                JPEG, PNG or WebP, up to 5 MB. Displayed in the center of your
                header; the photo is public.
              </p>
              {photo.preview && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => photo.clear()}
                >
                  Delete header photo
                </button>
              )}
              <label>
                Default shopping location
                <select
                  aria-label="Default shopping location"
                  value={draft.default_location_id ?? ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      default_location_id: e.target.value || null,
                    })
                  }
                >
                  <option value="">First published location</option>
                  {locations
                    .filter((l) => l.published)
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                </select>
              </label>
              <p className="muted">
                Customers start here and can change location. If it is
                unpublished, the first published location is used.
              </p>
              {(
                [
                  ["header_background", "Header background"],
                  ["storefront_text", "Product text"],
                  ["storefront_button", "Buttons"],
                ] as const
              ).map(([key, label]) => (
                <label key={key}>
                  {label}
                  <input
                    type="color"
                    value={draft[key]}
                    onChange={(e) =>
                      setDraft({ ...draft, [key]: e.target.value })
                    }
                  />
                </label>
              ))}
              <label>
                Font family
                <select
                  aria-label="Font family"
                  value={draft.storefront_font}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      storefront_font: e.target
                        .value as StorefrontDesign["storefront_font"],
                    })
                  }
                >
                  <option value="sans">Sans serif</option>
                  <option value="serif">Serif</option>
                  <option value="mono">Monospace</option>
                </select>
              </label>
              <label>
                Text size
                <select
                  aria-label="Text size"
                  value={draft.storefront_text_size}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      storefront_text_size: e.target
                        .value as StorefrontDesign["storefront_text_size"],
                    })
                  }
                >
                  <option value="standard">Standard</option>
                  <option value="large">Large</option>
                </select>
              </label>
              <label>
                Tile corners
                <select
                  aria-label="Tile corners"
                  value={draft.tile_corners}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      tile_corners: e.target
                        .value as StorefrontDesign["tile_corners"],
                    })
                  }
                >
                  <option value="square">Square</option>
                  <option value="subtle">Subtle</option>
                  <option value="round">Rounded</option>
                </select>
              </label>
              <label>
                Tile spacing
                <select
                  aria-label="Tile spacing"
                  value={draft.tile_spacing}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      tile_spacing: e.target
                        .value as StorefrontDesign["tile_spacing"],
                    })
                  }
                >
                  <option value="comfortable">Comfortable</option>
                  <option value="compact">Compact</option>
                </select>
              </label>
            </fieldset>
            <div className="appearance-actions">
              <button disabled={busy}>
                {busy ? "Saving…" : "Save branding"}
              </button>
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await image.discard();
                    await photo.discard();
                    setDraft({ ...saved });
                    setMessage("");
                    cancel();
                  } catch {
                    setMessage(
                      "We couldn’t discard the uploaded image. Please try again.",
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Cancel changes
              </button>
            </div>
          </fieldset>
          {!allowed && (
            <p className="muted">
              You can view this subscription’s appearance. Ask your manager for
              access to make changes.
            </p>
          )}
          <p role="status">
            {message ||
              (dirty
                ? "Unsaved changes — only shown in this preview."
                : "Your saved appearance is shown below.")}
          </p>
        </form>
        <aside className="store-preview">
          <div className="preview-label">
            STOREFRONT PREVIEW <span>{dirty ? "Unsaved" : "Saved"}</span>
          </div>
          <div
            className="appearance-live-preview"
            style={storefrontStyle(draft)}
          >
            <div className="preview-header">
              {image.preview && (
                <Image
                  width={72}
                  height={56}
                  unoptimized
                  className="business-logo"
                  src={image.preview}
                  alt={`${draft.name} logo`}
                />
              )}
              {draft.header_identity === "photo" && photo.preview ? (
                <Image
                  width={240}
                  height={56}
                  unoptimized
                  className="preview-center-photo"
                  src={photo.preview}
                  alt={draft.name}
                />
              ) : (
                <h3>{draft.name || "Your business"}</h3>
              )}
              <span aria-hidden="true">Cart</span>
            </div>
            <div className="preview-catalog">
              <details>
                <summary>Business information</summary>
                <p>{draft.description}</p>
              </details>
              <p>
                Shopping at{" "}
                {locations.find((l) => l.id === draft.default_location_id)
                  ?.name ||
                  locations.find((l) => l.published)?.name ||
                  "your first published location"}
              </p>
              <div className="preview-product-grid">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <div className="preview-photo" />
                    <strong>Product</strong>
                    <p>Brief description</p>
                    <span className="preview-add">Add to cart</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="preview-note">
            Layout preview · Products and ordering remain on your storefront.
          </p>
        </aside>
      </div>
      <div className="future-settings">
        <p className="muted">
          Custom navigation links and slideshows remain planned.
        </p>
        <details>
          <summary>
            Slideshow <span className="coming-soon">Feature coming soon</span>
          </summary>
          <p>Additional storefront imagery will be configured here.</p>
        </details>
      </div>
    </section>
  );
}
