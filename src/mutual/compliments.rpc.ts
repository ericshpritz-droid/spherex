// Client-only RPC wrappers for compliment server functions.
import { createClientOnlyFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  sendComplimentServer,
  loadInboxComplimentsServer,
  loadSentComplimentsServer,
  unsendComplimentServer,
} from "./compliments.functions";

async function bearerHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not authenticated");
  return { Authorization: `Bearer ${token}` };
}

export type InboxCompliment = {
  id: string;
  body: string;
  adverb: string;
  adjective: string;
  created_at: string;
};

export type SentCompliment = InboxCompliment & {
  recipient_phone_hash: string;
  intent: string;
};

export const callSendCompliment = createClientOnlyFn(
  async (args: {
    recipientPhone?: string;
    recipientPhoneHash?: string;
    adverb: string;
    adjective: string;
    body: string;
    intent?: "compliment" | "both";
    pickId?: string;
  }) => {
    const headers = await bearerHeaders();
    return await sendComplimentServer({ data: args, headers });
  },
);

export const callLoadInboxCompliments = createClientOnlyFn(
  async (): Promise<InboxCompliment[]> => {
    const headers = await bearerHeaders();
    const { compliments } = await loadInboxComplimentsServer({ headers });
    return compliments as InboxCompliment[];
  },
);

export const callLoadSentCompliments = createClientOnlyFn(
  async (): Promise<SentCompliment[]> => {
    const headers = await bearerHeaders();
    const { compliments } = await loadSentComplimentsServer({ headers });
    return compliments as SentCompliment[];
  },
);

export const callUnsendCompliment = createClientOnlyFn(async (id: string) => {
  const headers = await bearerHeaders();
  return await unsendComplimentServer({ data: { id }, headers });
});
