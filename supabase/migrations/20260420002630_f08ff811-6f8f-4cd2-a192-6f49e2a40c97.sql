-- Replace is_mutual_match so the "self" side is always derived from the JWT.
-- The function now takes a single argument: the OTHER party's phone hash.
-- This eliminates any risk of a caller passing an arbitrary _a value.

CREATE OR REPLACE FUNCTION public.is_mutual_match(_other text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (SELECT public.current_user_phone_hash() AS h)
  SELECT
    (SELECT h FROM me) IS NOT NULL
    AND _other IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.adds
       WHERE adder_phone_hash = (SELECT h FROM me)
         AND added_phone_hash = _other
    )
    AND EXISTS (
      SELECT 1 FROM public.adds
       WHERE adder_phone_hash = _other
         AND added_phone_hash = (SELECT h FROM me)
    );
$$;

-- Update the messages INSERT policy to use the new single-arg signature.
DROP POLICY IF EXISTS "Users send messages only to mutual matches" ON public.messages;

CREATE POLICY "Users send messages only to mutual matches"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND public.current_user_phone_hash() IS NOT NULL
  AND sender_phone_hash = public.current_user_phone_hash()
  AND public.is_mutual_match(recipient_phone_hash)
);

-- Drop the old two-argument version so nothing can call it with arbitrary _a.
DROP FUNCTION IF EXISTS public.is_mutual_match(text, text);