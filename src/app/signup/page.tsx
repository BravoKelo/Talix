import { Onboarding } from "@/components/onboarding";
import { configured } from "@/lib/supabase/client";
import { serverClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (configured()) {
    const db = await serverClient();
    const { data } = await db.auth.getClaims();
    if (data?.claims) redirect("/workspace");
  }
  return <Onboarding />;
}
