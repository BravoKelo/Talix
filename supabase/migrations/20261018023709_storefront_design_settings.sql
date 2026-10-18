-- Approved Figma implementation scope. Prepared only; not applied to development.
alter table public.subscriptions
 add column default_location_id uuid,
 add column header_photo_url text check(header_photo_url is null or (length(header_photo_url)<=2048 and header_photo_url ~ '^https://[^[:space:]]+$')),
 add column header_identity text not null default 'name' check(header_identity in ('name','photo')),
 add column header_background text not null default '#ffffff' check(header_background ~ '^#[0-9a-fA-F]{6}$'),
 add column storefront_text text not null default '#17233b' check(storefront_text ~ '^#[0-9a-fA-F]{6}$'),
 add column storefront_button text not null default '#292929' check(storefront_button ~ '^#[0-9a-fA-F]{6}$'),
 add column storefront_font text not null default 'sans' check(storefront_font in ('sans','serif','mono')),
 add column storefront_text_size text not null default 'standard' check(storefront_text_size in ('standard','large')),
 add column tile_corners text not null default 'square' check(tile_corners in ('square','subtle','round')),
 add column tile_spacing text not null default 'comfortable' check(tile_spacing in ('compact','comfortable')),
 add constraint subscription_default_location_same_business foreign key(default_location_id,id) references public.locations(id,subscription_id);
grant update(default_location_id,header_photo_url,header_identity,header_background,storefront_text,storefront_button,storefront_font,storefront_text_size,tile_corners,tile_spacing) on public.subscriptions to authenticated;
alter table public.products add column category text not null default '' check(length(category)<=80 and category=trim(category));
grant insert(category),update(category) on public.products to authenticated;

-- Keep the existing settings.manage and products.manage policies; no new roles or buckets.
-- Public catalog exposes only published default-location identifiers, never private client identity.
create or replace function public.public_catalog(p_slug text) returns jsonb language sql stable security definer set search_path='' as $$
select jsonb_build_object('subscription',jsonb_build_object(
 'id',s.id,'name',s.name,'slug',s.slug,'accent',s.accent,'description',s.description,'logo_url',s.logo_url,
 'default_location_id',(select l.id from public.locations l where l.id=s.default_location_id and l.subscription_id=s.id and l.published),
 'header_photo_url',s.header_photo_url,'header_identity',s.header_identity,'header_background',s.header_background,
 'storefront_text',s.storefront_text,'storefront_button',s.storefront_button,'storefront_font',s.storefront_font,
 'storefront_text_size',s.storefront_text_size,'tile_corners',s.tile_corners,'tile_spacing',s.tile_spacing),
 'locations',coalesce((select jsonb_agg(to_jsonb(l) order by l.name,l.id) from public.locations l where l.subscription_id=s.id and l.published),'[]'::jsonb),
 'products',coalesce((select jsonb_agg(to_jsonb(p) order by p.name,p.id) from public.products p where p.subscription_id=s.id and p.available and (p.location_id is null or exists(select 1 from public.locations l where l.id=p.location_id and l.published))),'[]'::jsonb))
from public.subscriptions s where s.slug=p_slug and exists(select 1 from public.locations l where l.subscription_id=s.id and l.published)
$$;

-- Protect header photo references during existing staged image cleanup.
create or replace function private.can_delete_business_image(p_bucket text,p_name text) returns boolean
language sql stable security definer set search_path='' as $$
select auth.uid() is not null and exists(
 select 1 from public.subscriptions s
 where s.id::text=(storage.foldername(p_name))[1]
 and (
  (p_bucket='business-logos' and private.allowed(s.id,null,'settings.manage')) or
  (p_bucket='product-images' and (private.allowed(s.id,null,'products.manage') or exists(
   select 1 from public.locations l where l.subscription_id=s.id and private.allowed(s.id,l.id,'products.manage'))))
 )
) and not exists(
 select 1 from public.products p
 where split_part(p.image_url,'?',1) like '%/storage/v1/object/public/'||p_bucket||'/'||p_name
) and not exists(
 select 1 from public.subscriptions s
 where split_part(s.logo_url,'?',1) like '%/storage/v1/object/public/'||p_bucket||'/'||p_name
 or split_part(s.header_photo_url,'?',1) like '%/storage/v1/object/public/'||p_bucket||'/'||p_name
)
$$;
