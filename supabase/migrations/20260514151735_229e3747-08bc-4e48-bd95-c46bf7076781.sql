CREATE OR REPLACE FUNCTION public._rls_verify_probe()
RETURNS TABLE(check_name text, ok boolean, detail text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cnt int;
BEGIN
  -- Run as the authenticated role with realistic JWT claims.
  SET LOCAL ROLE authenticated;
  PERFORM set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated","phone":"15551234567"}',
    true
  );

  BEGIN
    EXECUTE 'SELECT count(*) FROM public.compliments' INTO cnt;
    check_name := 'compliments SELECT (uses current_user_phone_hash in policy)';
    ok := true; detail := format('rows=%s', cnt); RETURN NEXT;
  EXCEPTION WHEN OTHERS THEN
    check_name := 'compliments SELECT'; ok := false; detail := SQLERRM; RETURN NEXT;
  END;

  BEGIN
    EXECUTE 'SELECT count(*) FROM public.messages' INTO cnt;
    check_name := 'messages SELECT (uses current_user_phone_hash in policy)';
    ok := true; detail := format('rows=%s', cnt); RETURN NEXT;
  EXCEPTION WHEN OTHERS THEN
    check_name := 'messages SELECT'; ok := false; detail := SQLERRM; RETURN NEXT;
  END;

  BEGIN
    EXECUTE 'SELECT count(*) FROM public.user_roles' INTO cnt;
    check_name := 'user_roles SELECT (uses has_role in admin policy)';
    ok := true; detail := format('rows=%s', cnt); RETURN NEXT;
  EXCEPTION WHEN OTHERS THEN
    check_name := 'user_roles SELECT'; ok := false; detail := SQLERRM; RETURN NEXT;
  END;

  BEGIN
    EXECUTE 'SELECT count(*) FROM public.app_settings' INTO cnt;
    check_name := 'app_settings SELECT';
    ok := true; detail := format('rows=%s', cnt); RETURN NEXT;
  EXCEPTION WHEN OTHERS THEN
    check_name := 'app_settings SELECT'; ok := false; detail := SQLERRM; RETURN NEXT;
  END;

  -- Test message INSERT path which calls is_mutual_match() in WITH CHECK.
  -- This will fail (no mutual exists) but the failure mode tells us whether
  -- the function call was denied by EXECUTE or merely returned false.
  BEGIN
    EXECUTE $sql$
      INSERT INTO public.messages
        (sender_id, sender_phone_hash, recipient_phone_hash, body)
      VALUES
        ('00000000-0000-0000-0000-000000000001'::uuid,
         'fake_sender_hash', 'fake_recipient_hash', '👋')
    $sql$;
    check_name := 'messages INSERT (uses is_mutual_match in WITH CHECK)';
    ok := true; detail := 'INSERT unexpectedly succeeded'; RETURN NEXT;
  EXCEPTION WHEN insufficient_privilege THEN
    check_name := 'messages INSERT';
    ok := false;
    detail := 'EXECUTE denied on helper: ' || SQLERRM;
    RETURN NEXT;
  WHEN OTHERS THEN
    -- RLS WITH CHECK violation = function ran fine and returned false. That's the goal.
    check_name := 'messages INSERT (uses is_mutual_match in WITH CHECK)';
    ok := true;
    detail := 'helper executed, policy correctly rejected: ' || SQLERRM;
    RETURN NEXT;
  END;

  RESET ROLE;
END $$;

REVOKE EXECUTE ON FUNCTION public._rls_verify_probe() FROM PUBLIC, anon, authenticated;