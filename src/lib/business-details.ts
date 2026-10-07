import { type BusinessDetails } from "@/lib/onboarding";

export type Address = {
  street: string;
  unit: string;
  city: string;
  region: string;
  postal: string;
  country: string;
};
export const emptyAddress: Address = {
  street: "",
  unit: "",
  city: "",
  region: "",
  postal: "",
  country: "United States",
};
export const clean = (value: string) => value.trim().replace(/\s+/gu, " ");
export function parseAddress(value: string): Address {
  const parts = value.split(", ");
  if (parts.length !== 5) return { ...emptyAddress, street: value };
  const [street, city, region, postal, country] = parts;
  const [line, unit = ""] = street.split(" / ");
  return {
    street: line,
    unit,
    city,
    region: region === "—" ? "" : region,
    postal,
    country,
  };
}
export function formatAddress(a: Address) {
  return [
    clean(a.street) + (clean(a.unit) ? " / " + clean(a.unit) : ""),
    clean(a.city),
    clean(a.region) || "—",
    clean(a.postal).toUpperCase(),
    clean(a.country),
  ].join(", ");
}
export function formatPhone(value: string) {
  const trimmed = value.trim();
  if (!/^[+\d\s().-]+$/.test(trimmed)) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) return "+" + digits;
  if (digits.length === 10) return "+1" + digits;
  if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
  return trimmed;
}
export function normalizeBusiness(b: BusinessDetails): BusinessDetails {
  return {
    ...b,
    business_name: clean(b.business_name),
    contact_name: clean(b.contact_name),
    phone: formatPhone(b.phone),
    location_name: clean(b.location_name),
    slug: b.slug.trim().toLowerCase(),
    billing_address: formatAddress(parseAddress(b.billing_address)),
    location_address: formatAddress(parseAddress(b.location_address)),
  };
}
export function businessErrors(b: BusinessDetails) {
  const errors: Record<string, string> = {};
  for (const key of ["business_name", "location_name"] as const)
    if (!/[\p{L}\p{N}]/u.test(b[key]) || clean(b[key]).length > 100)
      errors[key] = "Enter a name using letters or numbers.";
  if (
    !/^[\p{L}\p{M}][\p{L}\p{M} .'’\-]*$/u.test(clean(b.contact_name)) ||
    clean(b.contact_name).length < 2 ||
    clean(b.contact_name).length > 100
  )
    errors.contact_name =
      "Enter your full name using letters, spaces, apostrophes or hyphens.";
  if (!/^\+[1-9]\d{6,14}$/.test(formatPhone(b.phone)))
    errors.phone =
      "Enter a phone number with a country code, such as +1 (206) 555-0123.";
  if (!/^[a-z0-9][a-z0-9-]{2,62}$/.test(b.slug.trim().toLowerCase()))
    errors.slug =
      "Choose 3–63 letters, numbers or dashes, such as your-business.";
  for (const key of ["billing_address", "location_address"] as const) {
    const a = parseAddress(b[key]);
    for (const field of [
      "street",
      "unit",
      "city",
      "region",
      "postal",
      "country",
    ] as const) {
      const value = clean(a[field]);
      if (
        value.includes(",") ||
        /[\r\n\t]/.test(a[field]) ||
        value.length > 100
      )
        errors[key + "." + field] =
          "Use one line without commas, up to 100 characters.";
    }
    if (clean(a.street).length < 3 || !/[\p{L}\p{N}]/u.test(a.street))
      errors[key + ".street"] = "Enter a street address.";
    if (clean(a.city).length < 2 || !/\p{L}/u.test(a.city))
      errors[key + ".city"] = "Enter a city or town.";
    if (!/^[A-Za-z0-9][A-Za-z0-9 -]{1,15}$/.test(clean(a.postal)))
      errors[key + ".postal"] =
        "Enter a postal code using letters, numbers, spaces or dashes.";
    if (!/^[\p{L}\p{M} .'’\-]{2,100}$/u.test(clean(a.country)))
      errors[key + ".country"] = "Enter a country name.";
    if (b[key].length > 500)
      errors[key + ".street"] =
        "Keep the complete address within 500 characters.";
  }
  return errors;
}
export function subscriptionProblem(message?: string) {
  if (message?.includes("store address"))
    return { area: "business", field: "slug", message };
  if (message?.includes("contact name"))
    return { area: "business", field: "contact_name", message };
  if (message?.includes("phone number"))
    return { area: "business", field: "phone", message };
  if (message?.includes("billing address"))
    return { area: "business", field: "billing_address.street", message };
  if (message?.includes("location address"))
    return { area: "business", field: "location_address.street", message };
  if (message?.includes("business and contact"))
    return { area: "business", field: "business_name", message };
  if (
    message?.includes("latest price") ||
    message?.includes("no longer available") ||
    message?.includes("business type, a plan")
  )
    return {
      area: "plan",
      field: "",
      message: message ?? "Please review your selection.",
    };
  return {
    area: "retry",
    field: "",
    message:
      "We couldn’t finish setting up your business. Your details are saved. Please try again.",
  };
}

export function sameQuote(a: unknown, b: unknown): boolean {
  const stable = (v: unknown): string => {
    if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
    if (v && typeof v === "object")
      return (
        "{" +
        Object.entries(v)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, value]) => JSON.stringify(key) + ":" + stable(value))
          .join(",") +
        "}"
      );
    return JSON.stringify(v);
  };
  return stable(a) === stable(b);
}
