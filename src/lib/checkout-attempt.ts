import type { CartLine } from "./types";

export type CheckoutAttempt = {
  p_request: string;
  p_location: string;
  p_customer: { name: string; email: string; phone: string };
  p_lines: CartLine[];
  p_outcome: string;
};

// These exact P0001 errors precede writes. Invalid simulation cannot commit on
// any replay of the same immutable payload; the other validations follow the
// existing-order lookup. Generic HTTP/network errors and key conflicts cannot
// prove there is no committed order.
const draftRejections = new Set([
  "Invalid simulated payment",
  "Location unavailable",
  "Name, email and phone are required",
  "Invalid cart",
  "Invalid quantity",
  "Product unavailable",
  "Invalid options",
  "Unknown product option",
  "Order too large",
  "Order total must be positive",
]);

export function checkoutDraftRejection(
  error: { code?: string; message?: string },
  status: number,
): string | null {
  return status === 400 &&
    error.code === "P0001" &&
    typeof error.message === "string" &&
    draftRejections.has(error.message)
    ? error.message
    : null;
}

export function checkoutResultToken(data: unknown): string | null {
  if (!data || typeof data !== "object" || !("token" in data)) return null;
  return typeof data.token === "string" &&
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
      data.token,
    )
    ? data.token
    : null;
}
