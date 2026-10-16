import { Login } from "@/components/login";
export default function Page() {
  return (
    <main className="narrow">
      <p className="eyebrow">BUSINESS ACCESS</p>
      <h1>Welcome to Talix.</h1>
      <p>Sign in to manage your business and its orders.</p>
      <Login />
    </main>
  );
}
