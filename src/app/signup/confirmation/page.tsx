import Link from "next/link";
import { redirect } from "next/navigation";
import { emailConfirmationPending } from "@/lib/email-confirmation";
import { readDraft } from "@/lib/onboarding";
import { serverClient } from "@/lib/supabase/server";
import { configured } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
export default async function Page() {
  if (!emailConfirmationPending()) redirect("/onboarding");
  if (!configured()) redirect("/signup");
  const {
    data: { user },
  } = await (await serverClient()).auth.getUser();
  if (!user) redirect("/login?next=onboarding");
  if (!readDraft(user.user_metadata?.talix_onboarding)) redirect("/workspace");
  return (
    <main className="narrow">
      <p className="eyebrow">WELCOME TO TALIX</p>
      <h1>Thanks for signing up.</h1>
      <div className="panel stack">
        <p>
          Email confirmation sent to: <strong>{user.email}</strong>
        </p>
        <p>(Feature coming soon)</p>
        <p>
          Your business details and selection are saved. Continue to review your
          subscription and finish setting up your business.
        </p>
        <Link className="button" href="/onboarding">
          Continue →
        </Link>
      </div>
    </main>
  );
}
