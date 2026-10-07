-- Platform event trigger is not a client API. PostgreSQL can still invoke it.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
