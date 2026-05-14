-- Composer to spec: drop frame_id, add nullable pick_id FK to adds
ALTER TABLE public.compliments
  ALTER COLUMN frame_id DROP NOT NULL;

ALTER TABLE public.compliments
  ADD COLUMN IF NOT EXISTS pick_id uuid REFERENCES public.adds(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS compliments_pick_id_idx
  ON public.compliments (pick_id);

-- frame_id is now legacy; we keep the column nullable for existing rows but won't write to it.