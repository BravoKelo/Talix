-- Roles are subscription-owned; location assignments are independent.
create table public.business_roles(
 id uuid primary key default gen_random_uuid(), subscription_id uuid not null references public.subscriptions(id),
 name text not null check(length(trim(name)) between 2 and 60), permissions jsonb not null default '[]', predefined boolean not null default false,
 unique(subscription_id,name), unique(subscription_id,id),
 check(jsonb_typeof(permissions)='array' and permissions <@ '["orders.view","orders.fulfill","orders.refund","products.view","products.manage","settings.view","settings.manage","users.view","users.manage"]'::jsonb),
 check(not (permissions ? 'orders.fulfill' or permissions ? 'orders.refund') or permissions ? 'orders.view'),
 check(not permissions ? 'products.manage' or permissions ? 'products.view'),
 check(not permissions ? 'settings.manage' or permissions ? 'settings.view'),
 check(not permissions ? 'users.manage' or permissions ? 'users.view')
);
alter table public.business_roles enable row level security;
alter table public.memberships add column role_id uuid;
alter table public.memberships add constraint membership_business_role foreign key(subscription_id,role_id) references public.business_roles(subscription_id,id);
alter table public.location_access add column role_id uuid references public.business_roles(id);
create index memberships_role on public.memberships(role_id);
create index location_access_role on public.location_access(role_id);
create function private.seed_business_roles(s uuid) returns void language sql security definer set search_path='' as $$
 insert into public.business_roles(subscription_id,name,permissions,predefined) values
 (s,'Manager','["orders.view","orders.fulfill","orders.refund","products.view","products.manage","settings.view","settings.manage","users.view","users.manage"]',true),
 (s,'Supervisor','["orders.view","orders.fulfill","orders.refund","products.view","users.view"]',true),
 (s,'Lead','["orders.view","orders.fulfill","products.view"]',true),
 (s,'Fulfillment','["orders.view","orders.fulfill","products.view"]',true),
 (s,'Viewer','["orders.view","products.view"]',true) on conflict do nothing;
$$;
select private.seed_business_roles(id) from public.subscriptions;
create function private.seed_subscription_roles() returns trigger language plpgsql security definer set search_path='' as $$begin perform private.seed_business_roles(new.id); return new; end$$;
create trigger seed_subscription_roles after insert on public.subscriptions for each row execute function private.seed_subscription_roles();
-- Existing assignments preserve exactly their old read/fulfillment privileges.
update public.location_access a set role_id=r.id from public.locations l,public.business_roles r where a.location_id=l.id and r.subscription_id=l.subscription_id and r.name=case a.role when 'fulfillment' then 'Fulfillment' else 'Viewer' end;
create function private.validate_location_role() returns trigger language plpgsql security definer set search_path='' as $$declare s uuid; begin
 select subscription_id into s from public.locations where id=new.location_id;
 if new.role_id is null or (tg_op='UPDATE' and new.role<>old.role and new.role_id is not distinct from old.role_id) then
 select id into new.role_id from public.business_roles where subscription_id=s and name=case new.role when 'fulfillment' then 'Fulfillment' else 'Viewer' end;
 end if;
 if not exists(select 1 from public.business_roles where id=new.role_id and subscription_id=s) then raise exception 'Choose a role from this location subscription.'; end if;
 return new;
end$$;
create trigger validate_location_role before insert or update on public.location_access for each row execute function private.validate_location_role();
revoke all on function private.validate_location_role() from public,anon,authenticated;
create function private.allowed(s uuid,l uuid,p text) returns boolean language sql stable security definer set search_path='' as $$
 select private.is_owner(s) or exists(
 select 1 from public.memberships m join public.business_roles r on r.id=case when l is null then m.role_id else (select a.role_id from public.location_access a join public.locations x on x.id=a.location_id where a.user_id=m.user_id and a.location_id=l and x.subscription_id=s) end
 where m.user_id=auth.uid() and m.subscription_id=s and r.subscription_id=s and r.permissions ? p);
$$;
create or replace function private.can_access(l uuid,write_access boolean default false) returns boolean language sql stable security definer set search_path='' as $$
 select private.allowed(x.subscription_id,l,case when write_access then 'orders.fulfill' else 'orders.view' end) from public.locations x where x.id=l;
$$;
create function public.workspace_permissions(p_subscription uuid,p_location uuid default null) returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(p),'[]') from unnest(array['orders.view','orders.fulfill','orders.refund','products.view','products.manage','settings.view','settings.manage','users.view','users.manage']) p where private.allowed(p_subscription,p_location,p);
$$;
create policy readable_business_roles on public.business_roles for select to authenticated using(exists(select 1 from public.memberships where subscription_id=business_roles.subscription_id and user_id=(select auth.uid())));
revoke all on public.business_roles from public,anon,authenticated;
grant select on public.business_roles to authenticated;
create function public.list_business_users(p_subscription uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$begin
 if not private.allowed(p_subscription,null,'users.view') then raise exception 'You do not have permission to view users.'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',m.user_id,'email',u.email,'owner',m.role='owner','role_id',m.role_id,'locations',coalesce((select jsonb_agg(jsonb_build_object('id',a.location_id,'role_id',a.role_id)) from public.location_access a join public.locations l on l.id=a.location_id where a.user_id=m.user_id and l.subscription_id=p_subscription),'[]'::jsonb)) order by (m.role='owner') desc,u.email) from public.memberships m join auth.users u on u.id=m.user_id where m.subscription_id=p_subscription),'[]'::jsonb);
end$$;
create function public.save_business_role(p_subscription uuid,p_id uuid,p_name text,p_permissions jsonb) returns uuid language plpgsql security definer set search_path='' as $$declare result uuid; actor jsonb; begin
 perform pg_advisory_xact_lock(hashtextextended('users:'||p_subscription,0));
 if not private.allowed(p_subscription,null,'users.manage') then raise exception 'You do not have permission to manage roles.'; end if;
 if lower(trim(p_name)) in ('owner','manager','supervisor','lead','fulfillment','viewer') then raise exception 'Choose a different name for your custom role.'; end if;
 actor=public.workspace_permissions(p_subscription,null);
 if not private.is_owner(p_subscription) and not p_permissions <@ actor then raise exception 'You cannot grant permissions you do not have.'; end if;
 if p_id is null then insert into public.business_roles(subscription_id,name,permissions) values(p_subscription,trim(p_name),p_permissions) returning id into result;
 else
 if exists(select 1 from public.memberships where user_id=auth.uid() and role_id=p_id) or exists(select 1 from public.location_access where user_id=auth.uid() and role_id=p_id) then
 if not private.is_owner(p_subscription) then raise exception 'You cannot edit your own role.'; end if; end if;
 -- A manager may not modify an existing role that exceeds their subscription authority.
 if not private.is_owner(p_subscription) and exists(select 1 from public.business_roles where id=p_id and not permissions <@ actor) then raise exception 'Owner permission is required to edit this role.'; end if;
 if not private.is_owner(p_subscription) and exists(select 1 from public.location_access a join public.locations l on l.id=a.location_id where a.role_id=p_id and (not p_permissions <@ public.workspace_permissions(p_subscription,l.id) or not (select permissions from public.business_roles where id=p_id) <@ public.workspace_permissions(p_subscription,l.id))) then raise exception 'Owner permission is required to change this role at those locations.'; end if;
 update public.business_roles set name=trim(p_name),permissions=p_permissions where id=p_id and subscription_id=p_subscription and not predefined returning id into result;
 if result is null then raise exception 'This custom role could not be updated.'; end if;
 end if; return result;
end$$;
create function public.save_business_user(p_subscription uuid,p_email text,p_role uuid,p_locations jsonb,p_remove boolean default false) returns void language plpgsql security definer set search_path='' as $$declare u uuid; entry jsonb; loc uuid; rid uuid; perms jsonb; begin
 perform pg_advisory_xact_lock(hashtextextended('users:'||p_subscription,0));
 if not private.allowed(p_subscription,null,'users.manage') then raise exception 'You do not have permission to manage users.'; end if;
 select id into u from auth.users where lower(email)=lower(trim(p_email));
 if u is null then raise exception 'This person needs a Talix account before you can add them.'; end if;
 if exists(select 1 from public.memberships where subscription_id=p_subscription and user_id=u and role='owner') then raise exception 'The owner account cannot be changed here.'; end if;
 if u=auth.uid() then raise exception 'You cannot change your own access here.'; end if;
 if not private.is_owner(p_subscription) and exists(select 1 from public.memberships m join public.business_roles r on r.id=m.role_id where m.subscription_id=p_subscription and m.user_id=u and not r.permissions <@ public.workspace_permissions(p_subscription,null)) then raise exception 'Owner permission is required to change this user.'; end if;
 if not private.is_owner(p_subscription) and exists(select 1 from public.location_access a join public.locations l on l.id=a.location_id join public.business_roles r on r.id=a.role_id where a.user_id=u and l.subscription_id=p_subscription and not r.permissions <@ public.workspace_permissions(p_subscription,l.id)) then raise exception 'Owner permission is required to change these location assignments.'; end if;
 if p_remove then
 delete from public.location_access where user_id=u and location_id in(select id from public.locations where subscription_id=p_subscription);
 delete from public.memberships where user_id=u and subscription_id=p_subscription; return;
 end if;
 select permissions into perms from public.business_roles where id=p_role and subscription_id=p_subscription;
 if perms is null then raise exception 'Choose a role from this subscription.'; end if;
 if not private.is_owner(p_subscription) and not perms <@ public.workspace_permissions(p_subscription,null) then raise exception 'You cannot grant permissions you do not have.'; end if;
 if jsonb_typeof(p_locations)<>'array' or p_locations is null or jsonb_array_length(p_locations)>200 then raise exception 'Please check the location assignments.'; end if;
 -- Validate every assignment before changing any existing access.
 for entry in select * from jsonb_array_elements(p_locations) loop
 loc=(entry->>'id')::uuid; rid=(entry->>'role_id')::uuid;
 if not exists(select 1 from public.locations where id=loc and subscription_id=p_subscription) then raise exception 'Choose a location from this subscription.'; end if;
 select permissions into perms from public.business_roles where id=rid and subscription_id=p_subscription;
 if perms is null then raise exception 'Choose a role from this subscription.'; end if;
 if not private.is_owner(p_subscription) and not perms <@ public.workspace_permissions(p_subscription,loc) then raise exception 'You cannot grant location permissions you do not have.'; end if;
 end loop;
 -- Prevent managers from removing/changing location assignments beyond their authority.
 if not private.is_owner(p_subscription) and exists(select 1 from public.location_access a join public.locations l on l.id=a.location_id join public.business_roles r on r.id=a.role_id where a.user_id=u and l.subscription_id=p_subscription and not r.permissions <@ public.workspace_permissions(p_subscription,l.id)) then raise exception 'Owner permission is required to change these location assignments.'; end if;
 insert into public.memberships(subscription_id,user_id,role,role_id) values(p_subscription,u,'employee',p_role) on conflict(subscription_id,user_id) do update set role_id=excluded.role_id;
 delete from public.location_access where user_id=u and location_id in(select id from public.locations where subscription_id=p_subscription);
 for entry in select * from jsonb_array_elements(p_locations) loop
 insert into public.location_access(location_id,user_id,role,role_id) values((entry->>'id')::uuid,u,'viewer',(entry->>'role_id')::uuid);
 end loop;
end$$;
-- Read each area only when the appropriate location role permits it.
drop policy readable_location on public.locations;
create policy readable_location on public.locations for select to authenticated using(private.is_owner(subscription_id) or exists(select 1 from public.location_access a where a.location_id=locations.id and a.user_id=(select auth.uid())) or private.allowed(subscription_id,null,'users.view') or private.allowed(subscription_id,null,'settings.view'));
drop policy readable_product on public.products;
create policy readable_product on public.products for select to authenticated using(private.is_owner(subscription_id) or (location_id is not null and private.allowed(subscription_id,location_id,'products.view')) or (location_id is null and exists(select 1 from public.locations l where l.subscription_id=products.subscription_id and private.allowed(products.subscription_id,l.id,'products.view'))));
drop policy create_product on public.products;
drop policy edit_product on public.products;
create policy create_product on public.products for insert to authenticated with check(private.allowed(subscription_id,location_id,'products.manage'));
create policy edit_product on public.products for update to authenticated using(private.allowed(subscription_id,location_id,'products.manage')) with check(private.allowed(subscription_id,location_id,'products.manage'));
drop policy edit_location on public.locations;
create policy edit_location on public.locations for update to authenticated using(private.allowed(subscription_id,id,'settings.manage')) with check(private.allowed(subscription_id,id,'settings.manage'));
drop policy create_location on public.locations;
create policy create_location on public.locations for insert to authenticated with check(private.allowed(subscription_id,null,'settings.manage'));
drop policy owner_subscription on public.subscriptions;
create policy owner_subscription on public.subscriptions for update to authenticated using(private.allowed(id,null,'settings.manage')) with check(private.allowed(id,null,'settings.manage'));
drop policy own_membership on public.memberships;
create policy own_membership on public.memberships for select to authenticated using(user_id=(select auth.uid()) or private.allowed(subscription_id,null,'users.view') or private.allowed(subscription_id,null,'settings.view'));
drop policy product_image_upload on storage.objects;
create policy product_image_upload on storage.objects for insert to authenticated with check(bucket_id='product-images' and exists(select 1 from public.subscriptions s where s.id::text=(storage.foldername(storage.objects.name))[1] and (private.allowed(s.id,null,'products.manage') or exists(select 1 from public.locations l where l.subscription_id=s.id and private.allowed(s.id,l.id,'products.manage')))));
revoke all on function private.seed_business_roles(uuid),private.seed_subscription_roles(),private.allowed(uuid,uuid,text) from public,anon,authenticated;
grant execute on function private.allowed(uuid,uuid,text) to authenticated;
revoke all on function public.workspace_permissions(uuid,uuid),public.list_business_users(uuid),public.save_business_role(uuid,uuid,text,jsonb),public.save_business_user(uuid,text,uuid,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.workspace_permissions(uuid,uuid),public.list_business_users(uuid),public.save_business_role(uuid,uuid,text,jsonb),public.save_business_user(uuid,text,uuid,jsonb,boolean) to authenticated;

create or replace function public.refund_simulated(p_order uuid,p_request uuid,p_amount integer,p_reason text) returns void language plpgsql security definer set search_path='' as $$declare o public.orders;
e public.payment_events;
begin select * into o from public.orders where id=p_order for update;
if not found or not private.allowed(o.subscription_id,o.location_id,'orders.refund') then raise exception 'Refund permission required';
end if;
if p_request is null or p_amount is null or p_amount<=0 or coalesce(length(trim(p_reason)),0) not between 1 and 500 then raise exception 'Amount and reason required';
end if;
select * into e from public.payment_events where request_id=p_request;
if found then if e.order_id<>o.id or e.kind<>'refund' or e.amount_cents<>p_amount or e.reason<>trim(p_reason) then raise exception 'Request already used';
end if;
return;
end if;
if o.payment_status not in ('paid','partially_refunded') or p_amount>o.total_cents-o.refunded_cents then raise exception 'Refund exceeds remaining payment';
end if;
insert into public.payment_events(order_id,request_id,kind,amount_cents,reason) values(o.id,p_request,'refund',p_amount,trim(p_reason));
update public.orders set refunded_cents=refunded_cents+p_amount,payment_status=case when refunded_cents+p_amount=total_cents then 'refunded' else 'partially_refunded' end,status=case when refunded_cents+p_amount=total_cents and status<>'completed' then 'cancelled' else status end where id=o.id;
if o.refunded_cents+p_amount=o.total_cents and o.status<>'completed' then
  insert into public.order_events(order_id,status,actor) values(o.id,'cancelled',auth.uid());
end if;
end$$;


create or replace function public.start_subscription(p_request uuid,p_business jsonb,p_type uuid,p_plan uuid,p_addons uuid[],p_quote jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid=auth.uid(); c uuid; s uuid; payload jsonb; existing public.subscription_purchases; quote jsonb; email text; k text; base_slug text; store_slug text; suffix integer=1;
begin
 if u is null or not exists(select 1 from auth.users where id=u and email_confirmed_at is not null) then raise exception 'Please confirm your email and sign in to continue.'; end if;
 if p_request is null or p_business is null or jsonb_typeof(p_business)<>'object' or octet_length(p_business::text)>10000 or p_quote is null then raise exception 'Please review your business details and selection.'; end if;
 -- Serialize a client creation and repeat-confirmation, including across browser tabs.
 perform pg_advisory_xact_lock(hashtextextended(u::text,0));
 payload=jsonb_build_object('business',p_business,'type',p_type,'plan',p_plan,'addons',to_jsonb(p_addons),'quote',p_quote);
 select * into existing from public.subscription_purchases where request_id=p_request;
 if found then
 if not exists(select 1 from public.clients where id=existing.client_id and owner_id=u) or existing.request_payload<>payload then raise exception 'This confirmation was already used for a different selection.'; end if;
 return existing.subscription_id;
 end if;
 for k in select unnest(array['business_name','contact_name','phone','billing_address','location_name','location_address']) loop
 if coalesce(length(trim(p_business->>k)),0) not between 1 and (case when k like '%address' then 500 when k='phone' then 40 else 100 end) then raise exception 'Please complete your business and contact details.'; end if;
 end loop;

 -- New purchases require canonical contact details; existing purchase retries above remain valid.
 if p_business->>'phone' !~ '^\+[1-9][0-9]{6,14}$' then raise exception 'Enter a phone number with a country code.'; end if;
 if length(trim(p_business->>'contact_name')) < 2 or p_business->>'contact_name' ~ '[0-9[:cntrl:]]' or p_business->>'contact_name' !~ '[[:alpha:]]' then raise exception 'Enter a valid contact name.'; end if;
 for k in select unnest(array['billing_address','location_address']) loop
 if p_business->>k !~ '^[^,[:cntrl:]]{3,}, [^,[:cntrl:]]{2,}, [^,[:cntrl:]]+, [A-Z0-9][A-Z0-9 -]{1,15}, [^,[:cntrl:]]{2,}$' then
 if k='billing_address' then raise exception 'Please complete your billing address using the separate address fields.';
 else raise exception 'Please complete your location address using the separate address fields.'; end if;
 end if;
 end loop;
 quote=public.subscription_quote(p_type,p_plan,p_addons);
 if quote<>p_quote then raise exception 'Your selection has changed. Please review the latest price before continuing.'; end if;
 select auth.users.email into email from auth.users where id=u;
 insert into public.clients(owner_id,contact_name,business_name,contact_email,phone,billing_address) values(u,trim(p_business->>'contact_name'),trim(p_business->>'business_name'),email,trim(p_business->>'phone'),trim(p_business->>'billing_address')) on conflict(owner_id) do update set contact_name=excluded.contact_name,business_name=excluded.business_name,contact_email=excluded.contact_email,phone=excluded.phone,billing_address=excluded.billing_address returning id into c;
 -- Allocation is server-owned and serialized across owners with the same business name.
 base_slug=left(trim(both '-' from regexp_replace(lower(p_business->>'business_name'),'[^a-z0-9]+','-','g')),50);
 if length(base_slug)<3 then base_slug='store'; end if;
 perform pg_advisory_xact_lock(hashtextextended('ordering-address:'||base_slug,0));
 store_slug=base_slug;
 while exists(select 1 from public.subscriptions where slug=store_slug) loop
 suffix=suffix+1; store_slug=base_slug||'-'||suffix::text;
 end loop;
 insert into public.subscriptions(client_id,name,slug,business_type_id) values(c,trim(p_business->>'business_name'),store_slug,p_type) returning id into s;
 insert into public.memberships(subscription_id,user_id,role) values(s,u,'owner');
 insert into public.locations(subscription_id,name,address,phone) values(s,trim(p_business->>'location_name'),trim(p_business->>'location_address'),trim(p_business->>'phone'));
 insert into public.subscription_purchases(subscription_id,client_id,request_id,request_payload,selection,business_details,total_cents,billing_interval) values(s,c,p_request,payload,quote,p_business,(quote->>'total_cents')::bigint,quote->>'billing_interval');
 return s;
end$$;


create or replace function public.grant_location_access(p_location uuid,p_email text,p_role text) returns void language plpgsql security definer set search_path='' as $$declare s uuid;
u uuid;
begin select subscription_id into s from public.locations where id=p_location;
if not coalesce(private.is_owner(s),false) then raise exception 'Owner access required';
end if;
select id into u from auth.users where lower(email)=lower(trim(p_email));
if u is null then raise exception 'Create this user in Supabase Auth first';
end if;
insert into public.memberships(subscription_id,user_id,role) values(s,u,'employee') on conflict do nothing;
if p_role='none' then delete from public.location_access where location_id=p_location and user_id=u;
else insert into public.location_access(location_id,user_id,role) values(p_location,u,p_role) on conflict(location_id,user_id) do update set role=excluded.role;
end if;
end$$;


create or replace function public.create_workspace(p_name text,p_slug text,p_location text) returns uuid language plpgsql security definer set search_path='' as $$declare c uuid;
s uuid;
begin if auth.uid() is null then raise exception 'Sign in required';
end if;
perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,1));
select id into c from public.clients where owner_id=auth.uid();
if c is null then insert into public.clients(owner_id) values(auth.uid()) returning id into c;
end if;
insert into public.subscriptions(client_id,name,slug) values(c,p_name,p_slug) returning id into s;
insert into public.memberships(subscription_id,user_id,role) values(s,auth.uid(),'owner');
insert into public.locations(subscription_id,name) values(s,p_location);
return s;
end$$;

