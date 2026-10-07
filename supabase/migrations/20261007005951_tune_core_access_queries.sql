-- Advisor-observed improvements; permission semantics remain unchanged.
alter policy own_client on public.clients using (owner_id = (select auth.uid()));
alter policy member_subscription on public.subscriptions using (exists (select 1 from public.memberships where subscription_id = subscriptions.id and user_id = (select auth.uid())));
alter policy own_membership on public.memberships using (user_id = (select auth.uid()) or private.is_owner(subscription_id));
alter policy readable_access on public.location_access using (user_id = (select auth.uid()) or private.can_access(location_id));
create index products_location_subscription on public.products(location_id, subscription_id);
create index orders_location_subscription on public.orders(location_id, subscription_id);
