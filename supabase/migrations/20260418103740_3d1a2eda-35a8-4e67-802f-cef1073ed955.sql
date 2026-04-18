-- Adds table: one row per "I added this phone"
CREATE TABLE public.adds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  adder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  adder_phone TEXT NOT NULL,
  added_phone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX adds_unique_pair ON public.adds (adder_phone, added_phone);
CREATE INDEX adds_added_phone_idx ON public.adds (added_phone);
CREATE INDEX adds_adder_id_idx ON public.adds (adder_id);

ALTER TABLE public.adds ENABLE ROW LEVEL SECURITY;

-- Privacy: users only see their own outgoing adds (NEVER who added them)
CREATE POLICY "Users see only their own adds"
  ON public.adds FOR SELECT
  TO authenticated
  USING (auth.uid() = adder_id);

CREATE POLICY "Users insert their own adds"
  ON public.adds FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = adder_id
    AND adder_phone = (auth.jwt() ->> 'phone')
  );

CREATE POLICY "Users delete their own adds"
  ON public.adds FOR DELETE
  TO authenticated
  USING (auth.uid() = adder_id);

-- Matches view: a row exists when BOTH (A,B) and (B,A) are present.
-- For each authenticated user, returns the *other* phone + when the match formed.
CREATE VIEW public.matches
WITH (security_invoker = on) AS
SELECT
  a.adder_id        AS user_id,
  a.added_phone     AS other_phone,
  GREATEST(a.created_at, b.created_at) AS matched_at
FROM public.adds a
JOIN public.adds b
  ON b.adder_phone = a.added_phone
 AND b.added_phone = a.adder_phone;

GRANT SELECT ON public.matches TO authenticated;