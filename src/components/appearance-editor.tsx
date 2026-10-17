"use client";
import Image from "next/image";
import { browserClient } from "@/lib/supabase/client";
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
}: {
  subscription: Subscription;
  allowed: boolean;
  save: (value: Branding) => Promise<void>;
}) {
  const original = {
    name: subscription.name,
    description: subscription.description,
    accent: subscription.accent,
    logo_url: subscription.logo_url ?? null,
  };
  const [draft, setDraft] = useState<Branding>(original);
  const [saved, setSaved] = useState<Branding>(original);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
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
              await save(draft);
              setSaved({ ...draft });
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
                accept="image/png,image/jpeg,image/webp"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (
                    file.size > 5242880 ||
                    !["image/png", "image/jpeg", "image/webp"].includes(
                      file.type,
                    )
                  ) {
                    setMessage("Choose a JPEG, PNG or WebP image under 5 MB.");
                    e.target.value = "";
                    return;
                  }
                  setBusy(true);
                  setMessage("");
                  try {
                    const db = browserClient();
                    const path = `${subscription.id}/${crypto.randomUUID()}`;
                    const { error } = await db.storage
                      .from("business-logos")
                      .upload(path, file, { contentType: file.type });
                    if (error) throw error;
                    setDraft((previous) => ({
                      ...previous,
                      logo_url: db.storage
                        .from("business-logos")
                        .getPublicUrl(path).data.publicUrl,
                    }));
                    setMessage("Logo uploaded. Save branding to apply it.");
                  } catch {
                    setMessage(
                      "We couldn’t upload your logo. Please try again.",
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            </label>
            <p className="muted">
              {"logo_url" in subscription
                ? "JPEG, PNG or WebP, up to 5 MB. Your logo is public."
                : "Business logo uploads are awaiting activation."}
            </p>
            {draft.logo_url && (
              <button
                type="button"
                className="secondary"
                onClick={() => setDraft({ ...draft, logo_url: null })}
              >
                Remove logo
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
                disabled={!dirty || busy}
                onClick={() => {
                  setDraft({ ...saved });
                  setMessage("Unsaved changes discarded.");
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
            {draft.logo_url ? (
              <Image
                width={150}
                height={84}
                unoptimized
                className="business-logo"
                src={draft.logo_url}
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
