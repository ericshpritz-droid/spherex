// Helper to call our server functions with the current user's Supabase
// access token attached as a Bearer header (required by `requireSupabaseAuth`).

import { supabase } from "@/integrations/supabase/client";
import {
  addPhonesServer,
  loadAddsAndMatchesServer,
  getMyPhoneHash,
  backfillPhoneHashes,
} from "./dataApi.functions";

async function bearerHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not authenticated");
  return { Authorization: `Bearer ${token}` };
}

export async function callAddPhones(phones: string[]): Promise<{ inserted: number }> {
  const headers = await bearerHeaders();
  return await addPhonesServer({ data: { phones }, headers });
}

export async function callLoadAddsAndMatches() {
  const headers = await bearerHeaders();
  return await loadAddsAndMatchesServer({ headers });
}

export async function callGetMyPhoneHash(): Promise<string> {
  const headers = await bearerHeaders();
  const { hash } = await getMyPhoneHash({ headers });
  return hash;
}

export async function callBackfillPhoneHashes(): Promise<{ updated: number }> {
  const headers = await bearerHeaders();
  return await backfillPhoneHashes({ headers });
}
