CREATE POLICY "Users can unsend their own recent messages"
ON public.messages
FOR DELETE
TO authenticated
USING (
  auth.uid() = sender_id
  AND created_at > now() - interval '60 seconds'
);