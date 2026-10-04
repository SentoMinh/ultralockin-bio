import {
  createSession,
  destroySession,
  discordAuthorizeUrl,
  discordAvatarUrl,
  fail,
  fetchDiscordUser,
  getUser,
  isAdmin,
  isLocalRequest,
  json,
  looksLikeBot,
  makeCookie,
  randomToken,
  readCookie,
  redirect,
  sameOrigin,
  sha256Hex,
  signIn,
  utcDay,
} from "./core.js";
import { MAX_CONFIG_BYTES, normalizeUsername, sanitizeConfig } from "./profiles.js";

const OAUTH_COOKIE = "bio_oauth";

const publicUser = (user) => ({
  id: user.id,
  discordId: user.discord_id,
  username: user.discord_username,
  name: user.discord_name || user.discord_username,
  avatarUrl: discordAvatarUrl(user),
});

async function profileOf(env, userId) {
  const row = await env.DB.prepare("SELECT username, config, updated_at FROM profiles WHERE user_id = ?")
    .bind(userId)
    .first();
  return row ? { username: row.username, config: JSON.parse(row.config), updatedAt: row.updated_at } : null;
}

// ---------- login ----------

async function finishSignIn(request, env, discordUser, invite, cookies = []) {
  const result = await signIn(env, discordUser, invite);
  if (result.error) return redirect(`/?error=${result.error}`, cookies);
  return redirect("/dashboard", [...cookies, await createSession(request, env, result.user.id)]);
}

// GET /api/auth/login?invite=CODE -> Discord
export async function login({ request, env }) {
  if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET) return redirect("/?error=discord_not_configured");
  const url = new URL(request.url);
  const state = randomToken(16);
  const invite = (url.searchParams.get("invite") ?? "").trim().slice(0, 40);
  const authorize = discordAuthorizeUrl({
    clientId: env.DISCORD_CLIENT_ID,
    redirectUri: `${url.origin}/api/auth/callback`,
    state,
  });
  return redirect(authorize, [makeCookie(request, OAUTH_COOKIE, `${state}|${invite}`, 600)]);
}

// GET /api/auth/callback?code&state <- Discord
export async function callback({ request, env }) {
  const url = new URL(request.url);
  const [state, invite = ""] = readCookie(request, OAUTH_COOKIE).split("|");
  const clear = makeCookie(request, OAUTH_COOKIE, "", 0);
  const code = url.searchParams.get("code");
  // The state must match the one this browser was given, or the login is rejected.
  if (!code || !state || url.searchParams.get("state") !== state) return redirect("/?error=login_failed", [clear]);
  const discordUser = await fetchDiscordUser({
    clientId: env.DISCORD_CLIENT_ID,
    clientSecret: env.DISCORD_CLIENT_SECRET,
    code,
    redirectUri: `${url.origin}/api/auth/callback`,
  });
  if (!discordUser) return redirect("/?error=login_failed", [clear]);
  return finishSignIn(request, env, discordUser, invite, [clear]);
}

// GET /api/auth/dev-login?id=&name=&invite=  Local development only: needs
// DEV_LOGIN=1 in .dev.vars AND a 127.0.0.1/localhost address.
export async function devLogin({ request, env }) {
  if (env.DEV_LOGIN !== "1" || !isLocalRequest(request)) return fail(404, "not_found");
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  if (!/^\d{5,20}$/.test(id)) return fail(400, "invalid_id");
  const name = (url.searchParams.get("name") || "dev").slice(0, 32);
  const fakeUser = { id, username: name, global_name: name, avatar: "" };
  return finishSignIn(request, env, fakeUser, url.searchParams.get("invite") ?? "");
}

// POST /api/auth/logout
export async function logout({ request, env }) {
  if (!sameOrigin(request)) return fail(403, "cross_origin");
  return json({ ok: true }, 200, { "set-cookie": await destroySession(request, env) });
}

// GET /api/me
export async function me({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return fail(401, "unauthorized", { devLogin: env.DEV_LOGIN === "1" && isLocalRequest(request) });
  return json({ user: publicUser(user), isAdmin: isAdmin(env, user), profile: await profileOf(env, user.id) });
}

// ---------- profiles ----------

// PUT /api/profile  { username, config }
export async function saveProfile({ request, env }) {
  if (!sameOrigin(request)) return fail(403, "cross_origin");
  const user = await getUser(request, env);
  if (!user) return fail(401, "unauthorized");

  const body = await request.text();
  if (body.length > MAX_CONFIG_BYTES) return fail(413, "too_large");
  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    return fail(400, "invalid_json");
  }
  const username = normalizeUsername(payload?.username);
  if (!username) return fail(400, "invalid_username");

  const owner = await env.DB.prepare("SELECT user_id FROM profiles WHERE username = ?").bind(username).first();
  if (owner && owner.user_id !== user.id) return fail(409, "username_taken");

  const config = sanitizeConfig(payload.config, { username, discordId: user.discord_id });
  const now = Date.now();
  try {
    await env.DB.prepare(
      "INSERT INTO profiles (username, user_id, config, created_at, updated_at) VALUES (?, ?, ?, ?, ?) " +
        "ON CONFLICT(user_id) DO UPDATE SET username = excluded.username, config = excluded.config, updated_at = excluded.updated_at",
    )
      .bind(username, user.id, JSON.stringify(config), now, now)
      .run();
  } catch {
    // Someone claimed the name between the check and the write.
    return fail(409, "username_taken");
  }
  return json({ profile: { username, config, updatedAt: now } });
}

// GET /api/profiles/:username
export async function publicProfile({ env }, rawUsername) {
  const username = normalizeUsername(rawUsername);
  const row = username
    ? await env.DB.prepare("SELECT username, config FROM profiles WHERE username = ?").bind(username).first()
    : null;
  if (!row) return fail(404, "not_found");
  return json({ username: row.username, config: JSON.parse(row.config) });
}

// ---------- views ----------

// GET  /api/views/:username -> { id, views }
// POST /api/views/:username -> { id, views, counted }  one per person per day
export async function views(context, rawUsername) {
  const { request, env } = context;
  const username = normalizeUsername(rawUsername);
  const profile = username
    ? await env.DB.prepare("SELECT user_id FROM profiles WHERE username = ?").bind(username).first()
    : null;
  if (!profile) return fail(404, "not_found");

  const id = profile.user_id;
  const read = async () =>
    (await env.DB.prepare("SELECT views FROM view_counts WHERE id = ?").bind(id).first())?.views ?? 0;

  if (request.method === "GET") return json({ id: username, views: await read() });
  if (!sameOrigin(request)) return fail(403, "cross_origin");
  if (looksLikeBot(request.headers.get("user-agent"))) {
    return json({ id: username, views: await read(), counted: false });
  }

  // The IP is only ever used inside this one-way, one-day hash.
  const day = utcDay();
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const visitor = (await sha256Hex(`${day}|${id}|${ip}|${env.VIEW_SALT ?? ""}`)).slice(0, 32);
  const insert = await env.DB.prepare("INSERT OR IGNORE INTO view_visitors (id, day, visitor) VALUES (?, ?, ?)")
    .bind(id, day, visitor)
    .run();
  const counted = (insert.meta?.changes ?? 0) > 0;
  if (!counted) return json({ id: username, views: await read(), counted });

  const row = await env.DB.prepare(
    "INSERT INTO view_counts (id, views) VALUES (?, 1) ON CONFLICT(id) DO UPDATE SET views = views + 1 RETURNING views",
  )
    .bind(id)
    .first();
  if (Math.random() < 0.05) {
    const cutoff = utcDay(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000));
    context.waitUntil(env.DB.prepare("DELETE FROM view_visitors WHERE day < ?").bind(cutoff).run());
  }
  return json({ id: username, views: row.views, counted });
}

// ---------- invites (admins) ----------

const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no look-alikes (0/O, 1/I)

const newInviteCode = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(10)), (byte) => INVITE_ALPHABET[byte % INVITE_ALPHABET.length]).join("");

// GET /api/invites -> list;  POST /api/invites { count } -> create, then list
export async function invites({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return fail(401, "unauthorized");
  if (!isAdmin(env, user)) return fail(403, "forbidden");

  if (request.method === "POST") {
    if (!sameOrigin(request)) return fail(403, "cross_origin");
    let count = 1;
    try {
      count = Math.min(20, Math.max(1, Math.floor(Number((await request.json())?.count)) || 1));
    } catch {
      count = 1;
    }
    const now = Date.now();
    await env.DB.batch(
      Array.from({ length: count }, () =>
        env.DB.prepare("INSERT INTO invites (code, created_by, created_at) VALUES (?, ?, ?)").bind(
          newInviteCode(),
          user.id,
          now,
        ),
      ),
    );
  }

  const rows = await env.DB.prepare(
    "SELECT invites.code, invites.created_at, invites.used_at, users.discord_username AS used_by, profiles.username AS profile " +
      "FROM invites LEFT JOIN users ON users.id = invites.used_by LEFT JOIN profiles ON profiles.user_id = invites.used_by " +
      "ORDER BY invites.created_at DESC, invites.code LIMIT 200",
  ).all();
  return json({
    invites: rows.results.map((row) => ({
      code: row.code,
      createdAt: row.created_at,
      usedAt: row.used_at,
      usedBy: row.used_by ?? null,
      profile: row.profile ?? null,
    })),
  });
}

// ---------- uploads ----------

// extension -> [content type, max size in MB]. Anything else (html, svg, ...) is refused.
const UPLOAD_TYPES = {
  png: ["image/png", 8],
  jpg: ["image/jpeg", 8],
  jpeg: ["image/jpeg", 8],
  webp: ["image/webp", 8],
  gif: ["image/gif", 8],
  cur: ["image/x-icon", 1],
  mp3: ["audio/mpeg", 20],
  ogg: ["audio/ogg", 20],
  wav: ["audio/wav", 20],
  m4a: ["audio/mp4", 20],
  mp4: ["video/mp4", 50],
  webm: ["video/webm", 50],
};
const USER_QUOTA_BYTES = 250 * 1024 * 1024;

export const mediaContentType = (key) => UPLOAD_TYPES[String(key).split(".").pop().toLowerCase()]?.[0] ?? "";

// POST /api/upload  (multipart form, field "file") -> { url }
export async function upload({ request, env }) {
  if (!sameOrigin(request)) return fail(403, "cross_origin");
  const user = await getUser(request, env);
  if (!user) return fail(401, "unauthorized");
  if (!env.MEDIA) return fail(503, "uploads_not_configured");

  let file;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return fail(400, "invalid_upload");
  }
  if (!file || typeof file === "string") return fail(400, "invalid_upload");

  const ext = String(file.name ?? "").split(".").pop().toLowerCase();
  const rule = UPLOAD_TYPES[ext];
  if (!rule) return fail(415, "unsupported_type", { allowed: Object.keys(UPLOAD_TYPES) });
  const [contentType, maxMb] = rule;
  if (file.size > maxMb * 1024 * 1024) return fail(413, "too_large", { maxMb });

  const usage = await env.DB.prepare("SELECT COALESCE(SUM(size), 0) AS total FROM media WHERE user_id = ?")
    .bind(user.id)
    .first();
  if (usage.total + file.size > USER_QUOTA_BYTES) return fail(413, "quota_exceeded");

  const random = Array.from(crypto.getRandomValues(new Uint8Array(12)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  const key = `${user.id}/${random}.${ext}`;
  await env.MEDIA.put(key, file, { httpMetadata: { contentType } });
  await env.DB.prepare("INSERT INTO media (key, user_id, size, type, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(key, user.id, file.size, contentType, Date.now())
    .run();
  return json({ url: `/media/${key}`, size: file.size });
}
