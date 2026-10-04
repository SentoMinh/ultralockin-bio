import { useEffect, useState } from "react";

// Files uploaded in the editor live in this browser's IndexedDB. The config
// stores "idb:<key>", and both the editor and the preview resolve it to a blob URL.
const DB_NAME = "bio-editor";
const STORE = "media";
const PREFIX = "idb:";

let dbPromise;

function openDb() {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

async function withStore(mode, action) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = action(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export const isMediaRef = (value) => typeof value === "string" && value.startsWith(PREFIX);

export async function saveMedia(file) {
  const key = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  await withStore("readwrite", (store) =>
    store.put({ blob: file, name: file.name, type: file.type }, key),
  );
  return PREFIX + key;
}

const getMedia = (ref) => withStore("readonly", (store) => store.get(ref.slice(PREFIX.length)));

// Resolves "idb:<key>" to an object URL; plain URLs pass through untouched.
export function useMediaUrl(value) {
  const [resolved, setResolved] = useState({ ref: "", url: "" });

  useEffect(() => {
    if (!isMediaRef(value)) return undefined;
    let alive = true;
    let objectUrl = "";
    getMedia(value)
      .then((entry) => {
        if (!alive || !entry?.blob) return;
        objectUrl = URL.createObjectURL(entry.blob);
        setResolved({ ref: value, url: objectUrl });
      })
      .catch(() => {});
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [value]);

  if (!isMediaRef(value)) return value || "";
  return resolved.ref === value ? resolved.url : "";
}

export function useMediaName(value) {
  const [entry, setEntry] = useState({ ref: "", name: "" });

  useEffect(() => {
    if (!isMediaRef(value)) return undefined;
    let alive = true;
    getMedia(value)
      .then((media) => alive && setEntry({ ref: value, name: media?.name ?? "" }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [value]);

  return entry.ref === value ? entry.name : "";
}
