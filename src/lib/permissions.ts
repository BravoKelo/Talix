export const permissions = [
  ["orders.view", "View orders"],
  ["orders.fulfill", "Update order status"],
  ["orders.refund", "Refund orders"],
  ["products.view", "View products"],
  ["products.manage", "Add and edit products"],
  ["settings.view", "View settings"],
  ["settings.manage", "Change settings"],
  ["users.view", "View users"],
  ["users.manage", "Manage users and roles"],
] as const;
export type Permission = (typeof permissions)[number][0];
export type BusinessRole = {
  id: string;
  name: string;
  permissions: Permission[];
  predefined: boolean;
};
