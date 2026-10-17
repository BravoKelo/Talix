import type { StorefrontDesign } from "./storefront-design";
export type Option = { id: string; name: string; price_cents: number };
export type Product = {
  id: string;
  subscription_id: string;
  location_id: string | null;
  category?: string;
  name: string;
  description: string;
  price_cents: number;
  image_url: string | null;
  available: boolean;
  options: Option[];
};
export type Location = {
  id: string;
  subscription_id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  published: boolean;
};
export type Subscription = Partial<StorefrontDesign> & {
  id: string;
  client_id: string;
  name: string;
  slug: string;
  accent: string;
  logo_url?: string | null;
  header_photo_url?: string | null;
  default_location_id?: string | null;
  description: string;
};
export type CartLine = {
  product_id: string;
  quantity: number;
  option_ids: string[];
};
export type Order = {
  order_number?: number;
  id: string;
  location_id: string;
  subscription_id: string;
  total_cents: number;
  payment_status: string;
  refunded_cents: number;
  status: string;
  customer_name: string;
  email: string;
  phone: string;
  items: {
    name: string;
    quantity: number;
    unit_cents: number;
    options: Option[];
  }[];
  created_at: string;
};
export type PublicOrder = Pick<
  Order,
  | "id"
  | "order_number"
  | "total_cents"
  | "payment_status"
  | "refunded_cents"
  | "status"
  | "items"
  | "created_at"
> & { location_name: string; business_name: string };
export type Catalog = {
  subscription: Subscription;
  locations: Location[];
  products: Product[];
};
export function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
export function cents(value: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(value))
    throw new Error("Enter an amount with at most two decimal places.");
  const n = Math.round(Number(value) * 100);
  if (!Number.isSafeInteger(n) || n > 100000000)
    throw new Error("Amount is too large.");
  return n;
}

export function orderReference(order: { order_number?: number }) {
  return order.order_number ? String(order.order_number) : "Pending number";
}
