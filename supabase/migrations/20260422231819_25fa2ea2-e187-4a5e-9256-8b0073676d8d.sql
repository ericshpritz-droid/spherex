CREATE TABLE IF NOT EXISTS public.phone_auth_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  phone_e164 TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.phone_auth_identities ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.phone_verification_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_e164 TEXT NOT NULL UNIQUE,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.phone_verification_challenges ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_phone_auth_identities_phone_e164 ON public.phone_auth_identities (phone_e164);
CREATE INDEX IF NOT EXISTS idx_phone_verification_challenges_expires_at ON public.phone_verification_challenges (expires_at);

CREATE OR REPLACE FUNCTION public.update_updated_at_column_generic()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_phone_auth_identities_updated_at ON public.phone_auth_identities;
CREATE TRIGGER update_phone_auth_identities_updated_at
BEFORE UPDATE ON public.phone_auth_identities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column_generic();

DROP TRIGGER IF EXISTS update_phone_verification_challenges_updated_at ON public.phone_verification_challenges;
CREATE TRIGGER update_phone_verification_challenges_updated_at
BEFORE UPDATE ON public.phone_verification_challenges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column_generic();