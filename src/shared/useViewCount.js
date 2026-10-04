import { useEffect, useState } from "react";

// Same counter API as the website: GET /api/views/:id reads, POST counts a visit.
// By default it talks to this dev server (shared local store). To show the live
// site's number instead, set VITE_VIEWS_API to the site's address in .env.local.
const API_BASE = String(import.meta.env.VITE_VIEWS_API ?? "").replace(/\/$/, "");
const REFRESH_MS = 20000;

async function request(id, method) {
  const response = await fetch(`${API_BASE}/api/views/${encodeURIComponent(id)}`, { method });
  if (!response.ok) throw new Error(`views ${response.status}`);
  const data = await response.json();
  if (!Number.isFinite(data.views)) throw new Error("views missing");
  return data.views;
}

// Returns the profile's view total, or null while loading / when unreachable.
// `count: true` records this visit (the real page). Without it the hook only
// reads, which is what the editor preview uses so editing never adds views.
export function useViewCount(username, { count = false } = {}) {
  const id = String(username ?? "").trim().toLowerCase();
  const [state, setState] = useState({ id: "", views: null });

  useEffect(() => {
    if (!id) return undefined;
    let alive = true;
    const apply = (views) => {
      if (alive) setState({ id, views });
    };
    const read = () => request(id, "GET").then(apply).catch(() => {});
    // If counting is refused (for example from another origin), still show the number.
    if (count) request(id, "POST").then(apply).catch(read);
    else read();
    const timer = setInterval(read, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [id, count]);

  return state.id === id ? state.views : null;
}
