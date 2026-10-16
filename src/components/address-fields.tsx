"use client";
import { type Address } from "@/lib/business-details";

export function AddressFields({
  name,
  title,
  value,
  onChange,
  errors,
}: {
  name: "billing_address" | "location_address";
  title: string;
  value: Address;
  onChange: (value: Address) => void;
  errors: Record<string, string>;
}) {
  const address = value;
  return (
    <fieldset className="wide">
      <legend>{title}</legend>
      <div className="form-grid">
        {(
          [
            ["street", "Street address", "address-line1"],
            ["unit", "Apartment, suite or unit (optional)", "address-line2"],
            ["city", "City or town", "address-level2"],
            ["region", "State or region (optional)", "address-level1"],
            ["postal", "Postal code", "postal-code"],
            ["country", "Country", "country-name"],
          ] as const
        ).map(([field, label, auto]) => {
          const id = name + "-" + field,
            error = errors[name + "." + field];
          return (
            <label key={field}>
              {label}
              <input
                id={id}
                name={id}
                aria-label={title + " — " + label}
                autoComplete={
                  (name === "billing_address" ? "billing " : "shipping ") + auto
                }
                maxLength={field === "postal" ? 16 : 100}
                required={field !== "unit" && field !== "region"}
                value={address[field]}
                aria-invalid={!!error}
                aria-describedby={error ? id + "-error" : undefined}
                onChange={(e) =>
                  onChange({ ...address, [field]: e.target.value } as Address)
                }
              />
              {error && (
                <small className="field-error" id={id + "-error"}>
                  {error}
                </small>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
