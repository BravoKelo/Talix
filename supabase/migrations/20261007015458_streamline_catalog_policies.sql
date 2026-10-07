-- Advisor-observed redundant SELECT policies. Preserve public/staff access semantics.
drop policy available_types on public.business_types;
drop policy admin_types on public.business_types;
create policy available_types on public.business_types for select to anon using(active);
create policy member_types on public.business_types for select to authenticated using(active or (select private.is_talix_admin()));
create policy admin_type_insert on public.business_types for insert to authenticated with check((select private.is_talix_admin()));
create policy admin_type_update on public.business_types for update to authenticated using((select private.is_talix_admin())) with check((select private.is_talix_admin()));
drop policy available_offerings on public.talix_offerings;
drop policy admin_offerings on public.talix_offerings;
create policy available_offerings on public.talix_offerings for select to anon using(active and (business_type_id is null or exists(select 1 from public.business_types t where t.id=business_type_id and t.active)));
create policy member_offerings on public.talix_offerings for select to authenticated using((active and (business_type_id is null or exists(select 1 from public.business_types t where t.id=business_type_id and t.active))) or (select private.is_talix_admin()));
create policy admin_offering_insert on public.talix_offerings for insert to authenticated with check((select private.is_talix_admin()));
create policy admin_offering_update on public.talix_offerings for update to authenticated using((select private.is_talix_admin())) with check((select private.is_talix_admin()));
drop policy admin_client_read on public.clients;
alter policy own_client on public.clients using(owner_id=(select auth.uid()) or (select private.is_talix_admin()));
