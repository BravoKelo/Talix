export type BusinessType = {
  id: string;
  name: string;
  description: string;
  active: boolean;
};
export type Offering = {
  id: string;
  business_type_id: string | null;
  kind: "plan" | "addon";
  name: string;
  description: string;
  price_cents: number;
  billing_interval: "month" | "year";
  active: boolean;
};
export type BusinessDetails = {
  business_name: string;
  contact_name: string;
  phone: string;
  billing_address: string;
  location_name: string;
  location_address: string;
  slug: string;
};
export type Quote = {
  business_type: { id: string; name: string };
  items: Pick<
    Offering,
    "id" | "kind" | "name" | "description" | "price_cents"
  >[];
  total_cents: number;
  billing_interval: "month" | "year";
  currency: "USD";
  sample: true;
};
export type Draft = {
  business: BusinessDetails;
  businessType: string;
  plan: string;
  addons: string[];
  request: string;
  quote: Quote;
};
export const emptyBusiness: BusinessDetails = {
  business_name: "",
  contact_name: "",
  phone: "",
  billing_address: "",
  location_name: "",
  location_address: "",
  slug: "",
};
// User metadata is only resumable form input. It never grants access or controls prices.
export function readDraft(value: unknown): Draft | null {
  if (!value || typeof value !== "object") return null;
  const d = value as Draft;
  if (
    !d.business ||
    Object.keys(emptyBusiness).some(
      (k) => typeof d.business[k as keyof BusinessDetails] !== "string",
    ) ||
    typeof d.businessType !== "string" ||
    typeof d.plan !== "string" ||
    !Array.isArray(d.addons) ||
    d.addons.some((a) => typeof a !== "string") ||
    typeof d.request !== "string" ||
    !/^[a-f0-9-]{36}$/.test(d.request) ||
    !d.quote ||
    !Array.isArray(d.quote.items)
  )
    return null;
  return d;
}
export function accountMessage(code?: string) {
  if (code === "email_exists" || code === "user_already_exists")
    return "This email is already registered. Please sign in.";
  if (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit"
  )
    return "Please wait a little before trying again.";
  if (code === "weak_password")
    return "Please choose a stronger password with at least 12 characters.";
  if (code === "email_address_invalid")
    return "Please check your email address.";
  if (code === "email_not_confirmed")
    return "Please confirm your email before signing in.";
  return "We couldn’t complete that request. Please try again shortly.";
}
