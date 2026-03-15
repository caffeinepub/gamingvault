import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "h4ck_patreon_url";
const EVENT_NAME = "patreon_url_changed";

export function usePatreonUrl(): string {
  const [url, setUrl] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? "",
  );

  useEffect(() => {
    const handler = () => {
      setUrl(localStorage.getItem(STORAGE_KEY) ?? "");
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  return url;
}

export function usePatreonUrlEditor(): [
  string,
  (url: string) => void,
  () => void,
] {
  const [draft, setDraft] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? "",
  );

  const save = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    window.dispatchEvent(new Event(EVENT_NAME));
  }, [draft]);

  return [draft, setDraft, save];
}
