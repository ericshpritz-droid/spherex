
CREATE TABLE IF NOT EXISTS public.test_share_codes (
  code TEXT PRIMARY KEY,
  owner_user_id UUID NOT NULL,
  owner_phone_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  consumed_by_user_id UUID
);

CREATE INDEX IF NOT EXISTS test_share_codes_owner_idx ON public.test_share_codes (owner_user_id);
CREATE INDEX IF NOT EXISTS test_share_codes_expires_idx ON public.test_share_codes (expires_at);

ALTER TABLE public.test_share_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No client access to test share codes"
  ON public.test_share_codes
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
