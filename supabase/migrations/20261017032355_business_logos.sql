-- Issue #17: subscription-wide business logo. Existing settings.manage authority is reused.
alter table public.subscriptions add column logo_url text;
alter table public.subscriptions add constraint subscription_logo_url_format
 check (logo_url is null or (length(logo_url) <= 2048 and logo_url ~ '^https://[^[:space:]]+$'));
grant update(logo_url) on public.subscriptions to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('business-logos','business-logos',true,5242880,array['image/jpeg','image/png','image/webp']);
create policy business_logo_upload on storage.objects for insert to authenticated
 with check(bucket_id='business-logos' and exists(
   select 1 from public.subscriptions s where s.id::text=(storage.foldername(storage.objects.name))[1]
     and private.allowed(s.id,null,'settings.manage')));
-- Public logos are served by the public bucket; listing is restricted to settings viewers.
create policy business_logo_list on storage.objects for select to authenticated
 using(bucket_id='business-logos' and exists(
   select 1 from public.subscriptions s where s.id::text=(storage.foldername(storage.objects.name))[1]
     and private.allowed(s.id,null,'settings.view')));

create or replace function public.public_catalog(p_slug text) returns jsonb language sql stable security definer set search_path='' as $$select jsonb_build_object('subscription',jsonb_build_object('id',s.id,'name',s.name,'slug',s.slug,'accent',s.accent,'description',s.description,'logo_url',s.logo_url),'locations',coalesce((select jsonb_agg(to_jsonb(l)) from public.locations l where l.subscription_id=s.id and published),'[]'::jsonb),'products',coalesce((select jsonb_agg(to_jsonb(p)) from public.products p where p.subscription_id=s.id and available and (p.location_id is null or exists(select 1 from public.locations l where l.id=p.location_id and published))),'[]'::jsonb)) from public.subscriptions s where s.slug=p_slug and exists(select 1 from public.locations l where l.subscription_id=s.id and published)$$;
