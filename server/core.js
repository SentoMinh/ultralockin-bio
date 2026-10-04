// Shared server helpers for the Pages Functions: responses, cookies, sessions,
// Discord login.

const SESSION_COOKIE = "bio_session";
const SESSION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });

export const fail = (status, code, extra = {}) => json({ error: code, ...extra }, status);

export const redirect = (location, cookies = []) => {
  const headers = new Headers({ location, "cache-control": "no-store" });
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new Response(null, { status: 302, headers });
};

export function readCookie(request, name) {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

export function makeCookie(request, name, value, maxAgeSeconds) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

// Changes are only accepted from the site's own pages (blocks cross-site requests).
export function sameOrigin(request) {
  const origin = request.headers.get("origin");
  return Boolean(origin) && origin === new URL(request.url).origin;
}

export const isLocalRequest = (request) => ["127.0.0.1", "localhost"].includes(new URL(request.url).hostname);

export function randomToken(bytes = 32) {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...data)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function sha256Hex(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const adminIds = (env) =>
  String(env.ADMIN_DISCORD_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

export const isAdmin = (env, user) => Boolean(user) && adminIds(env).includes(user.discord_id);

// ---------- sessions ----------

export async function createSession(request, env, userId) {
  const token = randomToken();
  await env.DB.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(await sha256Hex(token), userId, Date.now() + SESSION_DAYS * DAY_MS)
    .run();
  return makeCookie(request, SESSION_COOKIE, token, SESSION_DAYS * 24 * 60 * 60);
}

export async function getUser(request, env) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const user = await env.DB.prepare(
    "SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.id = ? AND sessions.expires_at > ? AND users.banned = 0",
  )
    .bind(await sha256Hex(token), Date.now())
    .first();
  return user ?? null;
}

export async function destroySession(request, env) {
  const token = readCookie(request, SESSION_COOKIE);
  if (token) await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(await sha256Hex(token)).run();
  return makeCookie(request, SESSION_COOKIE, "", 0);
}

// ---------- sign-in (shared by Discord login and the local dev login) ----------

// New accounts need an unused invite code, except the admins listed in
// ADMIN_DISCORD_IDS. Returns { user } or { error }.
export async function signIn(env, discordUser, inviteCode) {
  const now = Date.now();
  const name = discordUser.global_name || discordUser.username || "";
  const existing = await env.DB.prepare("SELECT * FROM users WHERE discord_id = ?").bind(discordUser.id).first();

  if (existing) {
    if (existing.banned) return { error: "banned" };
    await env.DB.prepare("UPDATE users SET discord_username = ?, discord_name = ?, discord_avatar = ? WHERE id = ?")
      .bind(discordUser.username ?? "", name, discordUser.avatar ?? "", existing.id)
      .run();
    return { user: existing };
  }

  const id = crypto.randomUUID();
  if (!adminIds(env).includes(discordUser.id)) {
    const code = String(inviteCode ?? "").trim().toUpperCase();
    if (!code) return { error: "invite_required" };
    // Claimed in one statement, so a code can never be used twice.
    const claim = await env.DB.prepare(
      "UPDATE invites SET used_by = ?, used_at = ? WHERE code = ? AND used_by IS NULL",
    )
      .bind(id, now, code)
      .run();
    if (!claim.meta?.changes) return { error: "invite_invalid" };
  }
  await env.DB.prepare(
    "INSERT INTO users (id, discord_id, discord_username, discord_name, discord_avatar, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  )
    .bind(id, discordUser.id, discordUser.username ?? "", name, discordUser.avatar ?? "", now)
    .run();
  return { user: { id, discord_id: discordUser.id } };
}

// ---------- Discord OAuth ----------

export function discordAuthorizeUrl({ clientId, redirectUri, state }) {
  const url = new URL("https://discord.com/oauth2/authorize");
  url.search = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "identify",
    state,
  }).toString();
  return url.toString();
}

export async function fetchDiscordUser({ clientId, clientSecret, code, redirectUri }) {
  const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!tokenResponse.ok) return null;
  const { access_token: accessToken } = await tokenResponse.json();
  if (!accessToken) return null;
  const userResponse = await fetch("https://discord.com/api/users/@me", {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!userResponse.ok) return null;
  const user = await userResponse.json();
  return user?.id ? user : null;
}

export function discordAvatarUrl(user) {
  if (!user?.discord_avatar) return "";
  const ext = user.discord_avatar.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${user.discord_id}/${user.discord_avatar}.${ext}?size=128`;
}

// ---------- view counting ----------

const BOT_PATTERN =
  /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|monitor|curl|wget|python-requests/i;

export const looksLikeBot = (userAgent) => !userAgent || BOT_PATTERN.test(userAgent);

export const utcDay = (date = new Date()) => date.toISOString().slice(0, 10);
