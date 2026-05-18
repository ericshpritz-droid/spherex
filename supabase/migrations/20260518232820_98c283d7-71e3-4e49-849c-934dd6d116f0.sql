
-- Make sure RLS stays on.
ALTER TABLE public.adds ENABLE ROW LEVEL SECURITY;

-- Tighten INSERT: bind both the auth user AND their phone hash so a user
-- cannot insert a row claiming someone else's hashed phone as their own.
DROP POLICY IF EXISTS "Users insert their own adds" ON public.adds;

CREATE POLICY "Users insert their own adds"
  ON public.adds
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = adder_id
    AND public.current_user_phone_hash() IS NOT NULL
    AND adder_phone_hash = public.current_user_phone_hash()
  );

-- Explicitly forbid UPDATE on adds. There is no policy today (so updates are
-- already denied by default), but creating a restrictive no-op policy makes
-- the intent explicit and future-proof against an accidental permissive policy.
DROP POLICY IF EXISTS "No updates to adds" ON public.adds;

CREATE POLICY "No updates to adds"
  ON public.adds
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);
