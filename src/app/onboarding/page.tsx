import { redirect } from "next/navigation";
import { serverClient } from "@/lib/supabase/server";
import { configured } from "@/lib/supabase/client";
import { readDraft } from "@/lib/onboarding";
import { Onboarding } from "@/components/onboarding";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; edit?: string; review?: string }>;
}) {
  if (!configured())
    return (
      <main className="narrow">
        <h1>Please check back soon.</h1>
        <p>Signup is temporarily unavailable.</p>
      </main>
    );
  const db = await serverClient();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) redirect("/login?next=onboarding");
  const params = await searchParams;
  const fresh = params.new === "1";
  const draft = fresh ? null : readDraft(user.user_metadata?.talix_onboarding);
  if (draft && !params.edit && !params.review) redirect("/signup/confirmation");
  return (
    <Onboarding
      email={user.email ?? ""}
      draft={draft}
      edit={params.edit === "1"}
    />
  );
}
