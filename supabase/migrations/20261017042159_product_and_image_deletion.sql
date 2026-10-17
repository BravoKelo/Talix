-- Issues #26–27. Prepared only; owner approval required before development execution.
grant delete on public.products to authenticated;
create policy delete_product on public.products for delete to authenticated
 using(private.allowed(subscription_id,location_id,'products.manage'));

-- Look across references without caller RLS hiding another saved use of the image.
-- Authorization is checked here as well as the policy; this is not a public RPC.
create function private.can_delete_business_image(p_bucket text,p_name text) returns boolean
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
)
$$;
revoke all on function private.can_delete_business_image(text,text) from public,anon,authenticated;
grant execute on function private.can_delete_business_image(text,text) to authenticated;
grant delete on storage.objects to authenticated;
create policy delete_business_image on storage.objects for delete to authenticated
 using(bucket_id in ('product-images','business-logos') and private.can_delete_business_image(bucket_id,name));
-- Objects must be deleted via the Storage API, not SQL, to remove stored file bytes.
