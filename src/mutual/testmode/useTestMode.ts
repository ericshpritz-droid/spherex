// Hook + helpers for test mode. DELETE THIS FOLDER TO REMOVE TEST MODE.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useTestMode() {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("app_settings")
      .select("test_mode")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (!cancelled) {
          setEnabled(!!data?.test_mode);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  return { enabled, loading };
}

export function useIsAdmin(userId: string | undefined) {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (!userId) { setIsAdmin(false); return; }
    let cancelled = false;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => { if (!cancelled) setIsAdmin(!!data); });
    return () => { cancelled = true; };
  }, [userId]);
  return isAdmin;
}
