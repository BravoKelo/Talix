import { Onboarding } from "@/components/onboarding";
import { configured } from "@/lib/supabase/client";
import { serverClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { emailConfirmationPending } from "@/lib/email-confirmation";
import { readDraft } from "@/lib/onboarding";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (configured()) {
    const db = await serverClient();
    const {
      data: { user },
    } = await db.auth.getUser();
    if (user)
      redirect(
        readDraft(user.user_metadata?.talix_onboarding)
          ? emailConfirmationPending()
            ? "/signup/confirmation"
            : "/onboarding"
          : "/workspace",
      );
  }
  return <Onboarding confirmationPending={emailConfirmationPending()} />;
}
