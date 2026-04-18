-- 1. Add hashed columns (nullable for now, NOT NULL after backfill)
ALTER TABLE public.adds
  ADD COLUMN adder_phone_hash text,
  ADD COLUMN added_phone_hash text;

CREATE INDEX adds_added_phone_hash_idx ON public.adds (added_phone_hash);
CREATE INDEX adds_adder_phone_hash_idx ON public.adds (adder_phone_hash);

-- 2. Relax INSERT policy: drop the raw-phone equality check.
-- The trusted server function (using the pepper) is now responsible for
-- writing matching hashes. We still require adder_id = auth.uid().
DROP POLICY IF EXISTS "Users insert their own adds" ON public.adds;
CREATE POLICY "Users insert their own adds"
  ON public.adds FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = adder_id);

-- 3. Recreate matches view to join on hashes.
-- Returns only the other party's HASH; the client resolves it to a readable
-- number using its local map of contacts it has added (whose raw values it
-- already knows). Raw phones never leak through this view.
DROP VIEW IF EXISTS public.matches;
CREATE VIEW public.matches
WITH (security_invoker = on) AS
SELECT
  a.adder_id              AS user_id,
  a.added_phone_hash      AS other_phone_hash,
  GREATEST(a.created_at, b.created_at) AS matched_at
FROM public.adds a
JOIN public.adds b
  ON b.adder_phone_hash = a.added_phone_hash
 AND b.added_phone_hash = a.adder_phone_hash
WHERE a.adder_phone_hash IS NOT NULL
  AND a.added_phone_hash IS NOT NULL;

GRANT SELECT ON public.matches TO authenticated;