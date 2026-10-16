"use client";
import { useState } from "react";
import { browserClient } from "@/lib/supabase/client";
import { cents, type Location, type Product } from "@/lib/types";
export function LocationForm({
  location,
  busy,
  save,
}: {
  location: Location;
  busy: boolean;
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
      <button disabled={busy}>Save location</button>
    </form>
  );
}
export function ProductEditor({
  sid,
  locations,
  product,
  busy,
  save,
}: {
  sid: string;
  locations: Location[];
  product?: Product;
  busy: boolean;
  save: (v: Omit<Product, "id">) => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  const [image, setImage] = useState(product?.image_url || ""),
    [uploadMessage, setUploadMessage] = useState("");
  return (
    <details className="panel">
      <summary>{product ? "Edit product" : "Add product"}</summary>
      <form
        className="stack"
        style={{ marginTop: 16 }}
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          try {
            const opts = String(f.get("options"))
              .split("\n")
              .filter((l) => l.trim())
              .map((l, i) => {
                const [name, price] = l.split("|");
                return {
                  id: `option-${i}`,
                  name: name.trim(),
                  price_cents: cents((price || "0").trim()),
                };
              });
            void save({
              subscription_id: sid,
              location_id: String(f.get("scope")) || null,
              name: String(f.get("name")),
              description: String(f.get("description")),
              price_cents: cents(String(f.get("price"))),
              image_url: image || null,
              available: product?.available ?? true,
              options: opts,
            });
          } catch (e) {
            setUploadMessage(
              e instanceof Error ? e.message : "Invalid product",
            );
          }
        }}
      >
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
        <label>
          Price (USD)
          <input
            name="price"
            inputMode="decimal"
            defaultValue={product ? (product.price_cents / 100).toFixed(2) : ""}
            required
          />
        </label>
        <label>
          Scope
          <select name="scope" defaultValue={product?.location_id || ""}>
            <option value="">General — all locations</option>
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
        <label>
          Product image
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploading(true);
              try {
                if (
                  file.size > 5242880 ||
                  !["image/jpeg", "image/png", "image/webp"].includes(file.type)
                )
                  throw new Error("Choose a JPEG, PNG or WebP under 5 MB.");
                const db = browserClient(),
                  path = `${sid}/${crypto.randomUUID()}`;
                const { error } = await db.storage
                  .from("product-images")
                  .upload(path, file, { contentType: file.type });
                if (error) throw error;
                setImage(
                  db.storage.from("product-images").getPublicUrl(path).data
                    .publicUrl,
                );
                setUploadMessage(
                  "Image uploaded; save the product to apply it.",
                );
              } catch (e) {
                setUploadMessage(
                  e instanceof Error ? e.message : "Upload failed",
                );
              } finally {
                setUploading(false);
              }
            }}
          />
        </label>
        {image && (
          <button
            type="button"
            className="secondary"
            onClick={() => setImage("")}
          >
            Remove product image
          </button>
        )}
        <p role="status">{uploadMessage}</p>
        <button disabled={busy || uploading}>
          {uploading ? "Uploading image…" : "Save product"}
        </button>
      </form>
    </details>
  );
}
