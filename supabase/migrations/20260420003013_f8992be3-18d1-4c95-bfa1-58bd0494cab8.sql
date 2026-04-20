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
    SELECT NULLIF(current_setting('app.phone_pepper', true), '') AS p
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