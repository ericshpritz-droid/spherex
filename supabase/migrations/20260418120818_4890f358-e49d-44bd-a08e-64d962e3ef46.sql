-- Messages between mutually-matched users.
-- Identity is phone-hash-based (same model as `adds`); we also store sender_id
-- for RLS scoping and audit. No raw phones, no profile rows.
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  sender_phone_hash TEXT NOT NULL,
  recipient_phone_hash TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_pair_created
  ON public.messages (sender_phone_hash, recipient_phone_hash, created_at DESC);
CREATE INDEX idx_messages_recipient_created
  ON public.messages (recipient_phone_hash, created_at DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Validation trigger: enforce length cap and emoji-only body.
-- Uses Unicode property classes; allows emoji, ZWJ, variation selectors,
-- skin-tone modifiers, regional indicators, and keycap combiners.
CREATE OR REPLACE FUNCTION public.validate_message_body()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  stripped TEXT;
BEGIN
  IF NEW.body IS NULL OR length(NEW.body) = 0 THEN
    RAISE EXCEPTION 'Message body cannot be empty';
  END IF;
  IF char_length(NEW.body) > 8 THEN
    RAISE EXCEPTION 'Message body must be 8 characters or fewer';
  END IF;
  -- Strip every codepoint that's part of an allowed emoji sequence.
  -- If anything remains, the message contains non-emoji content.
  stripped := regexp_replace(
    NEW.body,
    '[\p{Extended_Pictographic}\p{Emoji_Component}\p{Regional_Indicator}\u200D\uFE0F\u20E3]',
    '',
    'g'
  );
  IF length(stripped) > 0 THEN
    RAISE EXCEPTION 'Message body must contain only emoji';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_message_body
BEFORE INSERT OR UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.validate_message_body();

-- Helper: is there a mutual match between these two phone hashes?
CREATE OR REPLACE FUNCTION public.is_mutual_match(_a TEXT, _b TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.adds
     WHERE adder_phone_hash = _a AND added_phone_hash = _b
  ) AND EXISTS (
    SELECT 1 FROM public.adds
     WHERE adder_phone_hash = _b AND added_phone_hash = _a
  )
$$;

-- RLS policies
CREATE POLICY "Users see messages they sent or received"
ON public.messages
FOR SELECT
TO authenticated
USING (
  auth.uid() = sender_id
  OR EXISTS (
    SELECT 1 FROM public.adds
     WHERE adder_id = auth.uid()
       AND adder_phone_hash = messages.recipient_phone_hash
  )
);

CREATE POLICY "Users send messages only to mutual matches"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND public.is_mutual_match(sender_phone_hash, recipient_phone_hash)
);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER TABLE public.messages REPLICA IDENTITY FULL;