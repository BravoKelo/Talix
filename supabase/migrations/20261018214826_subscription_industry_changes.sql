-- Approved #38: original purchases remain immutable; changes apply only to current shared-core businesses.
create table public.subscription_changes (
 id uuid primary key default gen_random_uuid(),
 subscription_id uuid not null references public.subscriptions(id),
 version integer not null check(version>0),
 request_id uuid not null unique,
 request_payload jsonb not null check(jsonb_typeof(request_payload)='object'),
 previous_selection jsonb not null check(jsonb_typeof(previous_selection)='object'),
 selection jsonb not null check(jsonb_typeof(selection)='object'),
 actor_id uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 unique(subscription_id,version)
);
create index subscription_changes_actor on public.subscription_changes(actor_id);
alter table public.subscription_changes enable row level security;
revoke all on public.subscription_changes from public,anon,authenticated;
grant select(id,subscription_id,version,previous_selection,selection,actor_id,created_at) on public.subscription_changes to authenticated;
create policy owner_admin_change_history on public.subscription_changes for select to authenticated
 using(private.is_owner(subscription_id) or (select private.is_talix_admin()));

create function public.subscription_change_state(p_subscription uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare current_selection jsonb; revision integer;
begin
 if not coalesce(private.is_owner(p_subscription),false) and not coalesce(private.is_talix_admin(),false) then raise exception 'Owner access required.'; end if;
 select selection,version into current_selection,revision from public.subscription_changes where subscription_id=p_subscription order by version desc limit 1;
 if not found then select selection into current_selection from public.subscription_purchases where subscription_id=p_subscription; revision=0; end if;
 return jsonb_build_object('selection',current_selection,'version',revision,'history',coalesce((
  select jsonb_agg(jsonb_build_object('version',c.version,'previous_selection',c.previous_selection,'selection',c.selection,'created_at',c.created_at) order by c.version desc)
  from public.subscription_changes c where c.subscription_id=p_subscription),'[]'::jsonb));
end$$;

create function public.subscription_change_quote(p_subscription uuid,p_type uuid,p_plan uuid,p_addons uuid[],p_version integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare state jsonb; industry uuid; quote jsonb;
begin
 if not coalesce(private.is_owner(p_subscription),false) then raise exception 'Owner access required.'; end if;
 select business_type_id into industry from public.subscriptions where id=p_subscription for share;
 state=public.subscription_change_state(p_subscription);
 if state->'selection' is null or state->'selection'='null'::jsonb then raise exception 'This subscription has no purchase to change. Please contact support.'; end if;
 if p_version is null or p_version<>(state->>'version')::integer then raise exception 'This subscription changed. Reload its current plan and review again.'; end if;
 if p_type is null or p_type=industry then raise exception 'Choose a different industry.'; end if;
 quote=public.subscription_quote(p_type,p_plan,p_addons);
 return jsonb_build_object('previous_selection',state->'selection','selection',quote,'version',p_version);
end$$;

create function public.confirm_subscription_change(p_subscription uuid,p_request uuid,p_type uuid,p_plan uuid,p_addons uuid[],p_quote jsonb,p_version integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid=auth.uid(); payload jsonb; existing public.subscription_changes; reviewed jsonb;
begin
 if not coalesce(private.is_owner(p_subscription),false) or not exists(select 1 from auth.users where id=u and email_confirmed_at is not null) then raise exception 'Confirmed owner access required.'; end if;
 if p_request is null or p_quote is null or p_version is null then raise exception 'Please review your selection.'; end if;
 perform 1 from public.subscriptions where id=p_subscription for update;
 payload=jsonb_build_object('subscription',p_subscription,'type',p_type,'plan',p_plan,'addons',to_jsonb(p_addons),'quote',p_quote,'version',p_version);
 select * into existing from public.subscription_changes where request_id=p_request;
 if found then
  if existing.subscription_id<>p_subscription or existing.request_payload<>payload or existing.actor_id<>u then raise exception 'This confirmation was already used for a different selection.'; end if;
  return public.subscription_change_state(p_subscription);
 end if;
 reviewed=public.subscription_change_quote(p_subscription,p_type,p_plan,p_addons,p_version);
 if reviewed->'selection'<>p_quote then raise exception 'Your selection has changed. Please review the latest price before continuing.'; end if;
 insert into public.subscription_changes(subscription_id,version,request_id,request_payload,previous_selection,selection,actor_id)
 values(p_subscription,p_version+1,p_request,payload,reviewed->'previous_selection',p_quote,u);
 update public.subscriptions set business_type_id=p_type where id=p_subscription;
 return public.subscription_change_state(p_subscription);
end$$;
revoke all on function public.subscription_change_state(uuid),public.subscription_change_quote(uuid,uuid,uuid,uuid[],integer),public.confirm_subscription_change(uuid,uuid,uuid,uuid,uuid[],jsonb,integer) from public,anon,authenticated;
grant execute on function public.subscription_change_state(uuid),public.subscription_change_quote(uuid,uuid,uuid,uuid[],integer),public.confirm_subscription_change(uuid,uuid,uuid,uuid,uuid[],jsonb,integer) to authenticated;
