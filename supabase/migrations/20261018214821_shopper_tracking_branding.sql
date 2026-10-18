-- Approved #40: branding is available only with the existing private order token.
create or replace function public.track_order(p_token uuid) returns jsonb
language sql stable security definer set search_path='' as $$
select jsonb_build_object(
 'id',o.id,'order_number',o.order_number,'total_cents',o.total_cents,
 'refunded_cents',o.refunded_cents,'payment_status',o.payment_status,
 'status',o.status,'items',o.items,'created_at',o.created_at,
 'location_name',l.name,'business_name',s.name,
 'storefront',jsonb_build_object('name',s.name,'slug',s.slug,'logo_url',s.logo_url,
  'header_background',s.header_background,'storefront_text',s.storefront_text,
  'storefront_button',s.storefront_button,'storefront_font',s.storefront_font,
  'storefront_text_size',s.storefront_text_size))
from public.orders o join public.locations l on l.id=o.location_id
join public.subscriptions s on s.id=o.subscription_id where o.private_token=p_token
$$;
revoke all on function public.track_order(uuid) from public,anon,authenticated;
grant execute on function public.track_order(uuid) to anon,authenticated;
