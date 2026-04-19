import { useCallback, useEffect, useState } from "react";
import { isNative } from "./platform";
import { loadContactPhotos, type ContactPhotoMap } from "./contactPhotos";
import { getContactPhotosEnabled } from "./contactPhotosPref";

export type ContactPhotoStatus =
  | "unsupported" // web — no native contacts API
  | "disabled"    // native, but user toggled the in-app preference off
  | "loading"
  | "ready"       // photos map populated (may be empty if no matches)
  | "denied"      // permission denied at OS level
  | "error";

interface UseContactPhotosResult {
  photos: ContactPhotoMap;
  status: ContactPhotoStatus;
  reload: () => Promise<void>;
}

/**
 * React hook that loads device contact photos once per session on native iOS,
 * and returns an empty map on web. Cards can do:
 *
 *   const { photos } = useContactPhotos();
 *   const photo = photos.get(match.id); // match.id IS the phone hash
 */
export function useContactPhotos(): UseContactPhotosResult {
  const [photos, setPhotos] = useState<ContactPhotoMap>(() => new Map());
  const [status, setStatus] = useState<ContactPhotoStatus>(() => {
    if (!isNative()) return "unsupported";
    if (!getContactPhotosEnabled()) return "disabled";
    return "loading";
  });

  const run = useCallback(async () => {
    if (!isNative()) {
      setPhotos(new Map());
      setStatus("unsupported");
      return;
    }
    if (!getContactPhotosEnabled()) {
      setPhotos(new Map());
      setStatus("disabled");
      return;
    }
    setStatus("loading");
    try {
      const map = await loadContactPhotos();
      setPhotos(map);
      // loadContactPhotos returns an empty map on permission denial too;
      // we can't distinguish here without re-querying, so re-check perms.
      const { Contacts } = await import("@capacitor-community/contacts");
      const perm = await Contacts.checkPermissions();
      setStatus(perm.contacts === "granted" ? "ready" : "denied");
    } catch {
      setPhotos(new Map());
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    run().catch(() => {
      if (!cancelled) setStatus("error");
    });

    // React to the in-app preference being toggled elsewhere.
    const onPrefChange = () => {
      run();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("sphere:contact-photos-pref", onPrefChange);
    }
    return () => {
      cancelled = true;
      if (typeof window !== "undefined") {
        window.removeEventListener("sphere:contact-photos-pref", onPrefChange);
      }
    };
  }, [run]);

  return { photos, status, reload: run };
}
