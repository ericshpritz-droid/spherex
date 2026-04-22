CREATE POLICY "No client access to phone auth identities"
ON public.phone_auth_identities
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "No client access to phone verification challenges"
ON public.phone_verification_challenges
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);