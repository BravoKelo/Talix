import { redirect } from "next/navigation";
import { configured } from "@/lib/supabase/client";
import { serverClient } from "@/lib/supabase/server";
import { Workspace } from "@/components/workspace";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (!configured())
    return (
      <main className="narrow">
        <h1>Please check back soon.</h1>
        <p>
          Your workspace is temporarily unavailable. Please try again shortly.
        </p>
      </main>
    );
  const db = await serverClient();
  const { data, error } = await db.auth.getUser();
  if (error || !data?.user) redirect("/login");
  const membership = await db
    .from("memberships")
    .select("subscription_id")
    .eq("user_id", data.user.id)
    .limit(1);
  if (!membership.error && !membership.data?.length) redirect("/onboarding");
  return (
    <Workspace userId={data.user.id} email={String(data.user.email ?? "")} />
  );
}
