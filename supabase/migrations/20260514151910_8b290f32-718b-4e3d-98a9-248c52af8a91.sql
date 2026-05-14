-- Cleanup the temporary verification artifacts
DROP TABLE IF EXISTS public._rls_verify_results;

-- Restore EXECUTE for the three helpers that are referenced inside RLS policies.
-- PostgreSQL evaluates function permissions in policy expressions against the
-- INVOKING role (not the policy/table owner), so signed-in users must be able
-- to call these for their own rows to be visible. Keep them off for `anon`.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_phone_hash() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_mutual_match(text) TO authenticated;

-- handle_new_user_admin is only ever fired by a trigger on auth.users; no
-- end-user should be able to invoke it directly. Leave EXECUTE revoked.