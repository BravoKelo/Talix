"use client";
import Image from "next/image";
import { useImageDraft } from "@/lib/image-draft";
import { useState } from "react";
import type { Subscription } from "@/lib/types";

type Branding = Pick<
  Subscription,
  "name" | "description" | "accent" | "logo_url"
>;
export function AppearanceEditor({
  subscription,
  allowed,
  save,
  cancel,
  cleanup,
}: {
  subscription: Subscription;
  allowed: boolean;
  cancel: () => void;
  cleanup: (url: string) => Promise<void>;
  save: (value: Branding) => Promise<void>;
}) {
  const original = {
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
  const [draft, setDraft] = useState<Branding>(original);
  const [saved, setSaved] = useState<Branding>(original);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const dirty = image.dirty || JSON.stringify(draft) !== JSON.stringify(saved);
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
              const value = { ...draft, logo_url: url };
              await save(value);
              const old = image.committed(url);
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
            <label>
              Business logo
              <input
                disabled={!("logo_url" in subscription)}
                type="file"
                value=""
                accept="image/png,image/jpeg,image/webp"
                key={image.preview ? "logo" : "empty"}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    image.choose(file);
                    setMessage("Logo selected. Save branding to upload it.");
                  } catch (e) {
                    setMessage((e as Error).message);
                  }
                }}
              />
            </label>
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
            className="preview-header"
            style={{ borderTopColor: draft.accent }}
          >
            {image.preview ? (
              <Image
                width={150}
                height={84}
                unoptimized
                className="business-logo"
                src={image.preview}
                alt={`${draft.name} logo`}
              />
            ) : (
              <div
                className="preview-monogram"
                style={{ color: draft.accent }}
                aria-hidden="true"
              >
                {draft.name.slice(0, 1).toUpperCase() || "T"}
              </div>
            )}
            <h3>{draft.name || "Your business"}</h3>
            <p>
              {draft.description ||
                "Your introduction helps customers get to know your business."}
            </p>
          </div>
          <div className="preview-catalog">
            <p className="eyebrow">YOUR ONLINE STORE</p>
            <strong>Choose a location</strong>
            <div className="preview-location">
              Your location <span style={{ color: draft.accent }}>→</span>
            </div>
            <p className="muted">
              Products appear after customers select a location.
            </p>
          </div>
          <p className="preview-note">
            Layout preview · Products and ordering remain on your storefront.
          </p>
        </aside>
      </div>
      <div className="future-settings">
        <details>
          <summary>
            Header layout{" "}
            <span className="coming-soon">Feature coming soon</span>
          </summary>
          <p>
            Header templates and optional contact details will be available
            here.
          </p>
        </details>
        <details>
          <summary>
            Navigation links{" "}
            <span className="coming-soon">Feature coming soon</span>
          </summary>
          <p>
            Add, edit and arrange your storefront links, including mobile
            navigation.
          </p>
        </details>
        <details>
          <summary>
            Advanced colors{" "}
            <span className="coming-soon">Feature coming soon</span>
          </summary>
          <p>
            Individual background, text and button colors with a storefront
            preview.
          </p>
        </details>
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
