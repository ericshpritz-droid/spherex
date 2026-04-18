// Helper to call our server functions with the current user's Supabase
// access token attached as a Bearer header (required by `requireSupabaseAuth`).
//
// All exported functions are wrapped with `createClientOnlyFn` so they're
// safely no-ops during SSR — preventing the import-protection plugin from
// flagging us when AppContext (which lives in the SSR graph) imports them.

import { createClientOnlyFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  addPhonesServer,
  loadAddsAndMatchesServer,
  getMyPhoneHash,
  hashPhonesServer,
  backfillPhoneHashes,
} from "./dataApi.functions";

async function bearerHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not authenticated");
  return { Authorization: `Bearer ${token}` };
}

export const callAddPhones = createClientOnlyFn(
  async (phones: string[]): Promise<{ inserted: number }> => {
    const headers = await bearerHeaders();
    return await addPhonesServer({ data: { phones }, headers });
  },
);

export const callLoadAddsAndMatches = createClientOnlyFn(async () => {
  const headers = await bearerHeaders();
  return await loadAddsAndMatchesServer({ headers });
});

export const callGetMyPhoneHash = createClientOnlyFn(async (): Promise<string> => {
  const headers = await bearerHeaders();
  const { hash } = await getMyPhoneHash({ headers });
  return hash;
});

export const callHashPhones = createClientOnlyFn(
  async (phones: string[]): Promise<string[]> => {
    if (phones.length === 0) return [];
    const headers = await bearerHeaders();
    const { hashes } = await hashPhonesServer({ data: { phones }, headers });
    return hashes;
  },
);

export const callBackfillPhoneHashes = createClientOnlyFn(
  async (): Promise<{ updated: number }> => {
    const headers = await bearerHeaders();
    return await backfillPhoneHashes({ headers });
  },
);
