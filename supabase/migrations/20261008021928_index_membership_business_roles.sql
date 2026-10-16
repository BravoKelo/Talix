create index membership_business_role_reference on public.memberships(subscription_id, role_id);
drop index public.memberships_role;
