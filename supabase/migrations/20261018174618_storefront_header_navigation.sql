-- PREPARED ONLY: owner review and separate development execution approval required.
-- Subscription-wide presentation only; reuse settings.manage RLS and existing catalog ACL.
create function private.valid_header_links(value jsonb) returns boolean
language plpgsql immutable security invoker set search_path='' as $$
declare item jsonb;
begin
 if value is null or jsonb_typeof(value) <> 'array' then return false; end if;
 if jsonb_array_length(value) > 8 then return false; end if;
 for item in select * from jsonb_array_elements(value) loop
  if jsonb_typeof(item) <> 'object' then return false; end if;
  if (select count(*) from jsonb_object_keys(item)) <> 3
   or not (item ?& array['label','destination','url'])
   or jsonb_typeof(item->'label') <> 'string'
   or jsonb_typeof(item->'destination') <> 'string'
   or jsonb_typeof(item->'url') <> 'string' then return false; end if;
  if (item->>'label') !~ '[^[:space:]]' or length(item->>'label') > 32 then return false; end if;
  if item->>'destination' = 'storefront' then
   if item->>'url' <> '' then return false; end if;
  elsif item->>'destination' = 'website' then
   if length(item->>'url') > 2048
    or position(chr(92) in (item->>'url')) > 0
    or (item->>'url') !~* '^https://[^[:space:]/@?#]+([/?#][^[:space:]]*)?$'
    then return false; end if;
  else return false;
  end if;
 end loop;
 return true;
end
$$;
revoke all on function private.valid_header_links(jsonb) from public;
grant execute on function private.valid_header_links(jsonb) to authenticated;

alter table public.subscriptions
 add column header_mode text not null default 'standard' check(header_mode in ('standard','custom')),
 add column header_links jsonb not null default '[]'::jsonb check(private.valid_header_links(header_links));
-- Preserve an existing non-centered layout instead of silently resetting its presentation.
update public.subscriptions set header_mode='custom' where header_layout <> 'centered';
grant update(header_mode,header_links) on public.subscriptions to authenticated;

create or replace function public.public_catalog(p_slug text) returns jsonb language sql stable security definer set search_path='' as $$
select jsonb_build_object('subscription',jsonb_build_object(
 'id',s.id,'name',s.name,'slug',s.slug,'accent',s.accent,'description',s.description,'logo_url',s.logo_url,
 'default_location_id',(select l.id from public.locations l where l.id=s.default_location_id and l.subscription_id=s.id and l.published),
 'header_mode',s.header_mode,'header_links',case when s.header_mode='custom' then s.header_links else '[]'::jsonb end,
 'header_layout',s.header_layout,'header_photo_url',s.header_photo_url,'header_identity',s.header_identity,'header_background',s.header_background,
 'storefront_text',s.storefront_text,'storefront_button',s.storefront_button,'storefront_font',s.storefront_font,
 'storefront_text_size',s.storefront_text_size,'tile_corners',s.tile_corners,'tile_spacing',s.tile_spacing),
 'locations',coalesce((select jsonb_agg(to_jsonb(l) order by l.name,l.id) from public.locations l where l.subscription_id=s.id and l.published),'[]'::jsonb),
 'products',coalesce((select jsonb_agg(to_jsonb(p) order by p.name,p.id) from public.products p where p.subscription_id=s.id and p.available and (p.location_id is null or exists(select 1 from public.locations l where l.id=p.location_id and l.published))),'[]'::jsonb))
from public.subscriptions s where s.slug=p_slug and exists(select 1 from public.locations l where l.subscription_id=s.id and l.published)
$$;
