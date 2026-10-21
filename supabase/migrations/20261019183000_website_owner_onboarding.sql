-- Applied to Talix development with owner approval as service migration
-- 20261019201906_website_owner_onboarding. Production execution still requires
-- separate approval. Website setup state is private except for the explicitly
-- launched template identifier included in public_catalog below.
alter table public.subscriptions
 add column website_path text not null default 'deferred'
  check(website_path in ('deferred','existing','talix_template')),
 add column website_template text
  check(website_template is null or website_template in ('order_first','browse_shop','visit_order','story_shop')),
 add column website_live_template text
  check(website_live_template is null or website_live_template in ('order_first','browse_shop','visit_order','story_shop')),
 add column existing_website_url text
  check(existing_website_url is null or (
   length(existing_website_url) <= 2048
   and existing_website_url ~* '^https://[^[:space:]/@?#]+([/?#][^[:space:]]*)?$'
   and existing_website_url !~* '^https://[^/]*@'
   and position(chr(92) in existing_website_url) = 0
   and existing_website_url !~ '[[:cntrl:]]'
  )),
 add column website_setup_completed_at timestamptz,
 add column website_template_launched_at timestamptz;

create function public.save_website_setup(
 p_subscription uuid,
 p_path text,
 p_template text default null,
 p_existing_url text default null,
 p_mark_complete boolean default false
) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 saved public.subscriptions;
 normalized_url text := nullif(btrim(p_existing_url),'');
begin
 if not coalesce(private.is_owner(p_subscription),false) then
  raise exception 'Owner access required.';
 end if;
 if p_path is null or p_path not in ('deferred','existing','talix_template') then
  raise exception 'Choose a website option.';
 end if;
 if p_template is not null and p_template not in ('order_first','browse_shop','visit_order','story_shop') then
  raise exception 'Choose an available template.';
 end if;
 if normalized_url is not null and (
  length(normalized_url) > 2048
  or normalized_url !~* '^https://[^[:space:]/@?#]+([/?#][^[:space:]]*)?$'
  or normalized_url ~* '^https://[^/]*@'
  or position(chr(92) in normalized_url) > 0
  or normalized_url ~ '[[:cntrl:]]'
 ) then raise exception 'Enter a complete HTTPS website address without sign-in details.';
 end if;
 if p_mark_complete and p_path='existing' and normalized_url is null then
  raise exception 'Enter your existing HTTPS website address.';
 end if;
 if p_mark_complete and p_path='talix_template' and p_template is null then
  raise exception 'Choose a Talix template.';
 end if;

 update public.subscriptions set
  website_path=p_path,
  website_template=p_template,
  existing_website_url=normalized_url,
  website_setup_completed_at=case when p_mark_complete then coalesce(website_setup_completed_at,now()) else website_setup_completed_at end
 where id=p_subscription
 returning * into saved;
 if not found then raise exception 'Subscription not found.'; end if;

 return jsonb_build_object(
  'website_path',saved.website_path,
  'website_template',saved.website_template,
  'website_live_template',saved.website_live_template,
  'existing_website_url',saved.existing_website_url,
  'website_setup_completed_at',saved.website_setup_completed_at,
  'website_template_launched_at',saved.website_template_launched_at
 );
end
$$;

create function public.launch_website_template(
 p_subscription uuid,
 p_confirm_empty_catalog boolean default false
) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 saved public.subscriptions;
 selected_template text;
 ordering_ready boolean;
begin
 if not coalesce(private.is_owner(p_subscription),false) then
  raise exception 'Owner access required.';
 end if;
 select website_template into selected_template
 from public.subscriptions where id=p_subscription for update;
 if not found then raise exception 'Subscription not found.'; end if;
 if selected_template is null then raise exception 'Choose and save a template first.'; end if;
 if not exists(select 1 from public.locations where subscription_id=p_subscription and published) then
  raise exception 'Publish at least one location before launching.';
 end if;
 select exists(
  select 1 from public.products p
  where p.subscription_id=p_subscription and p.available
   and (p.location_id is null or exists(
    select 1 from public.locations l where l.id=p.location_id and l.published
   ))
 ) into ordering_ready;
 if not ordering_ready and not coalesce(p_confirm_empty_catalog,false) then
  raise exception 'Confirm that you want to launch before online ordering is ready.';
 end if;

 update public.subscriptions set
  website_path='talix_template',
  website_live_template=selected_template,
  website_setup_completed_at=coalesce(website_setup_completed_at,now()),
  website_template_launched_at=case
   when website_live_template is distinct from selected_template then now()
   else coalesce(website_template_launched_at,now())
  end
 where id=p_subscription
 returning * into saved;
 if not found then raise exception 'Subscription not found.'; end if;

 return jsonb_build_object(
  'website_path',saved.website_path,
  'website_template',saved.website_template,
  'website_live_template',saved.website_live_template,
  'existing_website_url',saved.existing_website_url,
  'website_setup_completed_at',saved.website_setup_completed_at,
  'website_template_launched_at',saved.website_template_launched_at,
  'ordering_ready',ordering_ready
 );
end
$$;

revoke all on function public.save_website_setup(uuid,text,text,text,boolean),public.launch_website_template(uuid,boolean) from public,anon,authenticated;
grant execute on function public.save_website_setup(uuid,text,text,text,boolean),public.launch_website_template(uuid,boolean) to authenticated;

create or replace function public.public_catalog(p_slug text) returns jsonb language sql stable security definer set search_path='' as $$
select jsonb_build_object('subscription',jsonb_build_object(
 'id',s.id,'name',s.name,'slug',s.slug,'accent',s.accent,'description',s.description,'logo_url',s.logo_url,
 'default_location_id',(select l.id from public.locations l where l.id=s.default_location_id and l.subscription_id=s.id and l.published),
 'header_mode',s.header_mode,'header_links',case when s.header_mode='custom' then s.header_links else '[]'::jsonb end,
 'header_layout',s.header_layout,'header_photo_url',s.header_photo_url,'header_identity',s.header_identity,'header_background',s.header_background,
 'storefront_text',s.storefront_text,'storefront_button',s.storefront_button,'storefront_font',s.storefront_font,
 'storefront_text_size',s.storefront_text_size,'tile_corners',s.tile_corners,'tile_spacing',s.tile_spacing,
 'website_live_template',s.website_live_template),
 'locations',coalesce((select jsonb_agg(to_jsonb(l) order by l.name,l.id) from public.locations l where l.subscription_id=s.id and l.published),'[]'::jsonb),
 'products',coalesce((select jsonb_agg(to_jsonb(p) order by p.name,p.id) from public.products p where p.subscription_id=s.id and p.available and (p.location_id is null or exists(select 1 from public.locations l where l.id=p.location_id and l.published))),'[]'::jsonb))
from public.subscriptions s where s.slug=p_slug and exists(select 1 from public.locations l where l.subscription_id=s.id and l.published)
$$;
