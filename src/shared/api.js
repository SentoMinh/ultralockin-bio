// Client for the bio server API (same origin; the session cookie rides along).

// The name shown in the UI. Set VITE_SITE_NAME in .env.local to brand your own site.
export const SITE_NAME = import.meta.env?.VITE_SITE_NAME || "bio";

// The address this site is served from (shown in "yoursite/username" hints).
export const SITE_HOST = typeof window !== "undefined" ? window.location.host : "";

async function request(method, path, body) {
  const options = { method, headers: {} };
  if (body instanceof FormData) {
    options.body = body;
  } else if (body !== undefined) {
    options.body = JSON.stringify(body);
    options.headers["content-type"] = "application/json";
  }
  const response = await fetch(path, options);
  let data = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON reply (for example a network or proxy error page).
  }
  if (!response.ok) {
    const error = new Error(data?.error ?? `http_${response.status}`);
    error.code = data?.error ?? "unknown";
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const api = {
  me: () => request("GET", "/api/me"),
  saveProfile: (username, config) => request("PUT", "/api/profile", { username, config }),
  logout: () => request("POST", "/api/auth/logout"),
  invites: () => request("GET", "/api/invites"),
  createInvites: (count) => request("POST", "/api/invites", { count }),
  upload: (file) => {
    const form = new FormData();
    form.append("file", file);
    return request("POST", "/api/upload", form);
  },
};

const ERROR_TEXT = {
  invalid_username: "Usernames are 3–24 characters: letters, numbers, _ or -. Some names are reserved.",
  username_taken: "That username is already taken.",
  unauthorized: "You're logged out. Log in again to continue.",
  too_large: "That's too big.",
  unsupported_type: "That file type isn't allowed. Use PNG, JPG, WEBP, GIF, MP3, OGG, WAV, M4A, MP4, WEBM or CUR.",
  quota_exceeded: "You've used all your upload space (250 MB).",
  uploads_not_configured: "Uploads aren't set up on the server yet. Paste a link instead.",
};

export function describeError(error) {
  if (error?.code === "too_large" && error.data?.maxMb) return `That file is too big (max ${error.data.maxMb} MB).`;
  return ERROR_TEXT[error?.code] ?? "Something went wrong. Try again.";
}
