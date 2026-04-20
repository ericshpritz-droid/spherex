-- 1. Helper: derive the caller's verified phone hash directly from auth.jwt(),
--    so RLS policies don't rely on client-supplied phone hashes.
CREATE OR REPLACE FUNCTION public.current_user_phone_hash()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  WITH raw_phone AS (
    SELECT NULLIF(regexp_replace(coalesce((auth.jwt() ->> 'phone'), ''), '\D', '', 'g'), '') AS digits
  ),
  pepper AS (
    SELECT current_setting('app.phone_pepper', true) AS p
  )
  SELECT CASE
    WHEN (SELECT digits FROM raw_phone) IS NULL THEN NULL
    ELSE encode(
      extensions.digest(
        coalesce((SELECT p FROM pepper), '') || '+' || (SELECT digits FROM raw_phone),
        'sha256'
      ),
      'hex'
    )
  END;
$$;

-- NOTE: The application also hashes phones server-side using PHONE_PEPPER. The
-- DB-side current_user_phone_hash() above mirrors that recipe so policies can
-- match values stored in the messages / adds tables. Set the matching pepper
-- value at the database level once via:
--   ALTER DATABASE postgres SET app.phone_pepper = '<PHONE_PEPPER value>';
-- (Run that out of band; we cannot ALTER DATABASE here.)

-- 2. Replace the over-permissive SELECT policy on messages with one that
--    requires the authenticated user to be either the sender OR the verified
--    recipient (i.e. their JWT phone hash matches recipient_phone_hash).
DROP POLICY IF EXISTS "Users see messages they sent or received" ON public.messages;

CREATE POLICY "Users see messages they sent or received"
ON public.messages
FOR SELECT
TO authenticated
USING (
  auth.uid() = sender_id
  OR (
    public.current_user_phone_hash() IS NOT NULL
    AND recipient_phone_hash = public.current_user_phone_hash()
  )
);

-- 3. Tighten the INSERT policy so the sender_phone_hash on the row must match
--    the caller's verified phone hash, not just any value with a mutual match.
DROP POLICY IF EXISTS "Users send messages only to mutual matches" ON public.messages;

CREATE POLICY "Users send messages only to mutual matches"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND public.current_user_phone_hash() IS NOT NULL
  AND sender_phone_hash = public.current_user_phone_hash()
  AND public.is_mutual_match(sender_phone_hash, recipient_phone_hash)
);

-- 4. Make the implicit "no SELECT policy" on test_accounts explicit by adding
--    an owner-only read policy. RLS is enabled and there are still no INSERT/
--    UPDATE/DELETE policies, so PINs remain unreachable to clients except for
--    the one the user themselves owns (used for "what's my PIN" UI).
CREATE POLICY "Test users can read their own test account"
ON public.test_accounts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 5. Tighten realtime: by default any authenticated user can subscribe to
--    any topic on supabase_realtime. Add an RLS policy on realtime.messages
--    that limits subscriptions to the user-specific channels we use in the
--    app: `adds-for-<myhash12>` and `msgs-for-<myhash12>`.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only subscribe to their own channels" ON realtime.messages;

CREATE POLICY "Users can only subscribe to their own channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  public.current_user_phone_hash() IS NOT NULL
  AND (
    topic = 'adds-for-' || left(public.current_user_phone_hash(), 12)
    OR topic = 'msgs-for-' || left(public.current_user_phone_hash(), 12)
  )
);
