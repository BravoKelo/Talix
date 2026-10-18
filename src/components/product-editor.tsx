"use client";
import { displayImageUrl } from "@/lib/demo-image";
import Image from "next/image";
import { ImagePicker } from "./image-picker";
import { useState } from "react";
import { TaskDialog } from "./order-dialog";
import { useImageDraft } from "@/lib/image-draft";
import { cents, type Location, type Product } from "@/lib/types";
export function LocationForm({
  location,
  busy,
  save,
  cancel,
}: {
  location: Location;
  busy: boolean;
  cancel: () => void;
  save: (
    v: Pick<Location, "name" | "address" | "phone" | "hours" | "published">,
  ) => Promise<void>;
}) {
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        void save({
          name: String(f.get("name")),
          address: String(f.get("address")),
          phone: String(f.get("phone")),
          hours: String(f.get("hours")),
          published: f.get("published") === "on",
        });
      }}
    >
      {["name", "address", "phone", "hours"].map((k) => (
        <label key={k}>
          {k[0].toUpperCase() + k.slice(1)}
          <input
            name={k}
            defaultValue={location[k as "name"]}
            required={k === "name"}
          />
        </label>
      ))}
      <label>
        <input
          type="checkbox"
          name="published"
          defaultChecked={location.published}
        />
        Accept online orders at this location
      </label>
      <div className="actions">
        <button disabled={busy}>Save location</button>
        <button
          type="button"
          className="secondary"
          disabled={busy}
          onClick={(e) => {
            e.currentTarget.form?.reset();
            cancel();
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
export function ProductEditor({
  sid,
  locations,
  product,
  allowGeneral = true,
  categoriesEnabled = false,
  save,
  close,
  remove,
  cleanup,
}: {
  sid: string;
  locations: Location[];
  product?: Product;
  allowGeneral?: boolean;
  categoriesEnabled?: boolean;
  save: (value: Omit<Product, "id">) => Promise<void>;
  close: () => void;
  remove?: () => Promise<void>;
  cleanup: (url: string) => Promise<void>;
}) {
  const image = useImageDraft(
    product?.image_url ?? null,
    "product-images",
    sid,
  );
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [confirmDelete, setConfirmDelete] = useState(false);
  async function cancel() {
    setBusy(true);
    try {
      await image.discard();
      close();
    } catch {
      setMessage(
        "We couldn’t discard the uploaded image. Please try Cancel again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <TaskDialog
      title={product ? "Edit product" : "Add product"}
      closeLabel="Cancel"
      busy={busy}
      close={() => void cancel()}
    >
      <p role="status">{message}</p>
      {confirmDelete ? (
        <section className="stack">
          <h2>Delete {product?.name}?</h2>
          <p>
            This removes the product from your catalog. Past order details are
            preserved.
          </p>
          <div className="actions">
            <button
              className="danger"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setMessage("");
                try {
                  await image.discard();
                  await remove?.();
                  if (product?.image_url) await cleanup(product.image_url);
                  close();
                } catch {
                  setMessage(
                    "We couldn’t delete this product. Please try again.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              Delete product
            </button>
            <button
              className="secondary"
              disabled={busy}
              onClick={() => setConfirmDelete(false)}
            >
              Cancel deletion
            </button>
          </div>
        </section>
      ) : (
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setMessage("");
            const f = new FormData(e.currentTarget);
            try {
              const options = String(f.get("options"))
                .split("\n")
                .filter((line) => line.trim())
                .map((line, i) => {
                  const [name, price] = line.split("|");
                  return {
                    id: `option-${i}`,
                    name: name.trim(),
                    price_cents: cents((price || "0").trim()),
                  };
                });
              const price = cents(String(f.get("price")));
              const url = await image.prepare();
              await save({
                subscription_id: sid,
                location_id: String(f.get("scope")) || null,
                name: String(f.get("name")),
                description: String(f.get("description")),
                ...(categoriesEnabled
                  ? { category: String(f.get("category") || "").trim() }
                  : {}),
                price_cents: price,
                image_url: url,
                available: product?.available ?? true,
                options,
              });
              const previous = image.committed(url);
              for (const url of previous) await cleanup(url);
              close();
            } catch (e) {
              setMessage(
                e instanceof Error
                  ? e.message
                  : "We couldn’t save this product. Please try again.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <fieldset className="stack" disabled={busy}>
            <label>
              Name
              <input
                name="name"
                defaultValue={product?.name}
                required
                maxLength={100}
              />
            </label>
            <label>
              Description
              <textarea
                name="description"
                defaultValue={product?.description}
                maxLength={2000}
              />
            </label>
            {categoriesEnabled && (
              <label>
                Collection
                <input
                  name="category"
                  defaultValue={product?.category}
                  maxLength={80}
                  placeholder="Optional collection name"
                />
              </label>
            )}
            <label>
              Price (USD)
              <input
                name="price"
                inputMode="decimal"
                defaultValue={
                  product ? (product.price_cents / 100).toFixed(2) : ""
                }
                required
              />
            </label>
            <label>
              Scope
              <select
                name="scope"
                defaultValue={
                  product?.location_id || (allowGeneral ? "" : locations[0]?.id)
                }
              >
                {allowGeneral && (
                  <option value="">General — all locations</option>
                )}
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Optional extras: one per line, Name | price
              <textarea
                name="options"
                placeholder="Gift wrap | 2.00"
                defaultValue={product?.options
                  .map((o) => `${o.name} | ${(o.price_cents / 100).toFixed(2)}`)
                  .join("\n")}
              />
            </label>
            <ImagePicker
              label="Product image"
              filename={image.filename}
              choose={(file) => {
                try {
                  image.choose(file);
                  setMessage("Image selected. Save product to upload it.");
                } catch (e) {
                  setMessage((e as Error).message);
                }
              }}
            />
            {image.preview && (
              <>
                <Image
                  src={displayImageUrl(image.preview)}
                  alt="Product image preview"
                  width={180}
                  height={120}
                  unoptimized
                  className="image-edit-preview"
                />
                <button
                  type="button"
                  className="danger"
                  onClick={() => {
                    image.clear();
                    setMessage(
                      "Image will be deleted when you save. Cancel keeps your saved image.",
                    );
                  }}
                >
                  Delete image
                </button>
              </>
            )}
            <div className="actions">
              <button disabled={busy}>
                {busy ? "Saving…" : "Save product"}
              </button>
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={() => void cancel()}
              >
                Cancel
              </button>
            </div>
            {product && remove && (
              <button
                type="button"
                className="danger"
                disabled={busy}
                onClick={() => setConfirmDelete(true)}
              >
                Delete product
              </button>
            )}
          </fieldset>
        </form>
      )}
    </TaskDialog>
  );
}
