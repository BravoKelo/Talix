-- Prepared for approved header preset design; development execution is separate.
alter table public.subscriptions add column header_layout text not null default 'centered'
 check(header_layout in ('centered','left','two_row','search','minimal'));
grant update(header_layout) on public.subscriptions to authenticated;

-- Preserve the catalog whitelist, published location redaction and existing function ACL.
create or replace function public.public_catalog(p_slug text) returns jsonb language sql stable security definer set search_path='' as $$
select jsonb_build_object('subscription',jsonb_build_object(
 'id',s.id,'name',s.name,'slug',s.slug,'accent',s.accent,'description',s.description,'logo_url',s.logo_url,
 'default_location_id',(select l.id from public.locations l where l.id=s.default_location_id and l.subscription_id=s.id and l.published),
 'header_layout',s.header_layout,'header_photo_url',s.header_photo_url,'header_identity',s.header_identity,'header_background',s.header_background,
 'storefront_text',s.storefront_text,'storefront_button',s.storefront_button,'storefront_font',s.storefront_font,
 'storefront_text_size',s.storefront_text_size,'tile_corners',s.tile_corners,'tile_spacing',s.tile_spacing),
 'locations',coalesce((select jsonb_agg(to_jsonb(l) order by l.name,l.id) from public.locations l where l.subscription_id=s.id and l.published),'[]'::jsonb),
 'products',coalesce((select jsonb_agg(to_jsonb(p) order by p.name,p.id) from public.products p where p.subscription_id=s.id and p.available and (p.location_id is null or exists(select 1 from public.locations l where l.id=p.location_id and l.published))),'[]'::jsonb))
from public.subscriptions s where s.slug=p_slug and exists(select 1 from public.locations l where l.subscription_id=s.id and l.published)
$$;
