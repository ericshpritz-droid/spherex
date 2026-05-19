-- Private table holding the phone pepper (and future secrets) so the
-- SECURITY DEFINER hash function can read it without depending on a
-- database-level GUC (which was never set out-of-band).
CREATE TABLE IF NOT EXISTS public.app_secrets (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No client access to app_secrets" ON public.app_secrets;
CREATE POLICY "No client access to app_secrets"
ON public.app_secrets
AS PERMISSIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- Update current_user_phone_hash to fall back to app_secrets when the
-- session GUC is not set. Keeps backward compatibility with deployments
-- that do set app.phone_pepper at the database level.
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
    SELECT coalesce(
      NULLIF(current_setting('app.phone_pepper', true), ''),
      (SELECT value FROM public.app_secrets WHERE key = 'phone_pepper')
    ) AS p
  )
  SELECT CASE
    WHEN (SELECT digits FROM raw_phone) IS NULL THEN NULL
    WHEN (SELECT p FROM pepper) IS NULL THEN NULL
    ELSE encode(
      extensions.digest(
        (SELECT p FROM pepper) || '+' || (SELECT digits FROM raw_phone),
        'sha256'
      ),
      'hex'
    )
  END;
$$;
