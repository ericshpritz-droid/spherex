-- Drop legacy unique index on raw phones
DROP INDEX IF EXISTS public.adds_unique_pair;

-- Drop raw phone columns
ALTER TABLE public.adds
  DROP COLUMN IF EXISTS adder_phone,
  DROP COLUMN IF EXISTS added_phone;

-- Make hash columns required and uniquely paired
ALTER TABLE public.adds
  ALTER COLUMN adder_phone_hash SET NOT NULL,
  ALTER COLUMN added_phone_hash SET NOT NULL;

CREATE UNIQUE INDEX adds_unique_hash_pair
  ON public.adds (adder_phone_hash, added_phone_hash);