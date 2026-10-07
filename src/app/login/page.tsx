import { Login } from "@/components/login";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; confirmation?: string }>;
}) {
  const params = await searchParams;
  const next =
    params.next === "admin" || params.next === "onboarding"
      ? params.next
      : "workspace";
  return (
    <main className="narrow">
      <p className="eyebrow">BUSINESS ACCESS</p>
      <h1>Welcome to Talix.</h1>
      <p>Sign in to manage your business and its orders.</p>
      <Login
        next={next}
        confirmationFailed={params.confirmation === "failed"}
      />
    </main>
  );
}
