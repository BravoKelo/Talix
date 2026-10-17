-- Issues #24–25. Prepared for owner approval; do not apply to development yet.
-- Numbers are permanent and scoped to a location, starting at 1001.
alter table public.orders add column order_number integer;
with numbered as (
  select id, 1000 + row_number() over(partition by location_id order by created_at,id) as number
  from public.orders
)
update public.orders o set order_number=n.number from numbered n where n.id=o.id;
alter table public.orders alter column order_number set not null;
alter table public.orders add constraint orders_location_number_unique unique(location_id,order_number);
alter table public.orders add constraint orders_number_positive check(order_number>=1001);
grant select(order_number) on public.orders to authenticated;

-- Checkout already runs as the privileged checked transaction. No new public RPC.
create function private.assign_order_number() returns trigger language plpgsql set search_path='' as $$
begin
  perform 1 from public.locations where id=new.location_id for update;
  select coalesce(max(order_number),1000)+1 into new.order_number from public.orders where location_id=new.location_id;
  return new;
end $$;
revoke all on function private.assign_order_number() from public,anon,authenticated;
create trigger assign_order_number before insert on public.orders for each row execute function private.assign_order_number();

create or replace function public.track_order(p_token uuid) returns jsonb language sql stable security definer set search_path='' as $$
select jsonb_build_object('id',o.id,'order_number',o.order_number,'total_cents',total_cents,'refunded_cents',refunded_cents,'payment_status',payment_status,'status',status,'items',items,'created_at',created_at,'location_name',l.name,'business_name',s.name)
from public.orders o join public.locations l on l.id=o.location_id join public.subscriptions s on s.id=o.subscription_id where private_token=p_token
$$;

-- Cancellation uses existing location fulfillment authority; payment remains separate.
create or replace function public.advance_order(p_order uuid,p_status text) returns void language plpgsql security definer set search_path='' as $$
declare o public.orders;
begin
  select * into o from public.orders where id=p_order for update;
  if not found or not private.can_access(o.location_id,true) then raise exception 'Fulfillment access required'; end if;
  if p_status=o.status then return; end if;
  if o.payment_status not in ('paid','partially_refunded') then raise exception 'Order is not paid'; end if;
  if not ((o.status='received' and p_status='in_progress') or (o.status='in_progress' and p_status='ready') or (o.status='ready' and p_status='completed') or (o.status in ('received','in_progress','ready') and p_status='cancelled')) then raise exception 'Invalid status transition'; end if;
  update public.orders set status=p_status where id=o.id;
  insert into public.order_events(order_id,status,actor) values(o.id,p_status,auth.uid());
end $$;
