export const PENDING_ORIGINAL_DOWNLOAD = 'nb-original-download';
export const LAST_STUDIO_PREVIEW = 'nb-studio-preview';
export const LAST_HALLOWEEN_PREVIEW = 'nb-halloween-preview';

/** Persist only the opaque image ID so sign-in and checkout can return to the same result. */
export function rememberImage(key: string, id: string | null) {
  try {
    if (id) localStorage.setItem(key, id);
    else localStorage.removeItem(key);
  } catch {
    /* Browser storage is optional. */
  }
}

export function recalledImage(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
