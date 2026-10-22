-- Prepared for issue #83. NOT applied to development or production.
-- Execute only after separate owner approval of this reviewed migration.
create function public.publish_storefront_only(
 p_subscription uuid,
 p_previous_template text,
 p_previous_launched_at timestamptz
) returns jsonb
language plpgsql security definer set search_path='' as $$
declare saved public.subscriptions;
begin
 if not coalesce(private.is_owner(p_subscription),false) then
  raise exception 'Owner access required.';
 end if;
 select * into saved from public.subscriptions where id=p_subscription for update;
 if not found then raise exception 'Subscription not found.'; end if;
 if saved.website_path <> 'deferred' then
  raise exception 'Save Decide later and review storefront-only mode before publishing.';
 end if;
 if p_previous_template is null or p_previous_template not in ('order_first','browse_shop','visit_order','story_shop')
    or p_previous_launched_at is null then
  raise exception 'Reload setup and review the current website before publishing.';
 end if;
 -- A lost response may be retried after the exact transition committed. A newer
 -- live publication must never be hidden by an older browser's confirmation.
 if saved.website_live_template is not null and (
    saved.website_live_template is distinct from p_previous_template
    or saved.website_template_launched_at is distinct from p_previous_launched_at
 ) then
  raise exception 'Your live website changed. Reload setup and review it before publishing.';
 end if;
 update public.subscriptions set
  website_live_template=null,
  website_template_launched_at=null,
  website_setup_completed_at=coalesce(website_setup_completed_at,now())
 where id=p_subscription returning * into saved;
 return jsonb_build_object(
  'website_path',saved.website_path,
  'website_template',saved.website_template,
  'website_live_template',saved.website_live_template,
  'existing_website_url',saved.existing_website_url,
  'website_setup_completed_at',saved.website_setup_completed_at,
  'website_template_launched_at',saved.website_template_launched_at,
  'storefront_only',true
 );
end
$$;
revoke all on function public.publish_storefront_only(uuid,text,timestamptz) from public,anon,authenticated;
grant execute on function public.publish_storefront_only(uuid,text,timestamptz) to authenticated;
