import { redirect } from "next/navigation";
import { serverClient } from "@/lib/supabase/server";
import { configured } from "@/lib/supabase/client";
import { TalixAdmin } from "@/components/talix-admin";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (!configured())
    return (
      <main className="narrow">
        <h1>Please check back soon.</h1>
      </main>
    );
  const db = await serverClient();
  const { data, error } = await db.auth.getUser();
  if (error || !data?.user) redirect("/login?next=admin");
  const access = await db.rpc("talix_admin_access");
  if (access.error || !access.data)
    return (
      <main className="narrow">
        <h1>Talix staff access only.</h1>
        <p>
          This area is available to the Talix team. Your business tools are in
          your workspace.
        </p>
        <a href="/workspace">Open your workspace</a>
      </main>
    );
  return <TalixAdmin />;
}
