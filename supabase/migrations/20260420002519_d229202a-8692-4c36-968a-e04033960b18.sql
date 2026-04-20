DROP POLICY IF EXISTS "Users can only subscribe to their own channels" ON realtime.messages;

CREATE POLICY "Users can only subscribe to their own channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  public.current_user_phone_hash() IS NOT NULL
  AND (
    topic = ('adds-for-' || public.current_user_phone_hash())
    OR topic = ('msgs-for-' || public.current_user_phone_hash())
  )
);