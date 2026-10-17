import { configured } from "@/lib/supabase/client";
import { serverClient } from "@/lib/supabase/server";
import { Storefront } from "@/components/storefront";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = configured()
    ? (await (await serverClient()).auth.getUser()).data.user
    : null;
  return <Storefront slug={slug} signedIn={!!user} />;
}
