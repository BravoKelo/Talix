-- Approved customer signup/catalog scope, Issue #3. Sample offerings, no real billing.
create table private.talix_admins(user_id uuid primary key references auth.users(id));
alter table private.talix_admins enable row level security;
revoke all on private.talix_admins from public,anon,authenticated;
create function private.is_talix_admin() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from private.talix_admins where user_id=auth.uid())$$;
revoke all on function private.is_talix_admin() from public,anon,authenticated;
grant execute on function private.is_talix_admin() to authenticated;
create function public.talix_admin_access() returns boolean language sql stable security invoker set search_path='' as $$select private.is_talix_admin()$$;
revoke all on function public.talix_admin_access() from public,anon;
grant execute on function public.talix_admin_access() to authenticated;

create table public.business_types(id uuid primary key default gen_random_uuid(),name text not null unique check(length(trim(name)) between 1 and 100),description text not null default '' check(length(description)<=1000),active boolean not null default true);
create table public.talix_offerings(id uuid primary key default gen_random_uuid(),business_type_id uuid references public.business_types(id),kind text not null check(kind in('plan','addon')),name text not null check(length(trim(name)) between 1 and 100),description text not null default '' check(length(description)<=1000),price_cents integer not null check(price_cents between 0 and 100000000),billing_interval text not null check(billing_interval in('month','year')),active boolean not null default true,check(kind<>'plan' or business_type_id is not null));
create index talix_offerings_business_type on public.talix_offerings(business_type_id);
alter table public.business_types enable row level security;
alter table public.talix_offerings enable row level security;
revoke all on public.business_types,public.talix_offerings from public,anon,authenticated;
grant select on public.business_types,public.talix_offerings to anon,authenticated;
grant insert,update on public.business_types,public.talix_offerings to authenticated;
create policy available_types on public.business_types for select to anon,authenticated using(active);
create policy available_offerings on public.talix_offerings for select to anon,authenticated using(active and (business_type_id is null or exists(select 1 from public.business_types t where t.id=business_type_id and t.active)));
create policy admin_types on public.business_types for all to authenticated using((select private.is_talix_admin())) with check((select private.is_talix_admin()));
create policy admin_offerings on public.talix_offerings for all to authenticated using((select private.is_talix_admin())) with check((select private.is_talix_admin()));

alter table public.clients add column contact_name text not null default '' check(length(contact_name)<=100),add column business_name text not null default '' check(length(business_name)<=100),add column contact_email text not null default '' check(length(contact_email)<=254),add column phone text not null default '' check(length(phone)<=40),add column billing_address text not null default '' check(length(billing_address)<=500);
create policy admin_client_read on public.clients for select to authenticated using((select private.is_talix_admin()));
alter table public.subscriptions add column business_type_id uuid references public.business_types(id);
create index subscriptions_business_type on public.subscriptions(business_type_id);
-- Subscription identity/type may only be created by the checked purchase operation.
revoke update on public.subscriptions from authenticated;
grant update(name,slug,accent,description) on public.subscriptions to authenticated;

create table public.subscription_purchases(subscription_id uuid primary key references public.subscriptions(id),client_id uuid not null references public.clients(id),request_id uuid not null unique,request_payload jsonb not null,selection jsonb not null,business_details jsonb not null,total_cents bigint not null check(total_cents>=0),billing_interval text not null check(billing_interval in('month','year')),billing_status text not null default 'simulated' check(billing_status='simulated'),created_at timestamptz not null default now());
create index subscription_purchases_client on public.subscription_purchases(client_id);
alter table public.subscription_purchases enable row level security;
revoke all on public.subscription_purchases from public,anon,authenticated;
grant select(subscription_id,client_id,selection,business_details,total_cents,billing_interval,billing_status,created_at) on public.subscription_purchases to authenticated;
create policy purchase_owner_read on public.subscription_purchases for select to authenticated using(private.is_owner(subscription_id) or (select private.is_talix_admin()));
-- Retire the old account-creation shortcut: customer subscriptions require price review.
revoke execute on function public.create_workspace(text,text,text) from public,anon,authenticated;

create function public.subscription_quote(p_type uuid,p_plan uuid,p_addons uuid[] default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare t public.business_types; p public.talix_offerings; a public.talix_offerings; items jsonb; total bigint;
begin
 if p_type is null or p_plan is null or p_addons is null or cardinality(p_addons)>20 or cardinality(p_addons)<>(select count(distinct x) from unnest(p_addons) x) then raise exception 'Choose a business type, a plan, and each extra only once.'; end if;
 select * into t from public.business_types where id=p_type and active for share;
 if not found then raise exception 'This business type is no longer available. Please choose another.'; end if;
 select * into p from public.talix_offerings where id=p_plan and active and kind='plan' and business_type_id=t.id for share;
 if not found then raise exception 'This plan is no longer available. Please choose another.'; end if;
 items=jsonb_build_array(jsonb_build_object('id',p.id,'kind',p.kind,'name',p.name,'description',p.description,'price_cents',p.price_cents));total=p.price_cents;
 for a in select * from public.talix_offerings where id=any(p_addons) order by id for share loop
 if not a.active or a.kind<>'addon' or (a.business_type_id is not null and a.business_type_id<>t.id) or a.billing_interval<>p.billing_interval then raise exception 'An extra is no longer available with this plan. Please review your selection.'; end if;
 items=items||jsonb_build_array(jsonb_build_object('id',a.id,'kind',a.kind,'name',a.name,'description',a.description,'price_cents',a.price_cents)); total=total+a.price_cents;
 end loop;
 if jsonb_array_length(items)<>cardinality(p_addons)+1 then raise exception 'An extra is no longer available. Please review your selection.'; end if;
 return jsonb_build_object('business_type',jsonb_build_object('id',t.id,'name',t.name),'items',items,'total_cents',total,'billing_interval',p.billing_interval,'currency','USD','sample',true);
end$$;
revoke all on function public.subscription_quote(uuid,uuid,uuid[]) from public,anon,authenticated;
grant execute on function public.subscription_quote(uuid,uuid,uuid[]) to anon,authenticated;

create function public.start_subscription(p_request uuid,p_business jsonb,p_type uuid,p_plan uuid,p_addons uuid[],p_quote jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid=auth.uid(); c uuid; s uuid; payload jsonb; existing public.subscription_purchases; quote jsonb; email text; k text;
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
 if coalesce(p_business->>'slug','') !~ '^[a-z0-9][a-z0-9-]{2,62}$' then raise exception 'Use 3–63 lowercase letters, numbers or dashes for your store address.'; end if;
 quote=public.subscription_quote(p_type,p_plan,p_addons);
 if quote<>p_quote then raise exception 'Your selection has changed. Please review the latest price before continuing.'; end if;
 select auth.users.email into email from auth.users where id=u;
 insert into public.clients(owner_id,contact_name,business_name,contact_email,phone,billing_address) values(u,trim(p_business->>'contact_name'),trim(p_business->>'business_name'),email,trim(p_business->>'phone'),trim(p_business->>'billing_address')) on conflict(owner_id) do update set contact_name=excluded.contact_name,business_name=excluded.business_name,contact_email=excluded.contact_email,phone=excluded.phone,billing_address=excluded.billing_address returning id into c;
 if exists(select 1 from public.subscriptions where slug=p_business->>'slug') then raise exception 'That store address is already taken. Please choose another.'; end if;
 insert into public.subscriptions(client_id,name,slug,business_type_id) values(c,trim(p_business->>'business_name'),p_business->>'slug',p_type) returning id into s;
 insert into public.memberships values(s,u,'owner');
 insert into public.locations(subscription_id,name,address,phone) values(s,trim(p_business->>'location_name'),trim(p_business->>'location_address'),trim(p_business->>'phone'));
 insert into public.subscription_purchases(subscription_id,client_id,request_id,request_payload,selection,business_details,total_cents,billing_interval) values(s,c,p_request,payload,quote,p_business,(quote->>'total_cents')::bigint,quote->>'billing_interval');
 return s;
end$$;
revoke all on function public.start_subscription(uuid,jsonb,uuid,uuid,uuid[],jsonb) from public,anon,authenticated;
grant execute on function public.start_subscription(uuid,jsonb,uuid,uuid,uuid[],jsonb) to authenticated;

-- Sample catalog only; business types do not activate industry-specific behavior.
insert into public.business_types(name,description) values('Restaurant','Sample plans for food businesses.'),('Retail','Sample plans for shops and product businesses.'),('Other business','Sample plans for other types of business.');
insert into public.talix_offerings(business_type_id,kind,name,description,price_cents,billing_interval) select id,'plan','Starter','A sample starting plan for online ordering and fulfillment.',2900,'month' from public.business_types;
insert into public.talix_offerings(business_type_id,kind,name,description,price_cents,billing_interval) select id,'plan','Plus','A sample higher tier. Included benefits will be defined before launch.',5900,'month' from public.business_types;
insert into public.talix_offerings(kind,name,description,price_cents,billing_interval) values('addon','Extra insights','Sample optional product. Benefits will be defined before launch.',1000,'month'),('addon','Website assistance','Sample optional product. Services will be defined before launch.',2000,'month');

-- Keep customer-facing access messages free of provider references.
create or replace function public.grant_location_access(p_location uuid,p_email text,p_role text) returns void language plpgsql security definer set search_path='' as $$declare s uuid;
u uuid;
begin select subscription_id into s from public.locations where id=p_location;
if not coalesce(private.is_owner(s),false) then raise exception 'Owner access required';
end if;
select id into u from auth.users where lower(email)=lower(trim(p_email));
if u is null then raise exception 'This team member needs a Talix account before you can grant access.';
end if;
insert into public.memberships values(s,u,'employee') on conflict do nothing;
if p_role='none' then delete from public.location_access where location_id=p_location and user_id=u;
else insert into public.location_access values(p_location,u,p_role) on conflict(location_id,user_id) do update set role=excluded.role;
end if;
end$$;
