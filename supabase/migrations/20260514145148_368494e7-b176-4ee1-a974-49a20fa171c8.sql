-- Anonymous mad-lib compliments. Sender info is recorded so RLS can enforce
-- "you can only send as yourself" and so we can later compute mutual matches,
-- but server functions never project sender identity to recipients.
CREATE TABLE public.compliments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  sender_phone_hash TEXT NOT NULL,
  recipient_phone_hash TEXT NOT NULL,
  frame_id TEXT NOT NULL,
  adverb TEXT NOT NULL,
  adjective TEXT NOT NULL,
  body TEXT NOT NULL,
  intent TEXT NOT NULL DEFAULT 'compliment',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_compliments_recipient ON public.compliments(recipient_phone_hash, created_at DESC);
CREATE INDEX idx_compliments_sender ON public.compliments(sender_id, created_at DESC);

ALTER TABLE public.compliments ENABLE ROW LEVEL SECURITY;

-- Sender can see what they sent (history).
CREATE POLICY "Senders see their own sent compliments"
ON public.compliments
FOR SELECT
TO authenticated
USING (auth.uid() = sender_id);

-- Recipient can see compliments addressed to their phone hash. The server
-- function strips sender identity columns before returning to clients.
CREATE POLICY "Recipients see compliments sent to them"
ON public.compliments
FOR SELECT
TO authenticated
USING (
  current_user_phone_hash() IS NOT NULL
  AND recipient_phone_hash = current_user_phone_hash()
);

-- Sender can insert a compliment as themselves (any recipient — match isn't
-- required for compliments, that's the whole point).
CREATE POLICY "Users send compliments as themselves"
ON public.compliments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND current_user_phone_hash() IS NOT NULL
  AND sender_phone_hash = current_user_phone_hash()
);

-- Sender may unsend within 60 seconds.
CREATE POLICY "Users can unsend their own recent compliments"
ON public.compliments
FOR DELETE
TO authenticated
USING (
  auth.uid() = sender_id
  AND created_at > (now() - interval '1 minute')
);