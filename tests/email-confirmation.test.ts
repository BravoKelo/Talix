import { afterEach, expect, test, vi } from "vitest";
import { emailConfirmationPending } from "../src/lib/email-confirmation";

afterEach(() => vi.unstubAllEnvs());
test("deferred email step requires explicit configuration and cannot be enabled on Vercel production", () => {
  vi.stubEnv("TALIX_EMAIL_CONFIRMATION_PENDING", "");
  vi.stubEnv("VERCEL_ENV", "preview");
  expect(emailConfirmationPending()).toBe(false);
  vi.stubEnv("TALIX_EMAIL_CONFIRMATION_PENDING", "true");
  expect(emailConfirmationPending()).toBe(true);
  vi.stubEnv("VERCEL_ENV", "production");
  expect(emailConfirmationPending()).toBe(false);
});
