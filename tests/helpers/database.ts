import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
export async function initializeDatabase(db: PGlite) {
  await db.exec(
    `create role anon;create function public.rls_auto_enable() returns event_trigger language plpgsql as $$begin end$$;create role authenticated;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz default now());create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;create function storage.foldername(text) returns text[] language sql as $$select string_to_array($1,'/')$$;grant usage on schema storage to authenticated,anon;grant select,insert on storage.objects to authenticated;grant select on storage.objects to anon;`,
  );
  for (const file of readdirSync("supabase/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    await db.exec(readFileSync("supabase/migrations/" + file, "utf8"));
  }
}
