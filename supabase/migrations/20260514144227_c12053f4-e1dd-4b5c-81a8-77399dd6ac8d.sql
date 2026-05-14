-- Add intent column to adds (picks) table
ALTER TABLE public.adds
  ADD COLUMN IF NOT EXISTS intent text NOT NULL DEFAULT 'romantic';

-- Constrain to known values
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'adds_intent_check'
  ) THEN
    ALTER TABLE public.adds
      ADD CONSTRAINT adds_intent_check
      CHECK (intent IN ('romantic', 'compliment', 'both'));
  END IF;
END $$;