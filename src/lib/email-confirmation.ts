// Server-only configuration. Never enable deferred verification in production.
export function emailConfirmationPending() {
  return (
    process.env.TALIX_EMAIL_CONFIRMATION_PENDING === "true" &&
    process.env.VERCEL_ENV !== "production"
  );
}
