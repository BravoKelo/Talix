-- Let owners begin with Talix's four useful defaults, then edit, reorder or
-- remove those internal destinations without weakening external URL checks.
create or replace function private.valid_header_links(value jsonb) returns boolean
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
  if item->>'destination' in ('home','shop','about','contact','storefront') then
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
