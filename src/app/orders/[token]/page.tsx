import type { Metadata } from "next";
import { OrderTracking } from "@/components/order-tracking";
export const metadata: Metadata = {
  title: "Your order — Talix",
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <OrderTracking token={token} />;
}
