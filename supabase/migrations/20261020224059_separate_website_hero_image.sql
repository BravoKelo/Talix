-- Keep the three approved image roles independent: compact business logo,
-- centered storefront identity photo, and Talix website hero photography.
alter table public.subscriptions
 add column website_hero_url text
 check(website_hero_url is null or (length(website_hero_url)<=2048 and website_hero_url ~ '^https://[^[:space:]]+$'));

grant update(website_hero_url) on public.subscriptions to authenticated;

-- The public website needs the hero image, but no private website setup state.
create or replace function public.public_catalog(p_slug text) returns jsonb language sql stable security definer set search_path='' as $$
select jsonb_build_object('subscription',jsonb_build_object(
 'id',s.id,'name',s.name,'slug',s.slug,'accent',s.accent,'description',s.description,'logo_url',s.logo_url,
 'default_location_id',(select l.id from public.locations l where l.id=s.default_location_id and l.subscription_id=s.id and l.published),
 'header_mode',s.header_mode,'header_links',case when s.header_mode='custom' then s.header_links else '[]'::jsonb end,
 'header_layout',s.header_layout,'header_photo_url',s.header_photo_url,'header_identity',s.header_identity,'header_background',s.header_background,
 'storefront_text',s.storefront_text,'storefront_button',s.storefront_button,'storefront_font',s.storefront_font,
 'storefront_text_size',s.storefront_text_size,'tile_corners',s.tile_corners,'tile_spacing',s.tile_spacing,
 'website_live_template',s.website_live_template,'website_hero_url',s.website_hero_url),
 'locations',coalesce((select jsonb_agg(to_jsonb(l) order by l.name,l.id) from public.locations l where l.subscription_id=s.id and l.published),'[]'::jsonb),
 'products',coalesce((select jsonb_agg(to_jsonb(p) order by p.name,p.id) from public.products p where p.subscription_id=s.id and p.available and (p.location_id is null or exists(select 1 from public.locations l where l.id=p.location_id and l.published))),'[]'::jsonb))
from public.subscriptions s where s.slug=p_slug and exists(select 1 from public.locations l where l.subscription_id=s.id and l.published)
$$;

-- Prevent staged cleanup from deleting any image still used by one of the
-- three business presentation roles.
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
 or split_part(s.website_hero_url,'?',1) like '%/storage/v1/object/public/'||p_bucket||'/'||p_name
)
$$;

revoke all on function private.can_delete_business_image(text,text) from public,anon,authenticated;
grant execute on function private.can_delete_business_image(text,text) to authenticated;
