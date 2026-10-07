-- Approved core slice, Issue #1. Development-only simulated payments, no processor.
-- Review existing Talix schema before applying this migration.
create schema if not exists private;

revoke all on schema private from public;

grant usage on schema private to authenticated;

create table public.clients(id uuid primary key default gen_random_uuid(), owner_id uuid not null unique references auth.users(id));

create table public.subscriptions(id uuid primary key default gen_random_uuid(),client_id uuid not null references public.clients(id),name text not null check(length(name) between 1 and 100),slug text not null unique check(slug ~ '^[a-z0-9][a-z0-9-]{2,62}$'),accent text not null default '#2563eb' check(accent ~ '^#[0-9a-fA-F]{6}$'),description text not null default '' check(length(description)<=1000));

create table public.memberships(subscription_id uuid references public.subscriptions(id),user_id uuid references auth.users(id),role text not null check(role in ('owner','employee')),primary key(subscription_id,user_id));

create table public.locations(id uuid primary key default gen_random_uuid(),subscription_id uuid not null references public.subscriptions(id),name text not null check(length(name) between 1 and 100),address text not null default '',phone text not null default '',hours text not null default '',published boolean not null default false,unique(id,subscription_id));

create table public.location_access(location_id uuid references public.locations(id),user_id uuid references auth.users(id),role text not null check(role in ('fulfillment','viewer')),primary key(location_id,user_id));

create function private.is_owner(s uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.memberships where subscription_id=s and user_id=auth.uid() and role='owner')$$;

create function private.can_access(l uuid,write_access boolean default false) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.locations x join public.memberships m on m.subscription_id=x.subscription_id and m.user_id=auth.uid() where x.id=l and (m.role='owner' or exists(select 1 from public.location_access a where a.location_id=l and a.user_id=m.user_id and (not write_access or a.role='fulfillment'))))$$;

create function private.valid_options(opts jsonb) returns boolean language plpgsql immutable set search_path='' as $$declare o jsonb;
 ids text[]='{}';
begin if jsonb_typeof(opts)<>'array' or jsonb_array_length(opts)>20 then return false;
end if;
for o in select value from jsonb_array_elements(opts) loop if jsonb_typeof(o)<>'object' or coalesce(o->>'id','') !~ '^[a-zA-Z0-9_-]{1,40}$' or coalesce(length(o->>'name'),0) not between 1 and 100 or coalesce(o->>'price_cents','') !~ '^\d{1,9}$' or (o->>'price_cents')::bigint>100000000 or (o->>'id')=any(ids) then return false;
end if;
ids=array_append(ids,o->>'id');
end loop;
return true;
end$$;

create table public.products(id uuid primary key default gen_random_uuid(),subscription_id uuid not null references public.subscriptions(id),location_id uuid,name text not null check(length(name) between 1 and 100),description text not null default '' check(length(description)<=2000),price_cents integer not null check(price_cents between 0 and 100000000),image_url text check(image_url is null or image_url ~ '^https://'),available boolean not null default true,options jsonb not null default '[]' check(private.valid_options(options)),foreign key(location_id,subscription_id) references public.locations(id,subscription_id));

create table public.orders(id uuid primary key default gen_random_uuid(),subscription_id uuid not null references public.subscriptions(id),location_id uuid not null,private_token uuid not null unique default gen_random_uuid(),request_id uuid not null unique,request_payload jsonb not null,customer_name text not null,email text not null,phone text not null,items jsonb not null,total_cents integer not null check(total_cents>0),refunded_cents integer not null default 0 check(refunded_cents>=0 and refunded_cents<=total_cents),payment_status text not null check(payment_status in ('paid','declined','partially_refunded','refunded')),status text not null default 'received' check(status in ('received','in_progress','ready','completed','cancelled')),created_at timestamptz not null default now(),foreign key(location_id,subscription_id) references public.locations(id,subscription_id));

create table public.payment_events(id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),request_id uuid not null unique,kind text not null check(kind in ('approved','declined','refund')),amount_cents integer not null check(amount_cents>=0),reason text not null default '',created_at timestamptz not null default now());

create table public.order_events(id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),status text not null,actor uuid references auth.users(id),created_at timestamptz not null default now());

create index subscriptions_client on public.subscriptions(client_id);

create index locations_subscription on public.locations(subscription_id);

create index products_location on public.products(location_id);

create index orders_subscription on public.orders(subscription_id);

create index event_actor on public.order_events(actor);

create index orders_queue on public.orders(location_id,created_at desc);

create index products_subscription on public.products(subscription_id);

create index access_user on public.location_access(user_id);

create index memberships_user on public.memberships(user_id);

create index payment_order on public.payment_events(order_id);

create index event_order on public.order_events(order_id);

alter table public.clients enable row level security;

alter table public.subscriptions enable row level security;

alter table public.memberships enable row level security;

alter table public.locations enable row level security;

alter table public.location_access enable row level security;

alter table public.products enable row level security;

alter table public.orders enable row level security;

alter table public.payment_events enable row level security;

alter table public.order_events enable row level security;

create policy own_client on public.clients for select to authenticated using(owner_id=auth.uid());

create policy member_subscription on public.subscriptions for select to authenticated using(exists(select 1 from public.memberships where subscription_id=id and user_id=auth.uid()));

create policy owner_subscription on public.subscriptions for update to authenticated using(private.is_owner(id)) with check(private.is_owner(id));

create policy own_membership on public.memberships for select to authenticated using(user_id=auth.uid() or private.is_owner(subscription_id));

create policy readable_location on public.locations for select to authenticated using(private.is_owner(subscription_id) or private.can_access(id));

create policy create_location on public.locations for insert to authenticated with check(private.is_owner(subscription_id));

create policy edit_location on public.locations for update to authenticated using(private.is_owner(subscription_id)) with check(private.is_owner(subscription_id));

create policy readable_access on public.location_access for select to authenticated using(user_id=auth.uid() or private.can_access(location_id));

create policy readable_product on public.products for select to authenticated using(private.is_owner(subscription_id) or (location_id is not null and private.can_access(location_id)) or (location_id is null and exists(select 1 from public.locations where subscription_id=products.subscription_id and private.can_access(id))));

create policy create_product on public.products for insert to authenticated with check(private.is_owner(subscription_id));

create policy edit_product on public.products for update to authenticated using(private.is_owner(subscription_id)) with check(private.is_owner(subscription_id));

create policy readable_order on public.orders for select to authenticated using(private.can_access(location_id));

create policy readable_payment on public.payment_events for select to authenticated using(exists(select 1 from public.orders where id=order_id));

create policy readable_event on public.order_events for select to authenticated using(exists(select 1 from public.orders where id=order_id));

revoke all on public.clients,public.subscriptions,public.memberships,public.locations,public.location_access,public.products,public.orders,public.payment_events,public.order_events from anon,authenticated;

grant select on public.clients,public.subscriptions,public.memberships,public.locations,public.location_access,public.products,public.payment_events,public.order_events to authenticated;

grant select(id,subscription_id,location_id,customer_name,email,phone,items,total_cents,refunded_cents,payment_status,status,created_at) on public.orders to authenticated;

grant update(name,slug,accent,description) on public.subscriptions to authenticated;

grant insert(subscription_id,name,address,phone,hours,published),update(name,address,phone,hours,published) on public.locations to authenticated;

grant insert(subscription_id,location_id,name,description,price_cents,image_url,available,options),update(location_id,name,description,price_cents,image_url,available,options) on public.products to authenticated;

create function public.create_workspace(p_name text,p_slug text,p_location text) returns uuid language plpgsql security definer set search_path='' as $$declare c uuid;
s uuid;
begin if auth.uid() is null then raise exception 'Sign in required';
end if;
perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,1));
select id into c from public.clients where owner_id=auth.uid();
if c is null then insert into public.clients(owner_id) values(auth.uid()) returning id into c;
end if;
insert into public.subscriptions(client_id,name,slug) values(c,p_name,p_slug) returning id into s;
insert into public.memberships values(s,auth.uid(),'owner');
insert into public.locations(subscription_id,name) values(s,p_location);
return s;
end$$;

create function public.grant_location_access(p_location uuid,p_email text,p_role text) returns void language plpgsql security definer set search_path='' as $$declare s uuid;
u uuid;
begin select subscription_id into s from public.locations where id=p_location;
if not coalesce(private.is_owner(s),false) then raise exception 'Owner access required';
end if;
select id into u from auth.users where lower(email)=lower(trim(p_email));
if u is null then raise exception 'Create this user in Supabase Auth first';
end if;
insert into public.memberships values(s,u,'employee') on conflict do nothing;
if p_role='none' then delete from public.location_access where location_id=p_location and user_id=u;
else insert into public.location_access values(p_location,u,p_role) on conflict(location_id,user_id) do update set role=excluded.role;
end if;
end$$;

create function public.public_catalog(p_slug text) returns jsonb language sql stable security definer set search_path='' as $$select jsonb_build_object('subscription',jsonb_build_object('id',s.id,'name',s.name,'slug',s.slug,'accent',s.accent,'description',s.description),'locations',coalesce((select jsonb_agg(to_jsonb(l)) from public.locations l where l.subscription_id=s.id and published),'[]'::jsonb),'products',coalesce((select jsonb_agg(to_jsonb(p)) from public.products p where p.subscription_id=s.id and available and (p.location_id is null or exists(select 1 from public.locations l where l.id=p.location_id and published))),'[]'::jsonb)) from public.subscriptions s where s.slug=p_slug and exists(select 1 from public.locations l where l.subscription_id=s.id and published)$$;

create function public.checkout_simulated(p_location uuid,p_request uuid,p_customer jsonb,p_lines jsonb,p_outcome text) returns jsonb language plpgsql security definer set search_path='' as $$declare l public.locations;
 p public.products;
 o public.orders;
 line jsonb;
opt jsonb;
 ids jsonb;
 selected jsonb;
 snapshot jsonb='[]';
payload jsonb;
qty int;
unit bigint;
total bigint=0;
begin
if p_request is null or p_outcome not in ('approved','declined') or p_outcome is null then raise exception 'Invalid simulated payment';
end if;

payload=jsonb_build_object('location',p_location,'customer',p_customer,'lines',p_lines,'outcome',p_outcome);

perform pg_advisory_xact_lock(hashtextextended(p_request::text,0));
select * into o from public.orders where request_id=p_request;
if found then if o.request_payload<>payload then raise exception 'Request already used with different details';
end if;
return jsonb_build_object('token',o.private_token);
end if;

select * into l from public.locations where id=p_location and published;
if not found then raise exception 'Location unavailable';
end if;

if coalesce(length(trim(p_customer->>'name')),0) not between 1 and 100 or coalesce(p_customer->>'email','') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(p_customer->>'email')>254 or coalesce(length(trim(p_customer->>'phone')),0) not between 7 and 30 then raise exception 'Name, email and phone are required';
end if;

if jsonb_typeof(p_lines)<>'array' or coalesce(jsonb_array_length(p_lines),0) not between 1 and 50 then raise exception 'Invalid cart';
end if;

for line in select value from jsonb_array_elements(p_lines) loop
if coalesce(line->>'quantity','') !~ '^\d{1,2}$' then raise exception 'Invalid quantity';
end if;
qty=(line->>'quantity')::int;
if qty<1 then raise exception 'Invalid quantity';
end if;

select * into p from public.products where id=(line->>'product_id')::uuid and subscription_id=l.subscription_id and (location_id is null or location_id=l.id) and available for share;
if not found then raise exception 'Product unavailable';
end if;

ids=line->'option_ids';
if jsonb_typeof(ids)<>'array' or ids is null or jsonb_array_length(ids)>20 or (select count(*)<>count(distinct value) from jsonb_array_elements_text(ids)) then raise exception 'Invalid options';
end if;

selected='[]';
unit=p.price_cents;
for opt in select value from jsonb_array_elements(p.options) where ids ? (value->>'id') loop selected=selected||jsonb_build_array(opt);
unit=unit+(opt->>'price_cents')::int;
end loop;

if jsonb_array_length(selected)<>jsonb_array_length(ids) then raise exception 'Unknown product option';
end if;
total=total+unit*qty;
if total>100000000 then raise exception 'Order too large';
end if;

snapshot=snapshot||jsonb_build_array(jsonb_build_object('product_id',p.id,'name',p.name,'quantity',qty,'unit_cents',unit,'options',selected));
end loop;

if total<=0 then raise exception 'Order total must be positive';
end if;

insert into public.orders(subscription_id,location_id,request_id,request_payload,customer_name,email,phone,items,total_cents,payment_status) values(l.subscription_id,l.id,p_request,payload,trim(p_customer->>'name'),lower(trim(p_customer->>'email')),trim(p_customer->>'phone'),snapshot,total,case when p_outcome='approved' then 'paid' else 'declined' end) returning * into o;

insert into public.payment_events(order_id,request_id,kind,amount_cents) values(o.id,p_request,p_outcome,total);
insert into public.order_events(order_id,status) values(o.id,'received');
return jsonb_build_object('token',o.private_token);
end$$;

create function public.track_order(p_token uuid) returns jsonb language sql stable security definer set search_path='' as $$select jsonb_build_object('id',o.id,'total_cents',total_cents,'refunded_cents',refunded_cents,'payment_status',payment_status,'status',status,'items',items,'created_at',created_at,'location_name',l.name,'business_name',s.name) from public.orders o join public.locations l on l.id=o.location_id join public.subscriptions s on s.id=o.subscription_id where private_token=p_token$$;

create function public.retry_simulated_payment(p_token uuid,p_request uuid,p_outcome text) returns void language plpgsql security definer set search_path='' as $$declare o public.orders;
e public.payment_events;
begin if p_request is null or p_outcome is null or p_outcome not in ('approved','declined') then raise exception 'Invalid request';
end if;
select * into o from public.orders where private_token=p_token for update;
if not found then raise exception 'Order not found';
end if;
select * into e from public.payment_events where request_id=p_request;
if found then if e.order_id<>o.id or e.kind<>p_outcome then raise exception 'Request already used';
end if;
return;
end if;
if o.payment_status<>'declined' then raise exception 'Order is already paid';
end if;
insert into public.payment_events(order_id,request_id,kind,amount_cents) values(o.id,p_request,p_outcome,o.total_cents);
if p_outcome='approved' then update public.orders set payment_status='paid' where id=o.id;
end if;
end$$;

create function public.advance_order(p_order uuid,p_status text) returns void language plpgsql security definer set search_path='' as $$declare o public.orders;
begin select * into o from public.orders where id=p_order for update;
if not found or not private.can_access(o.location_id,true) then raise exception 'Fulfillment access required';
end if;
if o.payment_status not in ('paid','partially_refunded') then raise exception 'Order is not paid';
end if;
if p_status=o.status then return;
end if;
if not ((o.status='received' and p_status='in_progress') or (o.status='in_progress' and p_status='ready') or (o.status='ready' and p_status='completed')) then raise exception 'Invalid status transition';
end if;
update public.orders set status=p_status where id=o.id;
insert into public.order_events(order_id,status,actor) values(o.id,p_status,auth.uid());
end$$;

create function public.refund_simulated(p_order uuid,p_request uuid,p_amount integer,p_reason text) returns void language plpgsql security definer set search_path='' as $$declare o public.orders;
e public.payment_events;
begin select * into o from public.orders where id=p_order for update;
if not found or not private.is_owner(o.subscription_id) then raise exception 'Owner access required';
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

revoke all on function public.create_workspace(text,text,text),public.grant_location_access(uuid,text,text),public.public_catalog(text),public.checkout_simulated(uuid,uuid,jsonb,jsonb,text),public.track_order(uuid),public.retry_simulated_payment(uuid,uuid,text),public.advance_order(uuid,text),public.refund_simulated(uuid,uuid,integer,text) from public,anon,authenticated;

revoke all on function private.is_owner(uuid),private.can_access(uuid,boolean),private.valid_options(jsonb) from public,anon,authenticated;

grant execute on function private.is_owner(uuid),private.can_access(uuid,boolean),private.valid_options(jsonb) to authenticated;

grant execute on function public.create_workspace(text,text,text),public.grant_location_access(uuid,text,text),public.advance_order(uuid,text),public.refund_simulated(uuid,uuid,integer,text) to authenticated;

grant execute on function public.public_catalog(text),public.checkout_simulated(uuid,uuid,jsonb,jsonb,text),public.track_order(uuid),public.retry_simulated_payment(uuid,uuid,text) to anon,authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp']);

create policy product_image_read on storage.objects for select to anon,authenticated using(bucket_id='product-images');

create policy product_image_upload on storage.objects for insert to authenticated with check(bucket_id='product-images' and exists(select 1 from public.subscriptions s where s.id::text=(storage.foldername(storage.objects.name))[1] and private.is_owner(s.id)));
