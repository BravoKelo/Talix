import { redirect } from "next/navigation";
import { configured } from "@/lib/supabase/client";
import { serverClient } from "@/lib/supabase/server";
import { Workspace } from "@/components/workspace";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (!configured())
    return (
      <main className="narrow">
        <h1>Connect Talix</h1>
        <p>
          The existing Talix Supabase project is not connected to this
          deployment yet. No demo login or local-only data is substituted.
        </p>
      </main>
    );
  const db = await serverClient();
  const { data, error } = await db.auth.getClaims();
  if (error || !data?.claims) redirect("/login");
  return (
    <Workspace
      userId={data.claims.sub}
      email={String(data.claims.email ?? "")}
    />
  );
}
