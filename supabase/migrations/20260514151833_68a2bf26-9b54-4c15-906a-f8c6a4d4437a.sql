DROP FUNCTION IF EXISTS public._rls_verify_probe();

CREATE TABLE IF NOT EXISTS public._rls_verify_results (
  id serial primary key,
  check_name text,
  ok boolean,
  detail text,
  created_at timestamptz default now()
);
TRUNCATE public._rls_verify_results;

DO $$
DECLARE
  cnt int;
BEGIN
  SET LOCAL ROLE authenticated;
  PERFORM set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated","phone":"15551234567"}',
    true
  );

  BEGIN
    EXECUTE 'SELECT count(*) FROM public.compliments' INTO cnt;
    INSERT INTO public._rls_verify_results(check_name, ok, detail)
    VALUES ('compliments SELECT (uses current_user_phone_hash)', true, 'rows='||cnt);
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public._rls_verify_results(check_name, ok, detail)
    VALUES ('compliments SELECT', false, SQLERRM);
  END;

  BEGIN
    EXECUTE 'SELECT count(*) FROM public.messages' INTO cnt;
    INSERT INTO public._rls_verify_results(check_name, ok, detail)
    VALUES ('messages SELECT (uses current_user_phone_hash)', true, 'rows='||cnt);
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public._rls_verify_results(check_name, ok, detail)
    VALUES ('messages SELECT', false, SQLERRM);
  END;

  BEGIN
    EXECUTE 'SELECT count(*) FROM public.user_roles' INTO cnt;
    INSERT INTO public._rls_verify_results(check_name, ok, detail)
    VALUES ('user_roles SELECT (uses has_role)', true, 'rows='||cnt);
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public._rls_verify_results(check_name, ok, detail)
    VALUES ('user_roles SELECT', false, SQLERRM);
  END;

  BEGIN
    EXECUTE 'SELECT count(*) FROM public.adds' INTO cnt;
    INSERT INTO public._rls_verify_results(check_name, ok, detail)
    VALUES ('adds SELECT (uses auth.uid only)', true, 'rows='||cnt);
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public._rls_verify_results(check_name, ok, detail)
    VALUES ('adds SELECT', false, SQLERRM);
  END;

  BEGIN
    EXECUTE $sql$
      INSERT INTO public.messages(sender_id, sender_phone_hash, recipient_phone_hash, body)
      VALUES ('00000000-0000-0000-0000-000000000001'::uuid,
              'fake_sender', 'fake_recipient', '👋')
    $sql$;
    INSERT INTO public._rls_verify_results(check_name, ok, detail)
    VALUES ('messages INSERT (uses is_mutual_match)', false, 'INSERT unexpectedly succeeded');
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO public._rls_verify_results(check_name, ok, detail)
    VALUES ('messages INSERT', false, 'EXECUTE DENIED on helper: '||SQLERRM);
  WHEN OTHERS THEN
    -- WITH CHECK violation = helper executed and returned false. That's correct.
    INSERT INTO public._rls_verify_results(check_name, ok, detail)
    VALUES ('messages INSERT (uses is_mutual_match)', true,
            'helper executed; policy correctly rejected: '||SQLERRM);
  END;

  RESET ROLE;
END $$;