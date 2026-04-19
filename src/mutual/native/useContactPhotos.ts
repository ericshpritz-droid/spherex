import { useEffect, useState } from "react";
import { isNative } from "./platform";
import { loadContactPhotos, type ContactPhotoMap } from "./contactPhotos";

/**
 * React hook that loads device contact photos once per session on native iOS,
 * and returns an empty map on web. Cards can do:
 *
 *   const photos = useContactPhotos();
 *   const photo = photos.get(match.id); // match.id IS the phone hash
 */
export function useContactPhotos(): ContactPhotoMap {
  const [photos, setPhotos] = useState<ContactPhotoMap>(() => new Map());

  useEffect(() => {
    if (!isNative()) return;
    let cancelled = false;
    loadContactPhotos()
      .then((map) => {
        if (!cancelled) setPhotos(map);
      })
      .catch(() => {
        // Silent — fall back to gradient initials.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return photos;
}
