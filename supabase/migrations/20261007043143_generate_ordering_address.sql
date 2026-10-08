create or replace function public.start_subscription(p_request uuid,p_business jsonb,p_type uuid,p_plan uuid,p_addons uuid[],p_quote jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid=auth.uid(); c uuid; s uuid; payload jsonb; existing public.subscription_purchases; quote jsonb; email text; k text; base_slug text; store_slug text; suffix integer=1;
begin
 if u is null or not exists(select 1 from auth.users where id=u and email_confirmed_at is not null) then raise exception 'Please confirm your email and sign in to continue.'; end if;
 if p_request is null or p_business is null or jsonb_typeof(p_business)<>'object' or octet_length(p_business::text)>10000 or p_quote is null then raise exception 'Please review your business details and selection.'; end if;
 -- Serialize a client creation and repeat-confirmation, including across browser tabs.
 perform pg_advisory_xact_lock(hashtextextended(u::text,0));
 payload=jsonb_build_object('business',p_business,'type',p_type,'plan',p_plan,'addons',to_jsonb(p_addons),'quote',p_quote);
 select * into existing from public.subscription_purchases where request_id=p_request;
 if found then
 if not exists(select 1 from public.clients where id=existing.client_id and owner_id=u) or existing.request_payload<>payload then raise exception 'This confirmation was already used for a different selection.'; end if;
 return existing.subscription_id;
 end if;
 for k in select unnest(array['business_name','contact_name','phone','billing_address','location_name','location_address']) loop
 if coalesce(length(trim(p_business->>k)),0) not between 1 and (case when k like '%address' then 500 when k='phone' then 40 else 100 end) then raise exception 'Please complete your business and contact details.'; end if;
 end loop;

 -- New purchases require canonical contact details; existing purchase retries above remain valid.
 if p_business->>'phone' !~ '^\+[1-9][0-9]{6,14}$' then raise exception 'Enter a phone number with a country code.'; end if;
 if length(trim(p_business->>'contact_name')) < 2 or p_business->>'contact_name' ~ '[0-9[:cntrl:]]' or p_business->>'contact_name' !~ '[[:alpha:]]' then raise exception 'Enter a valid contact name.'; end if;
 for k in select unnest(array['billing_address','location_address']) loop
 if p_business->>k !~ '^[^,[:cntrl:]]{3,}, [^,[:cntrl:]]{2,}, [^,[:cntrl:]]+, [A-Z0-9][A-Z0-9 -]{1,15}, [^,[:cntrl:]]{2,}$' then
 if k='billing_address' then raise exception 'Please complete your billing address using the separate address fields.';
 else raise exception 'Please complete your location address using the separate address fields.'; end if;
 end if;
 end loop;
 quote=public.subscription_quote(p_type,p_plan,p_addons);
 if quote<>p_quote then raise exception 'Your selection has changed. Please review the latest price before continuing.'; end if;
 select auth.users.email into email from auth.users where id=u;
 insert into public.clients(owner_id,contact_name,business_name,contact_email,phone,billing_address) values(u,trim(p_business->>'contact_name'),trim(p_business->>'business_name'),email,trim(p_business->>'phone'),trim(p_business->>'billing_address')) on conflict(owner_id) do update set contact_name=excluded.contact_name,business_name=excluded.business_name,contact_email=excluded.contact_email,phone=excluded.phone,billing_address=excluded.billing_address returning id into c;
 -- Allocation is server-owned and serialized across owners with the same business name.
 base_slug=left(trim(both '-' from regexp_replace(lower(p_business->>'business_name'),'[^a-z0-9]+','-','g')),50);
 if length(base_slug)<3 then base_slug='store'; end if;
 perform pg_advisory_xact_lock(hashtextextended('ordering-address:'||base_slug,0));
 store_slug=base_slug;
 while exists(select 1 from public.subscriptions where slug=store_slug) loop
 suffix=suffix+1; store_slug=base_slug||'-'||suffix::text;
 end loop;
 insert into public.subscriptions(client_id,name,slug,business_type_id) values(c,trim(p_business->>'business_name'),store_slug,p_type) returning id into s;
 insert into public.memberships values(s,u,'owner');
 insert into public.locations(subscription_id,name,address,phone) values(s,trim(p_business->>'location_name'),trim(p_business->>'location_address'),trim(p_business->>'phone'));
 insert into public.subscription_purchases(subscription_id,client_id,request_id,request_payload,selection,business_details,total_cents,billing_interval) values(s,c,p_request,payload,quote,p_business,(quote->>'total_cents')::bigint,quote->>'billing_interval');
 return s;
end$$;
